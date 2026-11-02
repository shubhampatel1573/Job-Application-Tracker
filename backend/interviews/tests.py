"""interviews/tests.py - Interview Tests"""

from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from applications.models import JobApplication
from .models import Interview

User = get_user_model()


def create_user(username='user1', email='user1@test.com'):
    return User.objects.create_user(username=username, email=email, password='TestPass123!')


def auth(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')


def create_app(user):
    return JobApplication.objects.create(
        user=user, job_title='Dev', company_name='Corp',
        application_date=date.today(), status='applied',
        job_type='remote', employment_type='full_time'
    )


def create_interview(user, application, **kwargs):
    defaults = {
        'user': user, 'application': application,
        'round': 'Round 1', 'interview_date': date.today() + timedelta(days=5),
        'interview_type': 'technical', 'interview_mode': 'online',
        'status': 'scheduled'
    }
    defaults.update(kwargs)
    return Interview.objects.create(**defaults)


class InterviewCRUDTests(APITestCase):
    def setUp(self):
        self.user = create_user()
        auth(self.client, self.user)
        self.application = create_app(self.user)
        self.list_url = reverse('interview-list')

    def test_create_interview(self):
        data = {
            'application': self.application.id,
            'round': 'Round 1',
            'interview_date': str(date.today() + timedelta(days=5)),
            'interview_type': 'technical',
            'interview_mode': 'online',
            'status': 'scheduled'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_schedule_interview_for_other_users_application(self):
        """Security: Cannot create interview for another user's application."""
        other_user = create_user('user2', 'user2@test.com')
        other_app = create_app(other_user)

        data = {
            'application': other_app.id,
            'round': 'Round 1',
            'interview_date': str(date.today() + timedelta(days=5)),
            'interview_type': 'technical',
            'interview_mode': 'online',
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upcoming_interviews_endpoint(self):
        create_interview(self.user, self.application)
        response = self.client.get(reverse('interview-upcoming'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
