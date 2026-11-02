"""
applications/filters.py - Django Filter Configuration
======================================================
django-filter allows us to add URL-based filtering, e.g.:
GET /api/applications/?status=applied&job_type=remote

This is cleaner than manually parsing query params in views.
"""

import django_filters
from .models import JobApplication


class JobApplicationFilter(django_filters.FilterSet):
    """
    Filter set for job applications.
    Each filter corresponds to a query parameter.
    """

    # Exact match filters (e.g., ?status=applied)
    status = django_filters.ChoiceFilter(choices=JobApplication.Status.choices)
    job_type = django_filters.ChoiceFilter(choices=JobApplication.JobType.choices)
    employment_type = django_filters.ChoiceFilter(choices=JobApplication.EmploymentType.choices)

    # Case-insensitive partial match (e.g., ?location=new)
    location = django_filters.CharFilter(lookup_expr='icontains')

    # Date range filters (e.g., ?application_date_after=2024-01-01)
    application_date_after = django_filters.DateFilter(
        field_name='application_date',
        lookup_expr='gte'  # greater than or equal to
    )
    application_date_before = django_filters.DateFilter(
        field_name='application_date',
        lookup_expr='lte'  # less than or equal to
    )

    # Deadline filters
    deadline_before = django_filters.DateFilter(
        field_name='deadline',
        lookup_expr='lte'
    )

    class Meta:
        model = JobApplication
        fields = [
            'status', 'job_type', 'employment_type', 'location',
            'application_date_after', 'application_date_before',
            'deadline_before'
        ]
