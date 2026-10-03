from django.db import models
from django.conf import settings
from django.utils import timezone

AUDIENCE_CHOICES = (
    ('ALL', 'All Users & Campus'),
    ('MEMBERS', 'Registered Members Only'),
    ('VOLUNTEERS', 'Volunteers & Staff'),
    ('TREASURERS', 'Treasurers & Finance'),
)

PRIORITY_CHOICES = (
    ('LOW', 'Low'),
    ('MEDIUM', 'Medium'),
    ('HIGH', 'High'),
    ('URGENT', 'Urgent Alert'),
)

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    audience = models.CharField(max_length=30, choices=AUDIENCE_CHOICES, default='ALL')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    published = models.BooleanField(default=True)
    published_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

    def __str__(self):
        return f"[{self.priority}] {self.title} ({self.audience})"
