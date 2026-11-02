"""
interviews/admin.py - Django Admin for Interviews
"""

from django.contrib import admin
from .models import Interview


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = [
        'round', 'application', 'user', 'interview_type',
        'interview_date', 'interview_time', 'status', 'interview_mode'
    ]
    search_fields = [
        'application__company_name', 'application__job_title',
        'user__username', 'round', 'interviewer_name'
    ]
    list_filter = ['interview_type', 'interview_mode', 'status', 'interview_date']
    date_hierarchy = 'interview_date'
    ordering = ['-interview_date']
    readonly_fields = ['created_at', 'updated_at']
