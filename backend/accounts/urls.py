"""
accounts/urls.py - Authentication URL Patterns
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # POST /api/auth/register/ - Create new user account
    path('register/', views.RegisterView.as_view(), name='auth-register'),

    # POST /api/auth/login/ - Login and get JWT tokens
    path('login/', views.CustomLoginView.as_view(), name='auth-login'),

    # POST /api/auth/token/refresh/ - Get new access token using refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # POST /api/auth/logout/ - Blacklist refresh token
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),

    # GET/PUT /api/auth/profile/ - View or update user profile
    path('profile/', views.ProfileView.as_view(), name='auth-profile'),

    # POST /api/auth/change-password/ - Change user password
    path('change-password/', views.ChangePasswordView.as_view(), name='auth-change-password'),
]
