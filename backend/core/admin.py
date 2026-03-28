from django.contrib import admin
from .models import Profile, BoardPost, FeedPost

admin.site.register(Profile)
admin.site.register(BoardPost)
admin.site.register(FeedPost)