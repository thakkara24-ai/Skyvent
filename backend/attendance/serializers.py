from rest_framework import serializers
from .models import Attendance
from accounts.serializers import UserSerializer
from tickets.serializers import TicketSerializer

class AttendanceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    ticket = TicketSerializer(read_only=True)
    checked_in_by = UserSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'event', 'ticket', 'user', 'checked_in_at',
            'checked_in_by', 'method'
        ]

class CheckInRequestSerializer(serializers.Serializer):
    qr_token = serializers.CharField(required=False, allow_blank=True)
    ticket_number = serializers.CharField(required=False, allow_blank=True)
    event_id = serializers.IntegerField(required=False)
    method = serializers.ChoiceField(choices=['QR', 'MANUAL'], default='QR')

    def validate(self, attrs):
        if not attrs.get('qr_token') and not attrs.get('ticket_number'):
            raise serializers.ValidationError("Either qr_token or ticket_number must be provided.")
        return attrs
