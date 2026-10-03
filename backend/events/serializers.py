from rest_framework import serializers
from .models import Event
from accounts.serializers import UserSerializer

class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    tickets_sold_count = serializers.IntegerField(read_only=True)
    checked_in_count = serializers.IntegerField(read_only=True)
    seats_remaining = serializers.IntegerField(read_only=True)
    is_registration_active = serializers.BooleanField(read_only=True)
    user_has_ticket = serializers.SerializerMethodField()
    user_ticket = serializers.SerializerMethodField()
    applicable_price = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'category', 'venue',
            'start_datetime', 'end_datetime', 'capacity',
            'member_price', 'non_member_price', 'registration_open',
            'registration_close', 'status', 'cover_image', 'created_by',
            'created_at', 'updated_at', 'tickets_sold_count', 'checked_in_count',
            'seats_remaining', 'is_registration_active', 'user_has_ticket',
            'user_ticket', 'applicable_price'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_user_has_ticket(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.tickets.filter(user=request.user, status__in=['CONFIRMED', 'USED']).exists()
        return False

    def get_user_ticket(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            t = obj.tickets.filter(user=request.user, status__in=['CONFIRMED', 'USED']).first()
            if t:
                return {
                    'id': t.id,
                    'ticket_number': t.ticket_number,
                    'status': t.status,
                    'price': float(t.price),
                    'qr_token': t.qr_token
                }
        return None

    def validate(self, attrs):
        from django.utils import timezone
        now = timezone.now()

        # Only enforce future date checks when creating a new event
        if not self.instance:
            start = attrs.get('start_datetime')
            if start and start < now:
                raise serializers.ValidationError({"start_datetime": "Event start time cannot be in the past. Please select a current or future date."})

        start = attrs.get('start_datetime') or (self.instance.start_datetime if self.instance else None)
        end = attrs.get('end_datetime') or (self.instance.end_datetime if self.instance else None)
        reg_open = attrs.get('registration_open') or (self.instance.registration_open if self.instance else None)
        reg_close = attrs.get('registration_close') or (self.instance.registration_close if self.instance else None)

        if start and end and end <= start:
            raise serializers.ValidationError({"end_datetime": "Event end time must be after the start time."})

        if reg_open and reg_close and reg_close <= reg_open:
            raise serializers.ValidationError({"registration_close": "Registration closing time must be after registration opening time."})

        return attrs

    def get_applicable_price(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.has_active_membership:
                return float(obj.member_price)
        return float(obj.non_member_price)


