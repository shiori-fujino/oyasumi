from django.contrib.auth.models import User
from django.db.models import F
from django.contrib.auth import authenticate

from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from .models import FeedPost, BoardPost, Profile
from .serializers import (
    FeedPostSerializer,
    FeedPostCreateSerializer,
    BoardListSerializer,
    BoardDetailSerializer,
    BoardWriteSerializer,
    BoardEditSerializer,
)


@api_view(["PATCH"])
def edit_post(request, post_id):
    if not request.user or not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        post = BoardPost.objects.get(id=post_id)
    except BoardPost.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if post.author != request.user:
        return Response(
            {"error": "Not allowed"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = BoardEditSerializer(post, data=request.data, partial=True)

    if serializer.is_valid():
        updated_post = serializer.save()
        updated_post.status = "pending"
        updated_post.save(update_fields=["status"])

        return Response({
            "message": "Post updated successfully.",
            "post": BoardEditSerializer(updated_post).data,
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def approve_post(request, post_id):
    if not request.user.is_staff:
        return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

    try:
        post = BoardPost.objects.get(id=post_id)
    except BoardPost.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    post.status = "approved"
    post.save(update_fields=["status"])

    return Response({"message": "Approved"})


class MyPostsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        posts = (
            BoardPost.objects
            .filter(author=request.user)
            .order_by("-created_at")
        )
        serializer = BoardListSerializer(posts, many=True)
        return Response(serializer.data)


@api_view(["POST"])
def signup_view(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()
    role = request.data.get("role", "").strip()

    if not username or not password or not role:
        return Response(
            {"error": "Username, password, and role are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role not in ["admin", "shop", "client", "girl"]:
        return Response(
            {"error": "Invalid role."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(username=username, password=password)
    Profile.objects.create(user=user, role=role)

    return Response(
        {
            "message": "User created successfully.",
            "username": user.username,
            "role": role,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "POST"])
def board_list(request):
    if request.method == "GET":
        sort = request.GET.get("sort", "latest")
        category = request.GET.get("category", "all")
        page = int(request.GET.get("page", 1))
        page_size = 10

        posts = BoardPost.objects.public_visible()

        if category != "all":
            posts = posts.filter(category=category)

        if sort == "views":
            posts = posts.order_by("-views", "-created_at")
        else:
            posts = posts.order_by("-created_at")

        total_count = posts.count()
        total_pages = (total_count + page_size - 1) // page_size

        if total_pages == 0:
            total_pages = 1

        if page < 1:
            page = 1
        if page > total_pages:
            page = total_pages

        start = (page - 1) * page_size
        end = start + page_size
        paged_posts = posts[start:end]

        serializer = BoardListSerializer(paged_posts, many=True)

        return Response({
            "results": serializer.data,
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
            "sort": sort,
            "category": category,
        })

    if not request.user or not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    profile = Profile.objects.filter(user=request.user).first()
    if not profile:
        return Response(
            {"error": "Profile not found"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category = request.data.get("category")
    title = request.data.get("title")
    body = request.data.get("body")
    role = profile.role

    if role == "admin":
        allowed_categories = ["news", "blog", "jobs", "promo"]
    elif role == "shop":
        allowed_categories = ["blog", "jobs", "promo"]
    elif role == "girl":
        allowed_categories = ["blog"]
    elif role == "client":
        allowed_categories = []
    else:
        allowed_categories = []

    if category not in allowed_categories:
        return Response(
            {"error": f"Role '{role}' cannot write category '{category}'."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = BoardWriteSerializer(
        data={
            "author": request.user.id,
            "category": category,
            "title": title,
            "body": body,
        }
    )

    if serializer.is_valid():
        post = serializer.save()
        return Response(
            BoardDetailSerializer(post).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def board_detail(request, slug):
    try:
        post_id = int(slug.split("-")[0])
    except (ValueError, IndexError):
        return Response(
            {"error": "Invalid slug"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        post = BoardPost.objects.get(id=post_id)
    except BoardPost.DoesNotExist:
        return Response(
            {"error": "Post not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if post.category == "promo" and post.is_expired():
        if not request.user.is_authenticated or post.author != request.user:
            return Response(
                {"error": "Post not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    post.views = F("views") + 1
    post.save(update_fields=["views"])
    post.refresh_from_db()

    serializer = BoardDetailSerializer(post)
    return Response(serializer.data)


@api_view(["GET", "POST"])
def feed_list(request):
    if request.method == "GET":
        posts = FeedPost.objects.all().order_by("-created_at")
        serializer = FeedPostSerializer(
            posts,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    if not request.user or not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    profile = Profile.objects.filter(user=request.user).first()
    if not profile:
        return Response(
            {"error": "Profile not found"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if profile.role != "girl":
        return Response(
            {"error": "Only girl users can upload feed posts."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = FeedPostCreateSerializer(data=request.data)

    if serializer.is_valid():
        post = serializer.save(author=request.user)
        read_serializer = FeedPostSerializer(
            post,
            context={"request": request},
        )
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login_view(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    user = authenticate(username=username, password=password)
    if not user:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "user_id": user.id,
        "username": user.username,
    })


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    profile = Profile.objects.filter(user=request.user).first()

    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "role": profile.role if profile else None,
    })