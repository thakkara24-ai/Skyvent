from django.db import models
from django.conf import settings

CHECKIN_METHODS = (
    ('QR', 'QR Code Scan'),
    ('MANUAL', 'Manual Entry'),
)

class Attendance(models.Model):
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    ticket = models.OneToOneField(
        'tickets.Ticket',
        on_delete=models.CASCADE,
        related_name='attendance'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    checked_in_at = models.DateTimeField(auto_now_add=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_attendances'
    )
    method = models.CharField(max_length=20, choices=CHECKIN_METHODS, default='QR')

    class Meta:
        ordering = ['-checked_in_at']
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendances'

    def __str__(self):
        return f"{self.user.name} checked in to {self.event.title} at {self.checked_in_at.strftime('%H:%M:%S')}"
