from rest_framework import viewsets, views, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Sum, Q
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from django.contrib.auth import get_user_model
from .models import Payment, Transaction, Expense
from .serializers import (
    PaymentSerializer,
    TransactionSerializer,
    ExpenseSerializer,
    CreateExpenseSerializer,
    ApproveExpenseSerializer
)
from notifications.models import Notification
from common.responses import success_response, error_response
from common.permissions import IsTreasurerOrAdmin, IsVolunteerOrStaff
from common.utils import create_audit_log, broadcast_ws_event

User = get_user_model()


class FinanceSummaryView(views.APIView):
    permission_classes = [IsAuthenticated, IsTreasurerOrAdmin]

    def get(self, request):
        now = timezone.now()
        days_param = request.query_params.get('days')

        tx_query = Transaction.objects.all()
        if days_param and days_param.isdigit():
            cutoff = now - timedelta(days=int(days_param))
            tx_query = tx_query.filter(created_at__gte=cutoff)

        income_agg = tx_query.filter(transaction_type='INCOME').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        expense_agg = tx_query.filter(transaction_type='EXPENSE').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        net_balance = income_agg - expense_agg

        # Income by category
        income_by_category = []
        for cat_key, cat_label in [
            ('MEMBERSHIP', 'Membership Plans'),
            ('EVENT_TICKET', 'Event Tickets'),
            ('MERCHANDISE', 'Merchandise Sales'),
            ('FUNDRAISER', 'Fundraisers & Donations'),
            ('OTHER', 'Other Income')
        ]:
            amt = tx_query.filter(transaction_type='INCOME', category=cat_key).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            if amt > 0 or not days_param:
                income_by_category.append({
                    'category': cat_key,
                    'name': cat_label,
                    'amount': float(amt)
                })

        # Expenses by category
        expenses_by_category = []
        for cat_key, cat_label in [
            ('REIMBURSEMENT', 'Volunteer Reimbursements'),
            ('OPERATIONS', 'Club Operations'),
            ('CATERING', 'Food & Catering'),
            ('MARKETING', 'Marketing & Promo'),
            ('LOGISTICS', 'Logistics & Venue'),
            ('OTHER', 'Other Expenses')
        ]:
            amt = tx_query.filter(transaction_type='EXPENSE', category=cat_key).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            if amt > 0 or not days_param:
                expenses_by_category.append({
                    'category': cat_key,
                    'name': cat_label,
                    'amount': float(amt)
                })

        # Pending reimbursements
        pending_expenses = Expense.objects.filter(status='PENDING')
        pending_reimbursements_count = pending_expenses.count()
        pending_reimbursements_amount = pending_expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Recent transactions
        recent_txs = tx_query.select_related('created_by').order_by('-created_at')[:10]

        # Monthly trends (last 6 months)
        monthly_trends = []
        for i in range(5, -1, -1):
            month_date = now - timedelta(days=i*30)
            m_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if m_start.month == 12:
                m_end = m_start.replace(year=m_start.year + 1, month=1)
            else:
                m_end = m_start.replace(month=m_start.month + 1)

            m_income = Transaction.objects.filter(
                transaction_type='INCOME',
                created_at__gte=m_start,
                created_at__lt=m_end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            m_expense = Transaction.objects.filter(
                transaction_type='EXPENSE',
                created_at__gte=m_start,
                created_at__lt=m_end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            monthly_trends.append({
                'month': m_start.strftime('%b %Y'),
                'income': float(m_income),
                'expense': float(m_expense),
                'net': float(m_income - m_expense)
            })

        return success_response(data={
            'total_income': float(income_agg),
            'total_expenses': float(expense_agg),
            'net_balance': float(net_balance),
            'pending_reimbursements_count': pending_reimbursements_count,
            'pending_reimbursements_amount': float(pending_reimbursements_amount),
            'income_by_category': income_by_category,
            'expenses_by_category': expenses_by_category,
            'monthly_trends': monthly_trends,
            'recent_transactions': TransactionSerializer(recent_txs, many=True).data
        })


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().select_related('created_by').order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsTreasurerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'reference_id', 'reference_type']
    ordering_fields = ['amount', 'created_at']

    def get_queryset(self):
        queryset = Transaction.objects.all().select_related('created_by')
        tx_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')

        if tx_type:
            queryset = queryset.filter(transaction_type=tx_type)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(reference_id__icontains=search)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        tx = serializer.save(created_by=self.request.user)
        create_audit_log(
            self.request.user,
            "TRANSACTION_RECORDED",
            "Transaction",
            tx.id,
            {"type": tx.transaction_type, "amount": str(tx.amount), "category": tx.category}
        )
        broadcast_ws_event("finance_updated", {"type": tx.transaction_type, "amount": str(tx.amount)})


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'submitted_by__name']
    ordering_fields = ['amount', 'created_at', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'TREASURER'] or user.is_superuser:
            queryset = Expense.objects.all().select_related('submitted_by', 'approved_by')
            status_param = self.request.query_params.get('status')
            if status_param:
                queryset = queryset.filter(status=status_param)
            return queryset.order_by('-created_at')
        return Expense.objects.filter(submitted_by=user).select_related('submitted_by', 'approved_by').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = CreateExpenseSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        expense = serializer.save(submitted_by=request.user, status='PENDING')
        create_audit_log(request.user, "EXPENSE_SUBMITTED", "Expense", expense.id, {
            "title": expense.title,
            "amount": str(expense.amount)
        })

        # Notify Treasurers of pending expense
        treasurers = User.objects.filter(role__in=['TREASURER', 'SUPER_ADMIN'])
        for staff in treasurers:
            Notification.objects.create(
                user=staff,
                title="New Reimbursement Claim",
                message=f"{request.user.name} submitted an expense claim of ₹{expense.amount} for '{expense.title}'.",
                notification_type='FINANCE'
            )

        broadcast_ws_event("finance_updated", {"message": "New expense claim submitted"})

        return success_response(
            data=ExpenseSerializer(expense).data,
            message="Expense claim submitted successfully for review.",
            status_code=status.HTTP_201_CREATED
        )

    def partial_update(self, request, *args, **kwargs):
        return self.review_expense(request, pk=kwargs.get('pk'))

    def update(self, request, *args, **kwargs):
        return self.review_expense(request, pk=kwargs.get('pk'))

    @action(detail=True, methods=['post'], url_path='review')
    def review_expense(self, request, pk=None):
        if not (request.user.role in ['SUPER_ADMIN', 'TREASURER'] or request.user.is_superuser):
            return error_response(message="Only Treasurers and Administrators can approve expenses.", code="FORBIDDEN", status_code=status.HTTP_403_FORBIDDEN)

        expense = self.get_object()
        serializer = ApproveExpenseSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        new_status = serializer.validated_data['status']
        rejection_reason = serializer.validated_data.get('rejection_reason', '')

        old_status = expense.status
        expense.status = new_status
        expense.approved_by = request.user
        expense.rejection_reason = rejection_reason
        expense.save()

        # If marked as PAID or APPROVED, create financial EXPENSE transaction if not already created
        if new_status in ['APPROVED', 'PAID'] and old_status not in ['APPROVED', 'PAID']:
            Transaction.objects.create(
                transaction_type='EXPENSE',
                category=expense.category,
                amount=expense.amount,
                description=f"Expense Approved: {expense.title} (Approved by {request.user.name})",
                reference_type='EXPENSE',
                reference_id=str(expense.id),
                created_by=request.user
            )

        # Notify Submitter
        status_msg = f"Your expense claim '{expense.title}' for ₹{expense.amount} has been {new_status.lower()}."
        if rejection_reason and new_status == 'REJECTED':
            status_msg += f" Reason: {rejection_reason}"

        Notification.objects.create(
            user=expense.submitted_by,
            title=f"Expense Claim {new_status.title()}",
            message=status_msg,
            notification_type='FINANCE'
        )

        create_audit_log(request.user, "EXPENSE_REVIEWED", "Expense", expense.id, {
            "status": new_status,
            "amount": str(expense.amount),
            "claimant": expense.submitted_by.name
        })

        broadcast_ws_event("finance_updated", {
            "expense_id": expense.id,
            "status": new_status,
            "amount": str(expense.amount)
        })

        return success_response(
            data=ExpenseSerializer(expense).data,
            message=f"Expense claim has been {new_status.lower()} successfully."
        )

