"""analytics/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    path('analytics/overview/', views.OverviewView.as_view(), name='analytics-overview'),
    path('analytics/status/', views.StatusStatsView.as_view(), name='analytics-status'),
    path('analytics/monthly/', views.MonthlyStatsView.as_view(), name='analytics-monthly'),
]
