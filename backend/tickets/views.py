from decimal import Decimal
from datetime import timedelta
import uuid
from django.contrib.auth import get_user_model
from rest_framework import viewsets, views, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404

from .models import Ticket
from .serializers import TicketSerializer, PurchaseTicketSerializer
from events.models import Event
from finance.models import Payment, Transaction
from notifications.models import Notification
from common.responses import success_response, error_response
from common.utils import create_audit_log, broadcast_ws_event

User = get_user_model()

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Allow Staff/Admin to issue a ticket
        if not (request.user.role in ['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'] or request.user.is_superuser):
            return error_response(
                message="Only administrators and event coordinators can issue tickets.",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN
            )

        event_id = request.data.get('event_id')
        user_id = request.data.get('user_id')
        user_email = request.data.get('user_email')
        ticket_type = request.data.get('ticket_type', 'REGULAR')
        custom_price = request.data.get('price')

        if not event_id:
            return error_response(message="Event ID is required.")

        event = get_object_or_404(Event, id=event_id)

        # Resolve target attendee user
        target_user = None
        if user_id:
            target_user = User.objects.filter(id=user_id).first()
        elif user_email:
            target_user = User.objects.filter(email=user_email).first()

        if not target_user:
            target_user = request.user

        # Check existing active ticket
        existing_ticket = Ticket.objects.filter(
            event=event,
            user=target_user,
            status__in=['PENDING', 'CONFIRMED']
        ).first()

        if existing_ticket:
            return error_response(
                message=f"Attendee {target_user.name} already holds an active ticket for this event (#{existing_ticket.ticket_number}).",
                code="DUPLICATE_TICKET"
            )

        # Determine price
        if custom_price is not None and str(custom_price).strip() != '':
            price = Decimal(str(custom_price))
        else:
            price = event.member_price if (target_user.has_active_membership or ticket_type == 'MEMBER') else event.non_member_price

        # Unique token & ticket number
        qr_token = f"SKY_QR_{event.id}_{uuid.uuid4().hex[:16]}"
        ticket_count = Ticket.objects.filter(event=event).count() + 1
        ticket_number = f"SKY-EVT-{timezone.now().year}-{event.id:04d}-{ticket_count:03d}"

        # Create payment record
        payment = Payment.objects.create(
            user=target_user,
            amount=price,
            provider='DEMO_PAYMENT',
            reference=f"PAY-ADM-{uuid.uuid4().hex[:8].upper()}",
            status='SUCCESS'
        )

        ticket = Ticket.objects.create(
            ticket_number=ticket_number,
            event=event,
            user=target_user,
            ticket_type=ticket_type,
            price=price,
            payment=payment,
            qr_token=qr_token,
            status='CONFIRMED'
        )

        # Financial ledger entry
        if price > 0:
            Transaction.objects.create(
                transaction_type='INCOME',
                category='EVENT_TICKET',
                amount=price,
                description=f"Admin Issued Ticket: {ticket.ticket_number} for {event.title} to {target_user.name}",
                reference_type='EVENT_TICKET',
                reference_id=str(ticket.id),
                created_by=request.user
            )

        # Notify Attendee
        Notification.objects.create(
            user=target_user,
            title="Event Ticket Issued",
            message=f"A ticket (#{ticket.ticket_number}) for '{event.title}' has been issued to your account.",
            notification_type='TICKET'
        )

        create_audit_log(request.user, "TICKET_ISSUED_ADMIN", "Ticket", ticket.id, {
            "ticket_number": ticket.ticket_number,
            "event": event.title,
            "attendee": target_user.name,
            "price": str(price)
        })

        broadcast_ws_event("ticket_purchased", {
            "ticket_id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "event_id": event.id,
            "event_title": event.title,
            "attendee_name": target_user.name
        })

        return success_response(
            data=TicketSerializer(ticket).data,
            message=f"Ticket #{ticket.ticket_number} successfully issued for {target_user.name}.",
            status_code=status.HTTP_201_CREATED
        )


    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'] or user.is_superuser:
            queryset = Ticket.objects.all().select_related('event', 'user', 'payment').order_by('-purchased_at')
            event_id = self.request.query_params.get('event_id')
            status_param = self.request.query_params.get('status')
            user_id = self.request.query_params.get('user_id')
            search = self.request.query_params.get('search')

            if event_id:
                queryset = queryset.filter(event_id=event_id)
            if status_param:
                queryset = queryset.filter(status=status_param)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            if search:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(ticket_number__icontains=search) |
                    Q(user__name__icontains=search) |
                    Q(user__email__icontains=search) |
                    Q(event__title__icontains=search)
                )
            return queryset
        return Ticket.objects.filter(user=user).select_related('event', 'user', 'payment').order_by('-purchased_at')

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_ticket(self, request, pk=None):
        ticket = self.get_object()
        user = request.user

        # Permission check: owner or admin
        if ticket.user != user and not (user.role in ['SUPER_ADMIN', 'PRESIDENT'] or user.is_superuser):
            return error_response(message="You do not have permission to cancel this ticket.", code="FORBIDDEN")

        if ticket.status == 'CANCELLED':
            return error_response(message="This ticket is already cancelled.", code="ALREADY_CANCELLED")
        if ticket.status == 'USED':
            return error_response(message="Cannot cancel a ticket that has already been checked in.", code="TICKET_USED")

        if ticket.event.start_datetime < timezone.now():
            return error_response(message="Cannot cancel a ticket after the event has started.", code="EVENT_STARTED")

        ticket.status = 'CANCELLED'
        ticket.save(update_fields=['status', 'updated_at'])

        # Create refund transaction if price > 0
        if ticket.price > 0:
            Transaction.objects.create(
                transaction_type='EXPENSE',
                category='EVENT_TICKET',
                amount=ticket.price,
                description=f"Ticket Refund: {ticket.ticket_number} for {ticket.event.title}",
                reference_type='EVENT_TICKET_REFUND',
                reference_id=str(ticket.id),
                created_by=user
            )

        create_audit_log(user, "TICKET_CANCELLED", "Ticket", ticket.id, {
            "ticket_number": ticket.ticket_number,
            "event": ticket.event.title
        })

        broadcast_ws_event("ticket_cancelled", {
            "ticket_id": ticket.id,
            "event_id": ticket.event.id
        })
        broadcast_ws_event("finance_updated", {"message": "Ticket refund recorded"})

        return success_response(
            data=TicketSerializer(ticket).data,
            message="Ticket has been cancelled successfully."
        )


