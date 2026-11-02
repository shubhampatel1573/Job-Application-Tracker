"""
analytics/views.py - Analytics API Views
=========================================
These views compute real-time statistics from MySQL using Django ORM.

Key Django ORM aggregation functions used:
- Count(): SQL COUNT()
- Q(): Complex queries with AND/OR conditions
- values() + annotate(): SQL GROUP BY
- TruncMonth(): Group dates by month
- aggregate(): Compute a single value across entire queryset
"""

from datetime import date, timedelta
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import JobApplication
from interviews.models import Interview


class OverviewView(APIView):
    """
    GET /api/analytics/overview/
    Returns high-level summary statistics for the authenticated user's dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        # Get the start of the current month
        current_month_start = today.replace(day=1)

        # Base querysets filtered to this user's data
        applications = JobApplication.objects.filter(user=user)
        interviews = Interview.objects.filter(user=user)

        # Use aggregate() to compute multiple values in a SINGLE SQL query
        # This is more efficient than multiple separate queries
        app_stats = applications.aggregate(
            total=Count('id'),
            offers=Count('id', filter=Q(status=JobApplication.Status.OFFER_RECEIVED)),
            rejections=Count('id', filter=Q(status=JobApplication.Status.REJECTED)),
            this_month=Count('id', filter=Q(application_date__gte=current_month_start)),
        )

        # Count upcoming interviews (future date, scheduled status)
        upcoming_interviews = interviews.filter(
            interview_date__gte=today,
            status=Interview.InterviewStatus.SCHEDULED
        ).count()

        total_interviews = interviews.count()

        return Response({
            'total_applications': app_stats['total'],
            'total_interviews': total_interviews,
            'total_offers': app_stats['offers'],
            'total_rejections': app_stats['rejections'],
            'upcoming_interviews': upcoming_interviews,
            'applications_this_month': app_stats['this_month'],
        })


class StatusStatsView(APIView):
    """
    GET /api/analytics/status/
    Returns application counts grouped by status.
    Used for pie/donut charts on the analytics page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # values('status'): GROUP BY status
        # annotate(count=Count('id')): COUNT(id) for each group
        # This generates: SELECT status, COUNT(id) FROM job_applications
        #                 WHERE user_id = %s GROUP BY status
        status_data = (
            JobApplication.objects
            .filter(user=user)
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )

        # Initialize all statuses to 0 so the frontend always gets all statuses
        result = {
            status_choice[0]: 0
            for status_choice in JobApplication.Status.choices
        }

        # Fill in actual counts
        for item in status_data:
            result[item['status']] = item['count']

        # Also return display labels for chart rendering
        labeled_result = [
            {
                'status': status_key,
                'label': dict(JobApplication.Status.choices).get(status_key, status_key),
                'count': count
            }
            for status_key, count in result.items()
        ]

        return Response({
            'status_distribution': labeled_result,
            'total': sum(result.values()),
        })


class MonthlyStatsView(APIView):
    """
    GET /api/analytics/monthly/
    Returns applications and interviews per month for the last 12 months.
    Used for line/bar charts showing activity trends.

    TruncMonth() is a Django ORM function that truncates a datetime to month precision.
    It's equivalent to DATE_FORMAT(application_date, '%Y-%m') in MySQL.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get data for the last 12 months
        twelve_months_ago = date.today().replace(day=1) - timedelta(days=365)

        # Applications per month - uses TruncMonth for GROUP BY month
        monthly_applications = (
            JobApplication.objects
            .filter(user=user, application_date__gte=twelve_months_ago)
            .annotate(month=TruncMonth('application_date'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        # Interviews per month
        monthly_interviews = (
            Interview.objects
            .filter(user=user, interview_date__gte=twelve_months_ago)
            .annotate(month=TruncMonth('interview_date'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        # Format the data for chart libraries (month as "Jan 2024" string)
        def format_monthly_data(queryset):
            return [
                {
                    'month': item['month'].strftime('%b %Y'),
                    'month_key': item['month'].strftime('%Y-%m'),
                    'count': item['count']
                }
                for item in queryset
                if item['month'] is not None
            ]

        return Response({
            'monthly_applications': format_monthly_data(monthly_applications),
            'monthly_interviews': format_monthly_data(monthly_interviews),
        })
