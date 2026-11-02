"""
applications/models.py - Job Application Model
===============================================
This model represents a single job application submitted by a user.

Key Django ORM concepts demonstrated here:
- ForeignKey: Many-to-one relationship (many applications belong to one user)
- TextChoices: Enum-like choices stored as short strings in the database
- auto_now_add: Set timestamp automatically on creation
- auto_now: Update timestamp automatically on each save
- db_index: Add a database index for faster queries
"""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class JobApplication(models.Model):
    """
    Represents a single job application in the tracker.

    Each application belongs to one User (via ForeignKey).
    A user can have many applications (one-to-many relationship).
    """

    # =========================================================
    # CHOICE ENUMERATIONS
    # Using TextChoices creates enum-like constants while storing
    # short strings in the database (memory efficient)
    # =========================================================

    class JobType(models.TextChoices):
        REMOTE = 'remote', 'Remote'
        ONSITE = 'on_site', 'On-site'
        HYBRID = 'hybrid', 'Hybrid'

    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full-time'
        PART_TIME = 'part_time', 'Part-time'
        INTERNSHIP = 'internship', 'Internship'
        CONTRACT = 'contract', 'Contract'

    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        INTERVIEW_SCHEDULED = 'interview_scheduled', 'Interview Scheduled'
        INTERVIEW_COMPLETED = 'interview_completed', 'Interview Completed'
        OFFER_RECEIVED = 'offer_received', 'Offer Received'
        REJECTED = 'rejected', 'Rejected'
        WITHDRAWN = 'withdrawn', 'Withdrawn'

    # =========================================================
    # FIELDS
    # =========================================================

    # ForeignKey creates a database column `user_id` in the applications table.
    # on_delete=CASCADE: if the user is deleted, all their applications are deleted too.
    # related_name='applications': lets you do user.applications.all() from a User instance.
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='applications',
        db_index=True  # Index for faster filtering by user
    )

    # Core job details
    job_title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, db_index=True)
    company_website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)

    # Type classifications with choices
    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.ONSITE
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME
    )

    # Compensation and dates
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    application_date = models.DateField(db_index=True)
    deadline = models.DateField(blank=True, null=True)

    # Application tracking
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.APPLIED,
        db_index=True  # Index for frequent status-based filtering
    )
    job_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # auto_now_add: set only once when the record is first created
    created_at = models.DateTimeField(auto_now_add=True)
    # auto_now: update every time the record is saved
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'job_applications'
        verbose_name = 'Job Application'
        verbose_name_plural = 'Job Applications'
        # Default ordering: most recent applications first
        ordering = ['-application_date', '-created_at']
        indexes = [
            # Composite index for common query: filter by user + status
            models.Index(fields=['user', 'status']),
            # Index for date-based queries
            models.Index(fields=['user', 'application_date']),
        ]

    def __str__(self):
        return f"{self.job_title} at {self.company_name} ({self.status})"

    @property
    def is_active(self):
        """Return True if the application is still in progress."""
        inactive_statuses = [self.Status.REJECTED, self.Status.WITHDRAWN]
        return self.status not in inactive_statuses
