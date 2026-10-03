from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class MembershipPlan(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_days = models.PositiveIntegerField(default=365)
    benefits = models.JSONField(default=list, help_text="List of benefits string items")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']
        verbose_name = 'Membership Plan'
        verbose_name_plural = 'Membership Plans'

    def __str__(self):
        return f"{self.name} (₹{self.price} - {self.duration_days} days)"


class Membership(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    plan = models.ForeignKey(
        MembershipPlan,
        on_delete=models.PROTECT,
        related_name='memberships'
    )
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    payment = models.ForeignKey(
        'finance.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='memberships'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Membership'
        verbose_name_plural = 'Memberships'

    def __str__(self):
        return f"{self.user.name} - {self.plan.name} ({self.effective_status})"

    @property
    def effective_status(self):
        today = timezone.now().date()
        if self.status == 'ACTIVE':
            if self.end_date < today:
                return 'EXPIRED'
            if self.start_date > today:
                return 'PENDING'
            return 'ACTIVE'
        return self.status

    @property
    def days_remaining(self):
        today = timezone.now().date()
        if self.end_date < today:
            return 0
        return (self.end_date - today).days

    def save(self, *args, **kwargs):
        if not self.end_date and self.plan:
            self.end_date = (self.start_date or timezone.now().date()) + timedelta(days=self.plan.duration_days)
        super().save(*args, **kwargs)
