from rest_framework import serializers
from django.utils.text import slugify
from .models import FeedPost, BoardPost


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

    class Meta:
        model = BoardPost
        fields = [
            "id",
            "category",
            "title",
            "pretty_slug",
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


class BoardDetailSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    pretty_slug = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = BoardPost
        fields = [
            "id",
            "category",
            "title",
            "pretty_slug",
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


class BoardWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardPost
        fields = ["author", "category", "title", "body"]


class BoardEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardPost
        fields = ["title", "body"]