from django.contrib import admin
from .models import Profile, BoardPost, FeedPost

admin.site.register(Profile)
admin.site.register(FeedPost)

@admin.register(BoardPost)
class BoardPostAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "category", "status", "is_featured", "created_at"]
    list_filter = ["category", "status", "is_featured"]
    search_fields = ["title", "body"]