class EventTicketPurchaseView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        user = request.user
        now = timezone.now()

        # Business Rule 1: Event status must be PUBLISHED
        if event.status != 'PUBLISHED':
            return error_response(
                message=f"Event is currently {event.get_status_display().lower()} and not open for ticket sales.",
                code="EVENT_NOT_PUBLISHED"
            )

        # Business Rule 2: Registration window validation (with 5-minute tolerance)
        tolerance = timedelta(minutes=5)
        if (now + tolerance) < event.registration_open:
            local_open = timezone.localtime(event.registration_open)
            return error_response(
                message=f"Registration opens on {local_open.strftime('%b %d, %Y at %I:%M %p')}.",
                code="REGISTRATION_NOT_OPEN"
            )
        if (now - tolerance) > event.registration_close:
            return error_response(
                message="Registration for this event has closed.",
                code="REGISTRATION_CLOSED"
            )

        # Business Rule 3: Capacity validation
        if event.seats_remaining <= 0:
            return error_response(
                message="Sorry, this event is fully booked. No seats remaining.",
                code="EVENT_FULL"
            )

        # Business Rule 4: Duplicate ticket prevention
        existing_ticket = Ticket.objects.filter(
            event=event,
            user=user,
            status__in=['CONFIRMED', 'USED']
        ).first()
        if existing_ticket:
            return error_response(
                message=f"You already have a confirmed ticket ({existing_ticket.ticket_number}) for this event.",
                code="DUPLICATE_TICKET"
            )

        # Business Rule 5: Server-calculated Member vs Non-member pricing
        if user.has_active_membership:
            price = event.member_price
            ticket_type = 'MEMBER'
        else:
            price = event.non_member_price
            ticket_type = 'NON_MEMBER'

        # Create Demo Payment Record
        payment = Payment.objects.create(
            user=user,
            amount=price,
            currency="INR",
            provider="Demo Payment Provider",
            reference=f"PAY-EVT-{uuid.uuid4().hex[:8].upper()}",
            status="SUCCESS"
        )

        # Create Ticket
        ticket_number = Ticket.generate_ticket_number(event.id)
        qr_token = Ticket.generate_qr_token()

        ticket = Ticket.objects.create(
            ticket_number=ticket_number,
            event=event,
            user=user,
            ticket_type=ticket_type,
            price=price,
            payment=payment,
            qr_token=qr_token,
            status='CONFIRMED'
        )

        # Create Financial Transaction
        if price > 0:
            Transaction.objects.create(
                transaction_type='INCOME',
                category='EVENT_TICKET',
                amount=price,
                description=f"Ticket Purchase: {event.title} ({ticket_type}) by {user.name}",
                reference_type='EVENT_TICKET',
                reference_id=str(ticket.id),
                created_by=user
            )

        # In-app notification
        Notification.objects.create(
            user=user,
            title="Ticket Confirmed!",
            message=f"Your ticket for '{event.title}' is confirmed. Ticket #: {ticket_number}",
            notification_type='TICKET'
        )

        # Confirmation email
        try:
            send_mail(
                subject=f"SKYVENT Ticket Confirmation - {event.title}",
                message=(
                    f"Hello {user.name},\n\n"
                    f"Your ticket for {event.title} is confirmed!\n\n"
                    f"Event: {event.title}\n"
                    f"Venue: {event.venue}\n"
                    f"Date & Time: {event.start_datetime.strftime('%A, %B %d, %Y at %I:%M %p')}\n"
                    f"Ticket Number: {ticket_number}\n"
                    f"Pass Type: {ticket_type}\n"
                    f"Amount Paid: ₹{price}\n\n"
                    f"Show your digital QR pass from the SKYVENT dashboard at the check-in desk.\n\n"
                    f"See you there!\nSKYVENT Team"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
        except Exception as e:
            pass

        create_audit_log(user, "TICKET_PURCHASED", "Ticket", ticket.id, {
            "ticket_number": ticket_number,
            "event": event.title,
            "price": str(price),
            "ticket_type": ticket_type
        })

        # Broadcast WebSocket events for real-time dashboard updates
        broadcast_ws_event("ticket_purchased", {
            "event_id": event.id,
            "ticket_id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "seats_remaining": event.seats_remaining,
            "tickets_sold": event.tickets_sold_count
        })
        if price > 0:
            broadcast_ws_event("finance_updated", {"amount": str(price), "type": "TICKET"})

        return success_response(
            data=TicketSerializer(ticket).data,
            message="Ticket purchased successfully!",
            status_code=status.HTTP_201_CREATED
        )
