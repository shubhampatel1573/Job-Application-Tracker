"""
interviews/views.py - Interview ViewSet
"""

from datetime import date
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import Interview
from .serializers import InterviewSerializer, InterviewListSerializer


class InterviewFilter(django_filters.FilterSet):
    interview_type = django_filters.ChoiceFilter(choices=Interview.InterviewType.choices)
    status = django_filters.ChoiceFilter(choices=Interview.InterviewStatus.choices)
    interview_mode = django_filters.ChoiceFilter(choices=Interview.InterviewMode.choices)
    date_after = django_filters.DateFilter(field_name='interview_date', lookup_expr='gte')
    date_before = django_filters.DateFilter(field_name='interview_date', lookup_expr='lte')

    class Meta:
        model = Interview
        fields = ['interview_type', 'status', 'interview_mode', 'date_after', 'date_before']


class InterviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Interview CRUD operations.
    All operations are scoped to the authenticated user's interviews.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = InterviewFilter
    search_fields = ['application__company_name', 'application__job_title', 'round', 'notes']
    ordering_fields = ['interview_date', 'interview_time', 'created_at', 'status']
    ordering = ['interview_date']

    def get_queryset(self):
        """Only return interviews belonging to the authenticated user."""
        return Interview.objects.filter(
            user=self.request.user
        ).select_related('application', 'user')

    def get_serializer_class(self):
        if self.action == 'list':
            return InterviewListSerializer
        return InterviewSerializer

    def perform_create(self, serializer):
        """Automatically set user to the logged-in user."""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='upcoming')
    def upcoming(self, request):
        """
        GET /api/interviews/upcoming/
        Returns interviews scheduled for today or in the future.
        """
        today = date.today()
        upcoming = self.get_queryset().filter(
            interview_date__gte=today,
            status=Interview.InterviewStatus.SCHEDULED
        ).order_by('interview_date', 'interview_time')

        serializer = InterviewListSerializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='past')
    def past(self, request):
        """
        GET /api/interviews/past/
        Returns interviews from the past.
        """
        today = date.today()
        past = self.get_queryset().filter(
            interview_date__lt=today
        ).order_by('-interview_date')

        serializer = InterviewListSerializer(past, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Interview deleted successfully.'},
            status=status.HTTP_200_OK
        )
