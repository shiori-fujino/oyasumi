# core/utils.py
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.conf import settings


def send_verification_email(user):
    print("=== send_verification_email called ===")
    print("EMAIL_BACKEND:", settings.EMAIL_BACKEND)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
    print("VERIFY URL:", verify_url)

    subject = "Verify your email for Oyasumi Club"
    message = render_to_string("emails/verify_email.txt", {
        "user": user,
        "verify_url": verify_url,
    })

    print("=== email body preview ===")
    print(message)

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

    print("=== send_mail finished ===")