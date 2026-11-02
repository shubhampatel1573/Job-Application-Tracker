"""
applications/urls.py - Application URL patterns
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# DefaultRouter automatically creates URL patterns for all ViewSet actions:
# GET    /applications/        -> list
# POST   /applications/        -> create
# GET    /applications/{id}/   -> retrieve
# PUT    /applications/{id}/   -> update
# PATCH  /applications/{id}/   -> partial_update
# DELETE /applications/{id}/   -> destroy
router = DefaultRouter()
router.register(r'applications', views.JobApplicationViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
]
