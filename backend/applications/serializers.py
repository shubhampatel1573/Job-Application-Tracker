"""
applications/serializers.py - Job Application Serializers
===========================================================
Serializers handle converting model instances to JSON and vice versa,
and also handle validation of incoming data.
"""

from rest_framework import serializers
from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    """
    Full serializer for Job Application - used for list and detail views.
    Includes computed fields (display labels) for choice fields.
    """

    # SerializerMethodField: computed read-only fields
    # These return human-readable labels for the choice fields
    # e.g., 'full_time' -> 'Full-time'
    status_display = serializers.SerializerMethodField()
    job_type_display = serializers.SerializerMethodField()
    employment_type_display = serializers.SerializerMethodField()

    # Read-only: the 'user' field is set automatically to request.user
    # We don't want the API caller to specify which user the application belongs to
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = JobApplication
        fields = [
            'id', 'user', 'job_title', 'company_name', 'company_website',
            'description', 'location', 'job_type', 'job_type_display',
            'employment_type', 'employment_type_display',
            'salary_range', 'application_date', 'deadline',
            'status', 'status_display', 'job_url', 'notes',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_active']

    def get_status_display(self, obj):
        """Return human-readable status label."""
        return obj.get_status_display()

    def get_job_type_display(self, obj):
        """Return human-readable job type label."""
        return obj.get_job_type_display()

    def get_employment_type_display(self, obj):
        """Return human-readable employment type label."""
        return obj.get_employment_type_display()

    def validate_application_date(self, value):
        """Allow dates up to 1 day in the future (timezone tolerance for IST/UTC diff)."""
        from datetime import date, timedelta
        if value > date.today() + timedelta(days=1):
            raise serializers.ValidationError(
                "Application date cannot be in the future."
            )
        return value


    def validate(self, attrs):
        """Cross-field validation: deadline must be after application_date."""
        application_date = attrs.get('application_date')
        deadline = attrs.get('deadline')

        if application_date and deadline and deadline < application_date:
            raise serializers.ValidationError({
                'deadline': 'Deadline must be after the application date.'
            })

        return attrs


class JobApplicationListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for list views.
    Only includes fields needed for the table view to reduce response size.
    """
    status_display = serializers.SerializerMethodField()
    employment_type_display = serializers.SerializerMethodField()
    job_type_display = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_title', 'company_name', 'location',
            'application_date', 'deadline', 'status', 'status_display',
            'employment_type', 'employment_type_display',
            'job_type', 'job_type_display', 'created_at'
        ]

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_employment_type_display(self, obj):
        return obj.get_employment_type_display()

    def get_job_type_display(self, obj):
        return obj.get_job_type_display()
