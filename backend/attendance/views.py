from rest_framework import views, status, generics
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Attendance
from .serializers import AttendanceSerializer, CheckInRequestSerializer
from tickets.models import Ticket
from events.models import Event
from common.responses import success_response, error_response
from common.permissions import IsVolunteerOrStaff
from common.utils import create_audit_log, broadcast_ws_event

class CheckInView(views.APIView):
    permission_classes = [IsAuthenticated, IsVolunteerOrStaff]

    def post(self, request):
        serializer = CheckInRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        qr_token = serializer.validated_data.get('qr_token', '').strip()
        ticket_number = serializer.validated_data.get('ticket_number', '').strip()
        event_id = serializer.validated_data.get('event_id')
        method = serializer.validated_data.get('method', 'QR')

        ticket = None
        if qr_token:
            ticket = Ticket.objects.filter(qr_token=qr_token).select_related('event', 'user').first()
        elif ticket_number:
            ticket = Ticket.objects.filter(ticket_number__iexact=ticket_number).select_related('event', 'user').first()

        if not ticket:
            return error_response(
                message="Invalid ticket or QR token. No matching ticket found.",
                code="TICKET_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if event_id and ticket.event_id != int(event_id):
            return error_response(
                message=f"This ticket is for '{ticket.event.title}', not the selected event.",
                code="EVENT_MISMATCH"
            )

        if ticket.status == 'CANCELLED':
            return error_response(
                message="This ticket has been cancelled and cannot be used for entry.",
                code="TICKET_CANCELLED"
            )

        if ticket.status == 'USED':
            prev_attendance = Attendance.objects.filter(ticket=ticket).first()
            time_str = prev_attendance.checked_in_at.strftime('%I:%M %p, %b %d') if prev_attendance else "earlier"
            staff_name = prev_attendance.checked_in_by.name if (prev_attendance and prev_attendance.checked_in_by) else "Staff"
            return error_response(
                message=f"Ticket already checked in at {time_str} by {staff_name}.",
                code="ALREADY_CHECKED_IN",
                errors={
                    "attendee_name": ticket.user.name,
                    "ticket_number": ticket.ticket_number,
                    "event_title": ticket.event.title,
                    "checked_in_at": prev_attendance.checked_in_at.isoformat() if prev_attendance else None
                }
            )

        # Process valid check-in
        ticket.status = 'USED'
        ticket.save(update_fields=['status', 'updated_at'])

        attendance = Attendance.objects.create(
            event=ticket.event,
            ticket=ticket,
            user=ticket.user,
            checked_in_by=request.user,
            method=method
        )

        create_audit_log(
            request.user,
            "ATTENDANCE_CHECK_IN",
            "Attendance",
            attendance.id,
            {
                "ticket_number": ticket.ticket_number,
                "event": ticket.event.title,
                "attendee": ticket.user.name,
                "method": method
            }
        )

        # Real-time WebSocket broadcast
        broadcast_ws_event("attendance_updated", {
            "event_id": ticket.event.id,
            "event_title": ticket.event.title,
            "checked_in_count": ticket.event.checked_in_count,
            "tickets_sold_count": ticket.event.tickets_sold_count,
            "attendee_name": ticket.user.name,
            "student_id": ticket.user.student_id,
            "ticket_number": ticket.ticket_number,
            "checked_in_at": attendance.checked_in_at.isoformat()
        })
        broadcast_ws_event("ticket_checked_in", {
            "ticket_id": ticket.id,
            "ticket_number": ticket.ticket_number
        })

        return success_response(
            data={
                "attendance_id": attendance.id,
                "ticket_number": ticket.ticket_number,
                "attendee_name": ticket.user.name,
                "attendee_email": ticket.user.email,
                "student_id": ticket.user.student_id,
                "department": ticket.user.department,
                "event_id": ticket.event.id,
                "event_title": ticket.event.title,
                "ticket_type": ticket.ticket_type,
                "checked_in_at": attendance.checked_in_at.isoformat(),
                "checked_in_by": request.user.name,
                "method": method,
                "event_checked_in_count": ticket.event.checked_in_count,
                "event_tickets_sold_count": ticket.event.tickets_sold_count
            },
            message=f"Check-in successful! Welcome, {ticket.user.name}."
        )


class EventAttendanceListView(generics.ListAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsVolunteerOrStaff]

    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        queryset = Attendance.objects.filter(event_id=event_id).select_related('user', 'ticket', 'checked_in_by').order_by('-checked_in_at')
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(user__name__icontains=search) |
                Q(user__email__icontains=search) |
                Q(user__student_id__icontains=search) |
                Q(ticket__ticket_number__icontains=search)
            )
        return queryset
