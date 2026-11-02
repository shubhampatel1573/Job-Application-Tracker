"""
applications/views.py - Job Application ViewSet
================================================
We use ModelViewSet which provides all CRUD operations automatically:
- list()   -> GET /api/applications/
- create() -> POST /api/applications/
- retrieve() -> GET /api/applications/{id}/
- update() -> PUT /api/applications/{id}/
- partial_update() -> PATCH /api/applications/{id}/
- destroy() -> DELETE /api/applications/{id}/

KEY SECURITY FEATURE: get_queryset() filters by request.user
This ensures users can ONLY see and modify their OWN applications.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import JobApplication
from .serializers import JobApplicationSerializer, JobApplicationListSerializer
from .filters import JobApplicationFilter


class JobApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for complete CRUD operations on Job Applications.

    Features:
    - User-specific data isolation (can't access other users' applications)
    - Search by company name and job title
    - Filter by status, job type, employment type, location, date range
    - Sort by application_date, company_name, created_at, status
    - Pagination (10 per page by default)
    """

    # All endpoints require authentication
    permission_classes = [IsAuthenticated]

    # Filtering configuration
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = JobApplicationFilter

    # SearchFilter: ?search=google  (searches these fields)
    search_fields = ['company_name', 'job_title', 'location', 'notes']

    # OrderingFilter: ?ordering=-application_date (- means descending)
    ordering_fields = ['application_date', 'company_name', 'created_at', 'status', 'deadline']
    ordering = ['-application_date']  # Default ordering

    def get_queryset(self):
        """
        CRITICAL SECURITY METHOD:
        Always filter by the authenticated user.
        This prevents cross-user data access even if someone guesses an ID.

        Example: If user A's application has ID=5, user B cannot access
        GET /api/applications/5/ because the queryset filters out other users' records.
        """
        return JobApplication.objects.filter(
            user=self.request.user
        ).select_related('user')  # select_related() avoids N+1 queries

    def get_serializer_class(self):
        """
        Use lightweight serializer for list view, full serializer for detail/create/update.
        This reduces JSON response size in list views.
        """
        if self.action == 'list':
            return JobApplicationListSerializer
        return JobApplicationSerializer

    def perform_create(self, serializer):
        """
        Called when creating a new application.
        The user is automatically set to the logged-in user.
        We use HiddenField(CurrentUserDefault()) in the serializer,
        but we also explicitly set it here as a safety measure.
        """
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to provide a custom success message.
        The default just returns 204 No Content with empty body.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Job application deleted successfully.'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='status-counts')
    def status_counts(self, request):
        """
        GET /api/applications/status-counts/
        Returns count of applications grouped by status.
        Used for dashboard widgets.

        Uses Django ORM's values() + annotate() for SQL GROUP BY.
        """
        from django.db.models import Count

        queryset = self.get_queryset()
        counts = queryset.values('status').annotate(count=Count('id'))

        # Convert to a dict for easy frontend consumption
        result = {item['status']: item['count'] for item in counts}
        return Response(result)
