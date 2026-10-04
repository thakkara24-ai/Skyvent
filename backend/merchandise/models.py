from django.db import models

CATEGORY_CHOICES = (
    ('APPAREL', 'Apparel & Hoodies'),
    ('ACCESSORIES', 'Accessories & Caps'),
    ('STATIONERY', 'Stationery & Notebooks'),
    ('COLLECTIBLES', 'Badges & Collectibles'),
)

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='APPAREL')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sku = models.CharField(max_length=64, unique=True, db_index=True)
    sizes = models.JSONField(default=list, blank=True, help_text="e.g. ['S', 'M', 'L', 'XL', 'XXL']")
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    image = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f"{self.name} (SKU: {self.sku}) - Stock: {self.stock_quantity}"

    @property
    def is_low_stock(self):
        return 0 < self.stock_quantity <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        return self.stock_quantity == 0
