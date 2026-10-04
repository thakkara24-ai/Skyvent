from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

CATEGORY_CHOICES = (
    ('CULTURAL', 'Cultural & Gala'),
    ('TECHNICAL', 'Technical & Hackathon'),
    ('WORKSHOP', 'Workshop & Seminar'),
    ('SPORTS', 'Sports & Fitness'),
    ('SOCIAL', 'Social & Networking'),
    ('CAREER', 'Career & Alumni'),
)

STATUS_CHOICES = (
    ('DRAFT', 'Draft'),
    ('PUBLISHED', 'Published'),
    ('CANCELLED', 'Cancelled'),
    ('COMPLETED', 'Completed'),
)

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='CULTURAL')
    venue = models.CharField(max_length=255)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    capacity = models.PositiveIntegerField()
    member_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    non_member_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    registration_open = models.DateTimeField()
    registration_close = models.DateTimeField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PUBLISHED')
    cover_image = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_datetime']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return f"{self.title} ({self.venue}) - {self.status}"

    def clean(self):
        if self.capacity <= 0:
            raise ValidationError({'capacity': 'Capacity must be greater than zero.'})
        if self.start_datetime and self.end_datetime and self.start_datetime >= self.end_datetime:
            raise ValidationError({'end_datetime': 'End time must be after start time.'})
        if self.registration_open and self.registration_close and self.registration_open >= self.registration_close:
            raise ValidationError({'registration_close': 'Registration close time must be after open time.'})

    @property
    def tickets_sold_count(self):
        return self.tickets.filter(status__in=['CONFIRMED', 'USED']).count()

    @property
    def checked_in_count(self):
        return self.tickets.filter(status='USED').count()

    @property
    def seats_remaining(self):
        remaining = self.capacity - self.tickets_sold_count
        return max(0, remaining)

    @property
    def is_registration_active(self):
        now = timezone.now()
        if self.status != 'PUBLISHED':
            return False
        if now < self.registration_open or now > self.registration_close:
            return False
        if self.seats_remaining <= 0:
            return False
        return True

    @property
    def is_nearly_full(self):
        if self.capacity == 0:
            return False
        return (self.tickets_sold_count / self.capacity) >= 0.85
