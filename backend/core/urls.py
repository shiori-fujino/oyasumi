from django.urls import path
from .views import feed_list, board_list, board_detail, login_view, me_view, signup_view, MyPostsView, edit_post

urlpatterns = [
    path("feed/", feed_list),
    path("board/", board_list),
    path("board/<str:slug>/", board_detail),
    path("login/", login_view),
    path("me/", me_view),
    path("signup/", signup_view),
    path("my-posts/", MyPostsView.as_view()),
    path("board/<int:post_id>/edit/", edit_post),
    path("feed/", feed_list),
]