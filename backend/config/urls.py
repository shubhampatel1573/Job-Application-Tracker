"""
Root URL Configuration for Job Application Tracker Backend
==========================================================
All API routes are organized under /api/ prefix.
Swagger documentation is available at /api/docs/
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    # Django Admin panel
    path('admin/', admin.site.urls),

    # Authentication APIs: /api/auth/register/, /api/auth/login/, etc.
    path('api/auth/', include('accounts.urls')),

    # Job Application APIs: /api/applications/
    path('api/', include('applications.urls')),

    # Interview APIs: /api/interviews/
    path('api/', include('interviews.urls')),

    # Analytics APIs: /api/analytics/
    path('api/', include('analytics.urls')),

    # OpenAPI schema (machine-readable JSON)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI documentation: http://localhost:8000/api/docs/
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ReDoc documentation: http://localhost:8000/api/redoc/
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
