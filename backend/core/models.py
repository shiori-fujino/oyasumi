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
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)


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
    body = models.TextField()
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.id}. [{self.status}] [{self.category}] {self.title}"


class FeedPost(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.ImageField(upload_to="feed/", null=True, blank=True)
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expires_at)