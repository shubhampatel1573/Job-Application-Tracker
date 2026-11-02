"""
interviews/serializers.py - Interview Serializers
"""

from rest_framework import serializers
from .models import Interview
from applications.models import JobApplication


class InterviewSerializer(serializers.ModelSerializer):
    """Full interview serializer with validation and nested info."""

    # Display fields for choice values
    interview_type_display = serializers.SerializerMethodField()
    interview_mode_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    # Nested read-only fields from the related application
    company_name = serializers.CharField(source='application.company_name', read_only=True)
    job_title = serializers.CharField(source='application.job_title', read_only=True)

    # Hidden field: automatically set to the current user
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Interview
        fields = [
            'id', 'user', 'application', 'company_name', 'job_title',
            'round', 'interview_date', 'interview_time',
            'interview_type', 'interview_type_display',
            'interview_mode', 'interview_mode_display',
            'meeting_link', 'location', 'notes', 'interviewer_name',
            'status', 'status_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'company_name', 'job_title', 'created_at', 'updated_at']

    def get_interview_type_display(self, obj):
        return obj.get_interview_type_display()

    def get_interview_mode_display(self, obj):
        return obj.get_interview_mode_display()

    def get_status_display(self, obj):
        return obj.get_status_display()

    def validate_application(self, value):
        """
        SECURITY CHECK: Ensure the selected application belongs to the current user.
        This prevents a user from scheduling interviews for another user's applications.
        """
        request = self.context.get('request')
        if request and value.user != request.user:
            raise serializers.ValidationError(
                "You can only schedule interviews for your own job applications."
            )
        return value


class InterviewListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for interview list view."""
    interview_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='application.company_name', read_only=True)
    job_title = serializers.CharField(source='application.job_title', read_only=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'company_name', 'job_title', 'round',
            'interview_date', 'interview_time', 'interview_type',
            'interview_type_display', 'interview_mode', 'status', 'status_display'
        ]

    def get_interview_type_display(self, obj):
        return obj.get_interview_type_display()

    def get_status_display(self, obj):
        return obj.get_status_display()
