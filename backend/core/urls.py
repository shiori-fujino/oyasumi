from django.urls import path
from .views import (
    feed_list,
    board_list,
    board_detail,
    me_view,
    MyPostsView,
    edit_post,
    SignupView,
    login_view,
    VerifyEmailView,
    ResendVerificationView,
    delete_post,
    featured_posts,
)
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path("feed/", feed_list),
    path("board/", board_list),
    path("board/featured/", featured_posts),
    path("board/<str:slug>/", board_detail),
    path("login/", login_view, name="login"),
    path("me/", me_view),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),
    path("signup/", SignupView.as_view(), name="signup"),
    path("my-posts/", MyPostsView.as_view()),
    path("board/<int:post_id>/edit/", edit_post),
    path("board/<int:post_id>/delete/", delete_post),
    
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)