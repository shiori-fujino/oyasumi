from rest_framework import serializers
from django.utils.text import slugify
from django.contrib.auth.models import User

from .models import FeedPost, BoardPost, Profile


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ["username", "email", "role", "work_category", "location", "bio"]
        read_only_fields = ["username", "email", "role"]
        
class FeedPostSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = FeedPost
        fields = ["id", "image", "caption", "created_at"]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class FeedPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedPost
        fields = ["image", "caption"]


class BoardListSerializer(serializers.ModelSerializer):
    pretty_slug = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = BoardPost
        fields = [
            "id",
            "category",
            "title",
            "pretty_slug",
            "thumbnail",
            "created_at",
            "expires_at",
            "is_expired",
            "views",
            "status",
        ]

    def get_pretty_slug(self, obj):
        title_slug = slugify(obj.title) or "post"
        return f"{obj.id}-{title_slug}"

    def get_is_expired(self, obj):
        return obj.is_expired()
    def get_thumbnail(self, obj):
        if obj.thumbnail_url:
            return obj.thumbnail_url

        request = self.context.get("request")
        if obj.thumbnail:
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None


class BoardDetailSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    pretty_slug = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = BoardPost
        fields = [
            "id",
            "category",
            "title",
            "pretty_slug",
            "thumbnail",
            "body",
            "author",
            "author_username",
            "created_at",
            "expires_at",
            "is_expired",
            "views",
            "status",
        ]

    def get_pretty_slug(self, obj):
        title_slug = slugify(obj.title) or "post"
        return f"{obj.id}-{title_slug}"

    def get_is_expired(self, obj):
        return obj.is_expired()
    def get_thumbnail(self, obj):
        if obj.thumbnail_url:
            return obj.thumbnail_url

        request = self.context.get("request")
        if obj.thumbnail:
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None


class BoardWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardPost
        fields = ["author", "category", "title", "body", "thumbnail"]


class BoardEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardPost
        fields = ["title", "body"]


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "role"]

    def validate_role(self, value):
        allowed_roles = ["admin", "shop", "client", "girl"]
        if value not in allowed_roles:
            raise serializers.ValidationError("Invalid role.")
        return value

    def validate_email(self, value):
        email = value.strip().lower()
        if not email:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already exists.")
        return email

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Username already exists.")
        return username

    def create(self, validated_data):
        role = validated_data.pop("role")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=False,
        )

        Profile.objects.create(user=user, role=role)
        return user