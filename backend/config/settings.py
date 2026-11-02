"""
Django Settings for Job Application Tracker
==========================================
This settings file configures the entire Django backend including:
- Database (MySQL)
- Installed apps
- JWT Authentication
- CORS headers
- REST Framework
- Swagger/OpenAPI documentation

All sensitive values are loaded from .env using python-dotenv.
"""

import os
from pathlib import Path
from datetime import timedelta

# python-dotenv loads environment variables from the .env file
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file from the backend directory
load_dotenv(BASE_DIR / '.env')

# ============================================================
# SECURITY SETTINGS
# ============================================================
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ============================================================
# INSTALLED APPLICATIONS
# ============================================================
INSTALLED_APPS = [
    # Django built-in apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party packages
    'rest_framework',                      # Django REST Framework for building APIs
    'rest_framework_simplejwt',            # JWT authentication
    'rest_framework_simplejwt.token_blacklist',  # Token blacklisting for logout
    'corsheaders',                         # Cross-Origin Resource Sharing
    'django_filters',                      # Advanced filtering for APIs
    'drf_spectacular',                     # OpenAPI/Swagger documentation

    # Our custom applications
    'accounts',         # User authentication and profile management
    'applications',     # Job application CRUD
    'interviews',       # Interview scheduling and management
    'analytics',        # Dashboard analytics
]

# ============================================================
# MIDDLEWARE
# ============================================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',        # Must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ============================================================
# DATABASE CONFIGURATION - MySQL
# ============================================================
# We use PyMySQL as a MySQL driver (pure Python, no C extensions needed)
# This avoids mysqlclient C compilation issues on Windows

import pymysql
# Install PyMySQL as a MySQLdb replacement
pymysql.install_as_MySQLdb()

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'job_tracker_db'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            # This ensures proper Unicode support including emojis
        },
        'TEST': {
            # Use a separate database for running tests
            'NAME': 'test_job_tracker_db',
        },
    }
}

# ============================================================
# CUSTOM USER MODEL
# ============================================================
# Django's default User model is replaced with our custom one
# This MUST be set before running the first migration
AUTH_USER_MODEL = 'accounts.User'

# ============================================================
# PASSWORD VALIDATION
# ============================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================
# INTERNATIONALIZATION
# ============================================================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ============================================================
# STATIC FILES
# ============================================================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ============================================================
# MEDIA FILES (for future file uploads)
# ============================================================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================
# DJANGO REST FRAMEWORK CONFIGURATION
# ============================================================
REST_FRAMEWORK = {
    # Default authentication: JWT Bearer tokens
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # Default permission: user must be logged in
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Filtering backend: enables ?search= and ?ordering= query params
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # Pagination: return pages of 10 items by default
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    # Schema generation for Swagger docs
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ============================================================
# JWT CONFIGURATION (Simple JWT)
# ============================================================
SIMPLE_JWT = {
    # How long an access token is valid (60 minutes default)
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('ACCESS_TOKEN_LIFETIME', '60'))),
    # How long a refresh token is valid (7 days default)
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('REFRESH_TOKEN_LIFETIME', '7'))),
    # Rotate refresh tokens for extra security
    'ROTATE_REFRESH_TOKENS': True,
    # Blacklist old refresh tokens after rotation
    'BLACKLIST_AFTER_ROTATION': True,
    # JWT signing algorithm
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    # Token header format: "Authorization: Bearer <token>"
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
}

# ============================================================
# CORS CONFIGURATION (Cross-Origin Resource Sharing)
# ============================================================
# Allow the React frontend (running on port 5173) to call our APIs

CORS_ALLOWED_ORIGINS_LIST = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173'
).split(',')

CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_LIST]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# ============================================================
# DRF SPECTACULAR (Swagger / OpenAPI)
# ============================================================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Job Application Tracker API',
    'DESCRIPTION': 'A professional full-stack Job Application Tracker with JWT authentication, '
                   'CRUD operations, interview scheduling, and analytics.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}
