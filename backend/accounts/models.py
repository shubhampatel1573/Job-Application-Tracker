"""
accounts/models.py - Custom User Model
=======================================
We extend Django's AbstractUser to create our own User model.

WHY extend AbstractUser?
- Django's default User model works fine, but extending it gives us flexibility
  to add custom fields later (like profile picture, bio, etc.)
- Django strongly recommends defining a custom user model at the START of the project
- Once migrations are created, switching is very difficult
- AbstractUser keeps all built-in Django auth features (password hashing, permissions, etc.)

AbstractUser provides these fields automatically:
- username
- email
- first_name
- last_name
- password (hashed automatically by Django)
- is_staff, is_active, is_superuser
- last_login, date_joined
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    AbstractUser already provides username, email, first_name, last_name,
    password (hashed), date_joined, etc. We make email required and unique.
    """

    # Override email field to make it unique and required
    # In the default Django User, email is optional and not unique
    email = models.EmailField(
        unique=True,
        help_text='Required. A valid email address.'
    )

    # Optional profile fields (can be expanded later)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    resume_url = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    # Timestamps are already provided by AbstractUser (date_joined, last_login)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'                  # Custom table name in MySQL
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),  # Index email for faster lookups
        ]

    def __str__(self):
        return f"{self.username} ({self.email})"

    def get_full_name(self):
        """Return first + last name, or username if names not set."""
        full_name = super().get_full_name()
        return full_name if full_name.strip() else self.username
