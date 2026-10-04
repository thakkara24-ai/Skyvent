import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone

ORDER_STATUS = (
    ('PENDING', 'Pending Payment'),
    ('PROCESSING', 'Processing & Preparing'),
    ('COMPLETED', 'Completed / Delivered'),
    ('CANCELLED', 'Cancelled'),
)

class Order(models.Model):
    order_number = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment = models.ForeignKey(
        'finance.Payment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='COMPLETED')
    delivery_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"{self.order_number} - {self.user.name} (₹{self.total})"

    @classmethod
    def generate_order_number(cls):
        year = timezone.now().year
        count = cls.objects.count() + 1
        rand = secrets.randbelow(900) + 100
        return f"SKY-ORD-{year}-{count:04d}-{rand}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'merchandise.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='order_items'
    )
    product_name_snapshot = models.CharField(max_length=255)
    size = models.CharField(max_length=20, blank=True, default='')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.quantity}x {self.product_name_snapshot} ({self.size}) - ₹{self.subtotal}"
