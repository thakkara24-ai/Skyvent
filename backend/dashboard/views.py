from rest_framework import views, status, generics
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count, Q, F
from decimal import Decimal
from datetime import timedelta

from accounts.models import User
from memberships.models import Membership, MembershipPlan
from events.models import Event
from tickets.models import Ticket
from attendance.models import Attendance
from merchandise.models import Product
from orders.models import Order, OrderItem
from announcements.models import Announcement
from fundraisers.models import Fundraiser, FundraiserTask
from finance.models import Transaction, Expense
from notifications.models import Notification
from common.models import AuditLog

from common.responses import success_response, error_response
from common.permissions import IsStaffUser, IsPresidentOrAdmin
from accounts.serializers import UserSerializer
from events.serializers import EventSerializer
from tickets.serializers import TicketSerializer
from announcements.serializers import AnnouncementSerializer
from orders.serializers import OrderSerializer

class AdminDashboardView(views.APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        today = timezone.now().date()
        now = timezone.now()

        # 1. High-Level Metrics (Dynamic SQLite Queries)
        total_members = User.objects.filter(role__in=['MEMBER', 'VOLUNTEER']).count()
        active_memberships = Membership.objects.filter(
            status='ACTIVE',
            start_date__lte=today,
            end_date__gte=today
        ).count()
        
        upcoming_events_count = Event.objects.filter(
            status='PUBLISHED',
            end_datetime__gte=now
        ).count()

        tickets_sold = Ticket.objects.filter(status__in=['CONFIRMED', 'USED']).count()
        checked_in_attendance = Ticket.objects.filter(status='USED').count()
        attendance_rate = int((checked_in_attendance / tickets_sold * 100)) if tickets_sold > 0 else 0

        income_sum = Transaction.objects.filter(transaction_type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        expense_sum = Transaction.objects.filter(transaction_type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        net_balance = income_sum - expense_sum

        merchandise_revenue = Transaction.objects.filter(
            transaction_type='INCOME',
            category='MERCHANDISE'
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        # 2. Dynamic "NEEDS ATTENTION" Section (tailored to user's role)
        needs_attention = []
        user_role = request.user.role if request.user else 'MEMBER'
        is_super = request.user.is_superuser or user_role == 'SUPER_ADMIN'

        # A: Memberships expiring within 7 days (Super Admin only)
        if is_super:
            seven_days_later = today + timedelta(days=7)
            expiring_memberships_count = Membership.objects.filter(
                status='ACTIVE',
                end_date__gte=today,
                end_date__lte=seven_days_later
            ).count()
            if expiring_memberships_count > 0:
                needs_attention.append({
                    "id": "expiring_memberships",
                    "type": "warning",
                    "title": "Expiring Memberships",
                    "message": f"{expiring_memberships_count} membership(s) expire within 7 days.",
                    "action_url": "/admin/memberships",
                    "action_text": "Review Members"
                })

        # B: Events nearly full (>= 85% capacity) (Super Admin & Volunteers)
        if is_super or user_role == 'VOLUNTEER':
            published_events = Event.objects.filter(status='PUBLISHED', end_datetime__gte=now)
            for evt in published_events:
                sold = evt.tickets_sold_count
                if evt.capacity > 0:
                    pct = int((sold / evt.capacity) * 100)
                    if pct >= 85:
                        needs_attention.append({
                            "id": f"event_capacity_{evt.id}",
                            "type": "urgent" if pct >= 95 else "warning",
                            "title": f"High Capacity: {evt.title}",
                            "message": f"'{evt.title}' is {pct}% full ({sold}/{evt.capacity} seats reserved).",
                            "action_url": f"/admin/events/{evt.id}",
                            "action_text": "Manage Event"
                        })

        # C: Low Stock Products (Super Admin & Merchandise)
        if is_super or user_role == 'MERCHANDISE':
            low_stock_prods = Product.objects.filter(is_active=True, stock_quantity__lte=F('low_stock_threshold'))
            for prod in low_stock_prods[:5]:
                needs_attention.append({
                    "id": f"low_stock_{prod.id}",
                    "type": "warning" if prod.stock_quantity > 0 else "urgent",
                    "title": f"Low Stock: {prod.name}",
                    "message": f"'{prod.name}' has only {prod.stock_quantity} unit(s) left in stock.",
                    "action_url": "/admin/products",
                    "action_text": "Restock Item"
                })
            
            # Pending merchandise orders
            pending_orders = Order.objects.filter(status='PENDING').count()
            if pending_orders > 0:
                needs_attention.append({
                    "id": "pending_orders",
                    "type": "info",
                    "title": "Pending Merch Orders",
                    "message": f"{pending_orders} merchandise order(s) waiting to be fulfilled.",
                    "action_url": "/admin/orders",
                    "action_text": "Fulfill Orders"
                })

        # D: Pending Reimbursements (Super Admin & Treasurer)
        if is_super or user_role == 'TREASURER':
            pending_expenses_count = Expense.objects.filter(status='PENDING').count()
            if pending_expenses_count > 0:
                needs_attention.append({
                    "id": "pending_reimbursements",
                    "type": "info",
                    "title": "Pending Expense Claims",
                    "message": f"{pending_expenses_count} reimbursement claim(s) are awaiting review and approval.",
                    "action_url": "/admin/finance",
                    "action_text": "Review Claims"
                })

        # E: Overdue Tasks (Tailored by role)
        if is_super or user_role in ['TREASURER', 'VOLUNTEER', 'MERCHANDISE']:
            overdue_tasks_query = FundraiserTask.objects.filter(
                status__in=['TODO', 'IN_PROGRESS', 'BLOCKED'],
                due_date__lt=today
            )
            if not is_super:
                overdue_tasks_query = overdue_tasks_query.filter(assignee=request.user)
            
            overdue_tasks_count = overdue_tasks_query.count()
            if overdue_tasks_count > 0:
                needs_attention.append({
                    "id": "overdue_tasks",
                    "type": "urgent",
                    "title": "Overdue Assigned Tasks",
                    "message": f"{overdue_tasks_count} assigned task(s) are past their due date.",
                    "action_url": "/admin/tasks",
                    "action_text": "View Board"
                })

        # 3. Revenue Breakdown by Source (Recharts)
        revenue_by_source = [
            {
                "source": "Memberships",
                "amount": float(Transaction.objects.filter(transaction_type='INCOME', category='MEMBERSHIP').aggregate(t=Sum('amount'))['t'] or 0)
            },
            {
                "source": "Tickets",
                "amount": float(Transaction.objects.filter(transaction_type='INCOME', category='EVENT_TICKET').aggregate(t=Sum('amount'))['t'] or 0)
            },
            {
                "source": "Merchandise",
                "amount": float(Transaction.objects.filter(transaction_type='INCOME', category='MERCHANDISE').aggregate(t=Sum('amount'))['t'] or 0)
            },
            {
                "source": "Fundraisers",
                "amount": float(Transaction.objects.filter(transaction_type='INCOME', category='FUNDRAISER').aggregate(t=Sum('amount'))['t'] or 0)
            },
        ]

        # 4. Monthly Trend (6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            target_date = now - timedelta(days=i*30)
            m_start = target_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if m_start.month == 12:
                m_end = m_start.replace(year=m_start.year + 1, month=1)
            else:
                m_end = m_start.replace(month=m_start.month + 1)

            inc = Transaction.objects.filter(
                transaction_type='INCOME',
                created_at__gte=m_start,
                created_at__lt=m_end
            ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

            exp = Transaction.objects.filter(
                transaction_type='EXPENSE',
                created_at__gte=m_start,
                created_at__lt=m_end
            ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

            monthly_trend.append({
                "month": m_start.strftime('%b'),
                "income": float(inc),
                "expense": float(exp)
            })

        # 5. Top Events Performance
        events_performance = []
        for evt in Event.objects.filter(status='PUBLISHED').order_by('start_datetime')[:5]:
            events_performance.append({
                "id": evt.id,
                "title": evt.title,
                "capacity": evt.capacity,
                "tickets_sold": evt.tickets_sold_count,
                "checked_in": evt.checked_in_count,
                "start_datetime": evt.start_datetime.isoformat()
            })

        # 6. Recent Activities from AuditLog
        recent_activity = []
        for log in AuditLog.objects.select_related('user').order_by('-timestamp')[:8]:
            recent_activity.append({
                "id": log.id,
                "user_name": log.user.name if log.user else "System",
                "user_role": log.user.role if log.user else "SYSTEM",
                "action": log.action,
                "entity": log.entity,
                "metadata": log.metadata,
                "timestamp": log.timestamp.isoformat()
            })

        return success_response(data={
            "stats": {
                "total_members": total_members,
                "active_memberships": active_memberships,
                "upcoming_events": upcoming_events_count,
                "tickets_sold": tickets_sold,
                "checked_in_attendance": checked_in_attendance,
                "attendance_rate": attendance_rate,
                "merchandise_revenue": float(merchandise_revenue),
                "total_income": float(income_sum),
                "total_expenses": float(expense_sum),
                "current_balance": float(net_balance)
            },
            "needs_attention": needs_attention,
            "revenue_by_source": revenue_by_source,
            "monthly_trend": monthly_trend,
            "events_performance": events_performance,
            "recent_activity": recent_activity
        })


class MemberDashboardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today = timezone.now().date()

        # Active membership
        membership = user.current_membership
        membership_data = None
        if membership:
            membership_data = {
                "id": membership.id,
                "plan_name": membership.plan.name,
                "start_date": membership.start_date,
                "end_date": membership.end_date,
                "status": membership.status,
                "effective_status": membership.effective_status,
                "days_remaining": membership.days_remaining,
                "benefits": membership.plan.benefits,
                "discount_percentage": float(membership.plan.discount_percentage)
            }

        # Upcoming Ticketed Events
        my_tickets = Ticket.objects.filter(
            user=user,
            status__in=['CONFIRMED', 'USED']
        ).select_related('event').order_by('event__start_datetime')

        # Recent Orders
        recent_orders = Order.objects.filter(user=user).prefetch_related('items__product').order_by('-created_at')[:4]

        # Targeted Announcements
        announcements_query = Announcement.objects.filter(
            published=True,
            audience__in=['ALL', 'MEMBERS'] if not user.role == 'VOLUNTEER' else ['ALL', 'MEMBERS', 'VOLUNTEERS']
        ).order_by('-published_at')[:5]

        # Available Upcoming Events
        upcoming_events = Event.objects.filter(
            status='PUBLISHED',
            end_datetime__gte=now
        ).order_by('start_datetime')[:4]

        return success_response(data={
            "user": UserSerializer(user).data,
            "membership": membership_data,
            "tickets": TicketSerializer(my_tickets, many=True).data,
            "recent_orders": OrderSerializer(recent_orders, many=True).data,
            "announcements": AnnouncementSerializer(announcements_query, many=True).data,
            "upcoming_events": EventSerializer(upcoming_events, many=True, context={'request': request}).data,
            "stats": {
                "total_tickets": my_tickets.count(),
                "events_attended": my_tickets.filter(status='USED').count(),
                "orders_placed": user.orders.count()
            }
        })


class ReportsView(views.APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        timeframe = request.query_params.get('range', '30days')
        now = timezone.now()

        if timeframe == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif timeframe == '7days':
            start_date = now - timedelta(days=7)
        elif timeframe == 'this_month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else: # default 30days
            start_date = now - timedelta(days=30)

        txs = Transaction.objects.filter(created_at__gte=start_date)
        income = txs.filter(transaction_type='INCOME').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        expenses = txs.filter(transaction_type='EXPENSE').aggregate(t=Sum('amount'))['t'] or Decimal('0.00')
        tickets_sold = Ticket.objects.filter(purchased_at__gte=start_date, status__in=['CONFIRMED', 'USED']).count()
        orders_count = Order.objects.filter(created_at__gte=start_date).count()
        memberships_sold = Membership.objects.filter(created_at__gte=start_date).count()

        # Category Breakdown
        income_breakdown = [
            {'category': item['category'], 'amount': float(item['total'])}
            for item in txs.filter(transaction_type='INCOME').values('category').annotate(total=Sum('amount')).order_by('-total')
        ]

        expense_breakdown = [
            {'category': item['category'], 'amount': float(item['total'])}
            for item in txs.filter(transaction_type='EXPENSE').values('category').annotate(total=Sum('amount')).order_by('-total')
        ]

        return success_response(data={
            "timeframe": timeframe,
            "start_date": start_date.isoformat(),
            "income": float(income),
            "expenses": float(expenses),
            "net": float(income - expenses),
            "tickets_sold": tickets_sold,
            "orders_count": orders_count,
            "memberships_sold": memberships_sold,
            "income_breakdown": income_breakdown,
            "expense_breakdown": expense_breakdown
        })


class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        logs = AuditLog.objects.select_related('user').order_by('-timestamp')[:50]
        data = [
            {
                "id": l.id,
                "user_name": l.user.name if l.user else "System",
                "user_email": l.user.email if l.user else "",
                "user_role": l.user.role if l.user else "SYSTEM",
                "action": l.action,
                "entity": l.entity,
                "entity_id": l.entity_id,
                "metadata": l.metadata,
                "timestamp": l.timestamp.isoformat()
            }
            for l in logs
        ]
        return success_response(data=data)
