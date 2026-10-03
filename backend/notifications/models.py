from django.db import models
from django.conf import settings

NOTIFICATION_TYPES = (
    ('MEMBERSHIP', 'Membership Alert'),
    ('EVENT', 'Event Update'),
    ('TICKET', 'Ticket Pass'),
    ('ORDER', 'Merchandise Order'),
    ('FINANCE', 'Finance & Reimbursement'),
    ('SYSTEM', 'System Announcement'),
)

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='SYSTEM')
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f"[{self.notification_type}] {self.title} -> {self.user.name} (Read: {self.is_read})"
