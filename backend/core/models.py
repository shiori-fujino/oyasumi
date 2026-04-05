from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta
from django.utils import timezone
from django.utils.text import slugify


def default_expires_at():
    return timezone.now() + timedelta(hours=24)


class Profile(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("shop", "Shop"),
        ("client", "Client"),
        ("girl", "Girl"),
    ]
    WORK_CATEGORY_CHOICES = [
        ("ktv", "KTV"),
        ("massage", "Massage"),
        ("full_service", "Full Service"),
        ("escort", "Escort"),
        ("independent", "Independent"),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    work_category = models.CharField(max_length=30, choices=WORK_CATEGORY_CHOICES, blank=True)
    location = models.TextField(blank=True)
    bio = models.TextField(blank=True)


class BoardPostQuerySet(models.QuerySet):
    def active(self):
        now = timezone.now()
        return self.filter(
            models.Q(category="promo", expires_at__gt=now) |
            ~models.Q(category="promo")
        )

    def public_visible(self):
        return self.filter(status="approved").active()


class BoardPost(models.Model):
    CATEGORY_CHOICES = [
        ("news", "News"),
        ("blog", "Blog"),
        ("jobs", "Jobs"),
        ("promo", "Promotions"),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, blank=True)
    thumbnail = models.ImageField(upload_to="board_thumbnails/", null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    body = models.TextField()
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("deleted", "Deleted"),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")

    objects = BoardPostQuerySet.as_manager()

    def is_expired(self):
        return (
            self.category == "promo"
            and self.expires_at is not None
            and self.expires_at <= timezone.now()
        )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)

        if self.category == "promo":
            if self.created_at:
                self.expires_at = self.created_at + timedelta(days=7)
            elif not self.expires_at:
                self.expires_at = timezone.now() + timedelta(days=7)
        else:
            self.expires_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id}. [{self.status}] [{self.category}] {self.title}"


class FeedPost(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to="feed/", null=True, blank=True)
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expires_at)