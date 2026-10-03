import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone

TICKET_STATUS = (
    ('PENDING', 'Pending Payment'),
    ('CONFIRMED', 'Confirmed'),
    ('CANCELLED', 'Cancelled'),
    ('USED', 'Used / Checked In'),
)

TICKET_TYPE = (
    ('MEMBER', 'Member Pass'),
    ('NON_MEMBER', 'Standard Pass'),
)

class Ticket(models.Model):
    ticket_number = models.CharField(max_length=64, unique=True, db_index=True)
    event = models.ForeignKey(
        'events.Event',
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    ticket_type = models.CharField(max_length=20, choices=TICKET_TYPE, default='NON_MEMBER')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment = models.ForeignKey(
        'finance.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets'
    )
    qr_token = models.CharField(max_length=128, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=TICKET_STATUS, default='CONFIRMED')
    purchased_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-purchased_at']
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'

    def __str__(self):
        return f"{self.ticket_number} - {self.event.title} ({self.user.name}) [{self.status}]"

    @classmethod
    def generate_ticket_number(cls, event_id):
        year = timezone.now().year
        count = cls.objects.count() + 1
        random_suffix = secrets.randbelow(900) + 100
        return f"SKY-EVT-{year}-{count:04d}-{random_suffix}"

    @classmethod
    def generate_qr_token(cls):
        return f"SKY_QR_{secrets.token_urlsafe(32)}"
