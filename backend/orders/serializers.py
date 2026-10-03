from rest_framework import serializers
from .models import Order, OrderItem
from merchandise.serializers import ProductSerializer
from accounts.serializers import UserSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name_snapshot', 'size',
            'quantity', 'unit_price', 'subtotal'
        ]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'subtotal', 'discount',
            'total', 'payment', 'status', 'delivery_notes',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = [
            'id', 'order_number', 'user', 'subtotal', 'discount',
            'total', 'payment', 'created_at', 'updated_at', 'items'
        ]

class CreateOrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    size = serializers.CharField(required=False, allow_blank=True, default='')
    quantity = serializers.IntegerField(min_value=1)

class CreateOrderSerializer(serializers.Serializer):
    items = CreateOrderItemInputSerializer(many=True)
    delivery_notes = serializers.CharField(required=False, allow_blank=True, default='')
    payment_method = serializers.CharField(default="Demo Payment")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one product must be selected in order.")
        return value
