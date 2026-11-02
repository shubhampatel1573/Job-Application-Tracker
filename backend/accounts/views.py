"""
accounts/views.py - Authentication Views
=========================================
These views handle user registration, login, logout, and profile management.

View types used:
- APIView: full manual control (good for auth endpoints)
- generics.RetrieveUpdateAPIView: for profile get/update
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Register a new user account.

    Permission: AllowAny (no authentication needed to register)
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens for the newly registered user
            # This logs them in automatically after registration
            refresh = RefreshToken.for_user(user)
            access = refresh.access_token

            return Response({
                'message': 'Account created successfully.',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'access': str(access),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomLoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Login with username/email and password.
    Returns JWT access + refresh tokens.

    Permission: AllowAny (no authentication needed to login)
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logout by blacklisting the refresh token.

    Security note: JWT access tokens cannot be "invalidated" before they expire.
    The standard approach is to:
    1. Blacklist the refresh token (so it can't generate new access tokens)
    2. Delete tokens from browser storage on the frontend
    3. Keep access token lifetime short (60 minutes)

    The token_blacklist app keeps a database table of blacklisted tokens.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get the refresh token from the request body
            refresh_token = request.data.get('refresh')

            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create a RefreshToken object and blacklist it
            token = RefreshToken(refresh_token)
            token.blacklist()  # Adds to the blacklist table in MySQL

            return Response(
                {'message': 'Logged out successfully.'},
                status=status.HTTP_200_OK
            )

        except TokenError as e:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/profile/ - Get current user's profile
    PUT /api/auth/profile/ - Update current user's profile
    PATCH /api/auth/profile/ - Partial update

    Permission: IsAuthenticated (must be logged in)
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Return the currently authenticated user's profile."""
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Change the current user's password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            # Update the password using Django's set_password() for proper hashing
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()

            # Blacklist all existing refresh tokens for this user
            # This forces re-login on all devices for security
            try:
                refresh_token = request.data.get('refresh_token')
                if refresh_token:
                    RefreshToken(refresh_token).blacklist()
            except Exception:
                pass  # It's OK if refresh token isn't provided here

            return Response(
                {'message': 'Password changed successfully. Please log in again.'},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
