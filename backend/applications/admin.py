"""
applications/admin.py - Django Admin for Job Applications
"""

from django.contrib import admin
from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    """Admin configuration for Job Applications."""

    list_display = [
        'job_title', 'company_name', 'user', 'status',
        'job_type', 'employment_type', 'application_date', 'deadline'
    ]
    search_fields = ['job_title', 'company_name', 'user__username', 'user__email']
    list_filter = ['status', 'job_type', 'employment_type', 'application_date']
    date_hierarchy = 'application_date'
    ordering = ['-application_date']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Job Details', {
            'fields': ('job_title', 'company_name', 'company_website', 'job_url', 'description')
        }),
        ('Location & Type', {
            'fields': ('location', 'job_type', 'employment_type', 'salary_range')
        }),
        ('Application Status', {
            'fields': ('status', 'application_date', 'deadline')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('System', {
            'fields': ('user', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
