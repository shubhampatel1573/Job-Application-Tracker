"""
applications/tests.py - Job Application Tests
"""

from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import JobApplication

User = get_user_model()


def create_test_user(username='user1', email='user1@test.com', password='TestPass123!'):
    return User.objects.create_user(username=username, email=email, password=password)


def authenticate_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')


def create_application(user, **kwargs):
    defaults = {
        'user': user,
        'job_title': 'Software Engineer',
        'company_name': 'Tech Corp',
        'application_date': date.today(),
        'status': JobApplication.Status.APPLIED,
        'job_type': JobApplication.JobType.REMOTE,
        'employment_type': JobApplication.EmploymentType.FULL_TIME,
    }
    defaults.update(kwargs)
    return JobApplication.objects.create(**defaults)


class ApplicationCRUDTests(APITestCase):
    """Test basic CRUD operations for job applications."""

    def setUp(self):
        self.user = create_test_user()
        authenticate_client(self.client, self.user)
        self.list_url = reverse('application-list')

    def test_create_application(self):
        """User can create a new job application."""
        data = {
            'job_title': 'Python Developer',
            'company_name': 'Google',
            'application_date': str(date.today()),
            'status': 'applied',
            'job_type': 'remote',
            'employment_type': 'full_time',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobApplication.objects.count(), 1)
        self.assertEqual(JobApplication.objects.first().user, self.user)

    def test_list_own_applications(self):
        """User sees only their own applications."""
        other_user = create_test_user('user2', 'user2@test.com')
        create_application(self.user, company_name='My Company')
        create_application(other_user, company_name='Other Company')

        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # User should only see 1 application (their own)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['company_name'], 'My Company')

    def test_retrieve_application(self):
        """User can retrieve their application by ID."""
        app = create_application(self.user)
        url = reverse('application-detail', kwargs={'pk': app.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company_name'], 'Tech Corp')

    def test_update_application(self):
        """User can update their application."""
        app = create_application(self.user)
        url = reverse('application-detail', kwargs={'pk': app.id})
        response = self.client.patch(url, {'status': 'shortlisted'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        app.refresh_from_db()
        self.assertEqual(app.status, 'shortlisted')

    def test_delete_application(self):
        """User can delete their application."""
        app = create_application(self.user)
        url = reverse('application-detail', kwargs={'pk': app.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(JobApplication.objects.count(), 0)

    def test_cross_user_access_denied(self):
        """User cannot access another user's application."""
        other_user = create_test_user('user2', 'user2@test.com')
        other_app = create_application(other_user)

        url = reverse('application-detail', kwargs={'pk': other_app.id})
        response = self.client.get(url)
        # Should return 404 because get_queryset() filters by user
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cross_user_delete_denied(self):
        """User cannot delete another user's application."""
        other_user = create_test_user('user2', 'user2@test.com')
        other_app = create_application(other_user)

        url = reverse('application-detail', kwargs={'pk': other_app.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Other user's application should still exist
        self.assertTrue(JobApplication.objects.filter(id=other_app.id).exists())

    def test_unauthenticated_access_denied(self):
        """Unauthenticated requests are rejected."""
        self.client.credentials()  # Remove auth
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ApplicationFilterTests(APITestCase):
    """Test search, filtering, and sorting."""

    def setUp(self):
        self.user = create_test_user()
        authenticate_client(self.client, self.user)
        self.list_url = reverse('application-list')

        # Create test applications with different statuses and types
        create_application(self.user, company_name='Google', status='applied', job_type='remote')
        create_application(self.user, company_name='Amazon', status='rejected', job_type='onsite')
        create_application(self.user, company_name='Microsoft', status='shortlisted', job_type='hybrid')

    def test_filter_by_status(self):
        """Filter applications by status."""
        response = self.client.get(self.list_url + '?status=applied')
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['company_name'], 'Google')

    def test_filter_by_job_type(self):
        """Filter applications by job type."""
        response = self.client.get(self.list_url + '?job_type=remote')
        self.assertEqual(response.data['count'], 1)

    def test_search_by_company_name(self):
        """Search applications by company name."""
        response = self.client.get(self.list_url + '?search=Amazon')
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['company_name'], 'Amazon')

    def test_pagination(self):
        """Response includes pagination metadata."""
        response = self.client.get(self.list_url)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertIn('results', response.data)
