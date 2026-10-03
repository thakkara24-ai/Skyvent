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

        # Dispatch Confirmation Email with Expiry Date and Details
        expiry_formatted = end_date.strftime('%B %d, %Y')
        email_text = f"""Hi {user.name},

Congratulations! Your {plan.name} membership has been activated successfully.

Membership Details:
- Plan: {plan.name}
- Valid Until (Expiry Date): {expiry_formatted}
- Amount Paid: ₹{plan.price}
- Payment Reference: {payment.reference}

Thank you for being a vital part of our campus community!

Best regards,
SKYVENT Team"""

        email_html = f"""<div style="font-family: Arial, sans-serif; color: #2A1E18; max-width: 540px; margin: 0 auto; border: 1px solid #E8DCCE; border-radius: 12px; padding: 24px; background-color: #FAF8F5;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="color: #6B4A38; margin: 0;">SKYVENT Membership Activated</h2>
    <p style="color: #7A6A5E; font-size: 13px; margin-top: 4px;">Official Student Organization Platform</p>
  </div>
  <p>Hi <strong>{user.name}</strong>,</p>
  <p>Congratulations! Your <strong>{plan.name}</strong> membership is now active.</p>
  <div style="background-color: #FFFFFF; border: 1px solid #E8DCCE; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #7A6A5E;">Plan:</td>
        <td style="padding: 6px 0; font-weight: bold; text-align: right;">{plan.name}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #7A6A5E;">Valid Until (Expiry Date):</td>
        <td style="padding: 6px 0; font-weight: bold; color: #6B4A38; text-align: right;">{expiry_formatted}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #7A6A5E;">Amount Paid:</td>
        <td style="padding: 6px 0; font-weight: bold; text-align: right;">₹{plan.price}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #7A6A5E;">Reference ID:</td>
        <td style="padding: 6px 0; font-mono; text-align: right;">{payment.reference}</td>
      </tr>
    </table>
  </div>
  <p style="font-size: 13px; color: #7A6A5E;">You now have instant access to member-exclusive event pricing, priority ticketing, and student organization privileges.</p>
  <p style="font-size: 13px; margin-top: 20px;">Best regards,<br><strong>SKYVENT Team</strong></p>
</div>"""

        try:
            send_mail(
                subject="SKYVENT - Membership Confirmation",
                message=email_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=email_html,
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
