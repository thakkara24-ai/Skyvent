from rest_framework import viewsets, views, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
import uuid

from .models import MembershipPlan, Membership
from .serializers import (
    MembershipPlanSerializer,
    MembershipSerializer,
    PurchaseMembershipSerializer
)
from common.responses import success_response, error_response
from common.permissions import IsPresidentOrAdmin, ReadOnlyOrStaff
from common.utils import create_audit_log, broadcast_ws_event
from finance.models import Payment, Transaction
from notifications.models import Notification

class MembershipPlanViewSet(viewsets.ModelViewSet):
    queryset = MembershipPlan.objects.all().order_by('price')
    serializer_class = MembershipPlanSerializer
    permission_classes = [ReadOnlyOrStaff]

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated and (
            self.request.user.role in ['SUPER_ADMIN', 'PRESIDENT'] or self.request.user.is_superuser
        ):
            return MembershipPlan.objects.all().order_by('price')
        return MembershipPlan.objects.filter(is_active=True).order_by('price')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)


class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'PRESIDENT'] or user.is_superuser:
            queryset = Membership.objects.all().select_related('user', 'plan').order_by('-created_at')
            user_id = self.request.query_params.get('user_id')
            status_filter = self.request.query_params.get('status')
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            return queryset
        return Membership.objects.filter(user=user).select_related('user', 'plan').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = PurchaseMembershipSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        plan_id = serializer.validated_data['plan_id']
        try:
            plan = MembershipPlan.objects.get(id=plan_id, is_active=True)
        except MembershipPlan.DoesNotExist:
            return error_response(message="Invalid membership plan selected.", code="PLAN_NOT_FOUND")

        user = request.user
        today = timezone.now().date()
        end_date = today + timedelta(days=plan.duration_days)

        # Create Demo Payment Record
        payment = Payment.objects.create(
            user=user,
            amount=plan.price,
            currency="INR",
            provider="Demo Payment Provider",
            reference=f"PAY-MEM-{uuid.uuid4().hex[:8].upper()}",
            status="SUCCESS"
        )

        # Deactivate any previous active memberships
        Membership.objects.filter(user=user, status='ACTIVE').update(status='EXPIRED')

        # Create Membership Record
        membership = Membership.objects.create(
            user=user,
            plan=plan,
            start_date=today,
            end_date=end_date,
            status='ACTIVE',
            payment=payment
        )

        # Record Financial Income Transaction
        Transaction.objects.create(
            transaction_type='INCOME',
            category='MEMBERSHIP',
            amount=plan.price,
            description=f"Membership Plan purchase: {plan.name} by {user.name} ({user.email})",
            reference_type='MEMBERSHIP',
            reference_id=str(membership.id),
            created_by=user
        )

        # Create in-app Notification
        Notification.objects.create(
            user=user,
            title="Membership Activated!",
            message=f"You are now an active member with {plan.name}. Enjoy member-exclusive pricing and privileges!",
            notification_type='MEMBERSHIP'
        )

        # Dispath Confirmation Email
        try:
            send_mail(
                subject="SKYVENT - Membership Confirmation",
                message=f"Hi {user.name},\n\nCongratulations! Your {plan.name} membership is active until {end_date.strftime('%B %d, %Y')}.\n\nAmount Paid: ₹{plan.price}\nPayment Reference: {payment.reference}\n\nThank you for supporting the campus community!\n\nSKYVENT Team",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
        except Exception as e:
            pass

        create_audit_log(user, "MEMBERSHIP_PURCHASED", "Membership", membership.id, {
            "plan": plan.name,
            "amount": str(plan.price)
        })

        # Broadcast real-time updates
        broadcast_ws_event("finance_updated", {"message": "New membership revenue recorded"})
        broadcast_ws_event("notification_created", {"user_id": user.id})

        return success_response(
            data=MembershipSerializer(membership).data,
            message=f"Successfully subscribed to {plan.name}!",
            status_code=status.HTTP_201_CREATED
        )
