from rest_framework import serializers
from .models import MembershipPlan, Membership
from accounts.serializers import UserSerializer

class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = [
            'id', 'name', 'description', 'price', 'duration_days',
            'benefits', 'discount_percentage', 'is_active', 'created_at'
        ]

class MembershipSerializer(serializers.ModelSerializer):
    plan = MembershipPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=MembershipPlan.objects.filter(is_active=True),
        write_only=True,
        source='plan'
    )
    user = UserSerializer(read_only=True)
    effective_status = serializers.CharField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = Membership
        fields = [
            'id', 'user', 'plan', 'plan_id', 'start_date', 'end_date',
            'status', 'effective_status', 'days_remaining', 'payment', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'start_date', 'end_date', 'status', 'payment', 'created_at']

class PurchaseMembershipSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    payment_method = serializers.CharField(default="Campus UPI Gateway")
