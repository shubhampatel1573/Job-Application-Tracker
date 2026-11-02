"""
interviews/models.py - Interview Model
=======================================
Represents a scheduled interview for a job application.

Database relationships:
- Interview -> User (ForeignKey): One user has many interviews
- Interview -> JobApplication (ForeignKey): One application can have many interview rounds
"""

from django.db import models
from django.contrib.auth import get_user_model
from applications.models import JobApplication

User = get_user_model()


class Interview(models.Model):
    """
    Represents an interview round associated with a job application.

    An application can have multiple interview rounds:
    e.g., HR screening -> Technical round -> Managerial round
    """

    class InterviewType(models.TextChoices):
        TECHNICAL = 'technical', 'Technical'
        HR = 'hr', 'HR'
        MANAGERIAL = 'managerial', 'Managerial'
        ASSESSMENT = 'assessment', 'Assessment'
        CULTURE_FIT = 'culture_fit', 'Culture Fit'

    class InterviewMode(models.TextChoices):
        ONLINE = 'online', 'Online'
        OFFLINE = 'offline', 'Offline (In-Person)'

    class InterviewStatus(models.TextChoices):
        SCHEDULED = 'scheduled', 'Scheduled'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        RESCHEDULED = 'rescheduled', 'Rescheduled'

    # Links interview to the user for quick user-scoped queries
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='interviews',
        db_index=True
    )

    # The application this interview is for
    # on_delete=CASCADE: if application is deleted, its interviews are also deleted
    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='interviews'
    )

    # Interview round descriptor (e.g., "Round 1", "Final Round")
    round = models.CharField(max_length=100, default='Round 1')

    # Date and time are stored separately for flexibility
    interview_date = models.DateField(db_index=True)
    interview_time = models.TimeField(blank=True, null=True)

    # Interview classification
    interview_type = models.CharField(
        max_length=20,
        choices=InterviewType.choices,
        default=InterviewType.TECHNICAL
    )
    interview_mode = models.CharField(
        max_length=10,
        choices=InterviewMode.choices,
        default=InterviewMode.ONLINE
    )

    # Online interview details
    meeting_link = models.URLField(blank=True, null=True)

    # Offline interview details
    location = models.CharField(max_length=300, blank=True, null=True)

    # Additional info
    notes = models.TextField(blank=True, null=True)
    interviewer_name = models.CharField(max_length=200, blank=True, null=True)

    # Current status of this interview
    status = models.CharField(
        max_length=20,
        choices=InterviewStatus.choices,
        default=InterviewStatus.SCHEDULED,
        db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'interviews'
        verbose_name = 'Interview'
        verbose_name_plural = 'Interviews'
        ordering = ['interview_date', 'interview_time']
        indexes = [
            models.Index(fields=['user', 'interview_date']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.round} - {self.application.company_name} ({self.interview_date})"

    def clean(self):
        """
        Model-level validation: ensure the application belongs to the same user.
        clean() is called during form validation and serializer validation.
        """
        from django.core.exceptions import ValidationError
        if self.application_id and self.user_id:
            if self.application.user_id != self.user_id:
                raise ValidationError(
                    "Interview's application must belong to the same user."
                )
