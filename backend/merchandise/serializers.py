from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'price',
            'sku', 'sizes', 'stock_quantity', 'low_stock_threshold',
            'image', 'is_active', 'is_low_stock', 'is_out_of_stock',
            'created_at', 'updated_at'
        ]
