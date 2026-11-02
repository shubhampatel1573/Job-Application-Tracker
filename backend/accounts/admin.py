"""
accounts/admin.py - Django Admin Configuration for Users
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin configuration for the custom User model.
    Extends Django's built-in UserAdmin to add our custom fields.
    """

    # Fields to display in the user list view
    list_display = [
        'username', 'email', 'first_name', 'last_name',
        'is_staff', 'is_active', 'date_joined'
    ]

    # Fields that can be searched in admin
    search_fields = ['username', 'email', 'first_name', 'last_name']

    # Sidebar filters
    list_filter = ['is_staff', 'is_active', 'is_superuser', 'date_joined']

    # Date hierarchy for easy navigation
    date_hierarchy = 'date_joined'

    # Default ordering: newest users first
    ordering = ['-date_joined']

    # Add our custom fields to the admin form sections
    # UserAdmin.fieldsets contains the default sections; we add a new "Profile" section
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': (
                'phone_number', 'location', 'linkedin_url',
                'github_url', 'resume_url', 'bio'
            )
        }),
    )

    # Fields shown when adding a new user via admin
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Personal Info', {
            'fields': ('email', 'first_name', 'last_name')
        }),
    )
