import os
import requests

from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.conf import settings


def send_verification_email(user):
    print("=== send_verification_email called ===")

    resend_api_key = os.environ.get("RESEND_API_KEY")
    if not resend_api_key:
        raise Exception("RESEND_API_KEY is not set.")

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    print("VERIFY URL:", verify_url)

    subject = "Verify your email for Oyasumi Club"

    text_body = f"""Hi {user.username},

Welcome to Oyasumi Club.

Please verify your email by clicking the link below:

{verify_url}

If you didn’t create this account, you can ignore this email.
"""

    html_body = f"""
    <p>Hi {user.username},</p>
    <p>Welcome to Oyasumi Club.</p>
    <p>Please verify your email by clicking the link below:</p>
    <p><a href="{verify_url}">{verify_url}</a></p>
    <p>If you didn’t create this account, you can ignore this email.</p>
    """

    payload = {
        "from": settings.DEFAULT_FROM_EMAIL,   # 중요
        "to": [user.email],
        "subject": subject,
        "text": text_body,
        "html": html_body,
    }

    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json",
    }

    response = requests.post(
        "https://api.resend.com/emails",
        json=payload,
        headers=headers,
        timeout=10,
    )

    print("=== Resend status ===", response.status_code)
    print("=== Resend body ===", response.text)

    response.raise_for_status()  # 실패하면 여기서 터짐