"""
accounts/tests.py - Authentication Tests
==========================================
Tests cover: registration, login, JWT, profile, logout, security.
Uses DRF's APITestCase which provides a test client for making API requests.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserRegistrationTests(APITestCase):
    """Test user registration endpoint."""

    def setUp(self):
        self.url = reverse('auth-register')
        self.valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_successful_registration(self):
        """New user can register with valid data."""
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_password_mismatch(self):
        """Registration fails when passwords don't match."""
        data = {**self.valid_data, 'password_confirm': 'WrongPassword123!'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email(self):
        """Registration fails when email already exists."""
        User.objects.create_user(username='existing', email='test@example.com', password='pass')
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_username(self):
        """Registration fails when username already exists."""
        User.objects.create_user(username='testuser', email='other@example.com', password='pass')
        response = self.client.post(self.url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_weak_password_rejected(self):
        """Django's password validators reject common/weak passwords."""
        data = {**self.valid_data, 'password': '123456', 'password_confirm': '123456'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTests(APITestCase):
    """Test user login endpoint."""

    def setUp(self):
        self.url = reverse('auth-login')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='SecurePass123!'
        )

    def test_login_with_username(self):
        """User can log in with username and password."""
        response = self.client.post(self.url, {
            'username': 'testuser',
            'password': 'SecurePass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_with_email(self):
        """User can log in using email instead of username."""
        response = self.client.post(self.url, {
            'username': 'test@example.com',  # Email in username field
            'password': 'SecurePass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_password(self):
        """Login fails with wrong password."""
        response = self.client.post(self.url, {
            'username': 'testuser',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_user(self):
        """Login fails for non-existent user."""
        response = self.client.post(self.url, {
            'username': 'nobody',
            'password': 'SecurePass123!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(APITestCase):
    """Test profile GET and update endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='SecurePass123!'
        )
        self.url = reverse('auth-profile')
        # Authenticate the test client
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')

    def test_get_profile(self):
        """Authenticated user can retrieve their profile."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_update_profile(self):
        """Authenticated user can update their profile."""
        response = self.client.patch(self.url, {
            'first_name': 'John',
            'last_name': 'Doe',
            'location': 'New York'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_profile_access(self):
        """Unauthenticated request is rejected."""
        self.client.credentials()  # Remove auth headers
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
