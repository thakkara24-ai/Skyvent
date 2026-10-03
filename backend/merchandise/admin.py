from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'sku', 'stock_quantity', 'low_stock_threshold', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'sku', 'description')
