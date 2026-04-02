from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.db.models import F
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import FeedPost, BoardPost, Profile
from .serializers import (
    FeedPostSerializer,
    FeedPostCreateSerializer,
    BoardListSerializer,
    BoardDetailSerializer,
    BoardWriteSerializer,
    BoardEditSerializer,
    SignupSerializer,
    ProfileSerializer,
)
from .utils import send_verification_email


class SignupView(APIView):
    permission_classes = []

    def post(self, request):
        print("=== SignupView hit ===")
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        print("=== about to send email ===")
        send_verification_email(user)
        print("=== email function returned ===")

        return Response(
            {"message": "Signup successful. Please check your email to verify your account."},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    permission_classes = []

    def get(self, request):
        uid = request.GET.get("uid")
        token = request.GET.get("token")

        if not uid or not token:
            return Response(
                {"error": "Invalid verification link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid verification link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Verification link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])

        return Response({"message": "Email verified successfully."})


class ResendVerificationView(APIView):
    permission_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()

        if not email:
            return Response(
                {"detail": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"message": "If that account exists and is unverified, a new email has been sent."}
            )

        if not user.is_active:
            send_verification_email(user)

        return Response(
            {"message": "If that account exists and is unverified, a new email has been sent."}
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

        return Response(
            {
                "message": "Post updated successfully.",
                "post": BoardEditSerializer(updated_post).data,
            }
        )

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
        posts = BoardPost.objects.filter(author=request.user).order_by("-created_at")
        serializer = BoardListSerializer(posts, many=True)
        return Response(serializer.data)


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

        return Response(
            {
                "results": serializer.data,
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "sort": sort,
                "category": category,
            }
        )

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
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def feed_list(request):
    if request.method == "GET":
        posts = FeedPost.objects.all().order_by("-created_at")
        serializer = FeedPostSerializer(
            posts,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

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

    if not user.is_active:
        return Response(
            {"error": "Please verify your email before logging in."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
        }
    )


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me_view(request):
    profile, _ = Profile.objects.get_or_create(
        user=request.user,
        defaults={"role": "client"},
    )

    if request.method == "GET":
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)