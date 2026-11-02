"""analytics/tests.py - Analytics Tests"""

from datetime import date
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from applications.models import JobApplication
from interviews.models import Interview

User = get_user_model()


class AnalyticsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='analyst', email='analyst@test.com', password='TestPass123!'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

        # Create test data
        for company, status_val in [
            ('Google', 'applied'), ('Amazon', 'rejected'),
            ('Meta', 'offer_received'), ('Apple', 'shortlisted')
        ]:
            JobApplication.objects.create(
                user=self.user, job_title='Dev', company_name=company,
                application_date=date.today(), status=status_val,
                job_type='remote', employment_type='full_time'
            )

    def test_overview_endpoint(self):
        response = self.client.get(reverse('analytics-overview'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_applications'], 4)
        self.assertEqual(response.data['total_offers'], 1)
        self.assertEqual(response.data['total_rejections'], 1)

    def test_status_distribution(self):
        response = self.client.get(reverse('analytics-status'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status_distribution', response.data)
        self.assertEqual(response.data['total'], 4)

    def test_monthly_stats(self):
        response = self.client.get(reverse('analytics-monthly'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('monthly_applications', response.data)
        self.assertIn('monthly_interviews', response.data)

    def test_analytics_are_user_specific(self):
        """Analytics should NOT include other users' data."""
        other_user = User.objects.create_user(
            username='other', email='other@test.com', password='TestPass123!'
        )
        JobApplication.objects.create(
            user=other_user, job_title='Dev', company_name='Other Corp',
            application_date=date.today(), status='applied',
            job_type='remote', employment_type='full_time'
        )

        response = self.client.get(reverse('analytics-overview'))
        # Should still be 4 (our user's data only)
        self.assertEqual(response.data['total_applications'], 4)

    def test_unauthenticated_denied(self):
        self.client.credentials()
        response = self.client.get(reverse('analytics-overview'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
