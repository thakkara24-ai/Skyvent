from rest_framework import serializers
from .models import Ticket
from events.serializers import EventSerializer
from accounts.serializers import UserSerializer

class TicketSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    event_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'event', 'event_id', 'user',
            'ticket_type', 'price', 'payment', 'qr_token',
            'status', 'purchased_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'ticket_number', 'user', 'ticket_type', 'price',
            'payment', 'qr_token', 'status', 'purchased_at', 'updated_at'
        ]

class PurchaseTicketSerializer(serializers.Serializer):
    payment_method = serializers.CharField(default="Demo Payment")
