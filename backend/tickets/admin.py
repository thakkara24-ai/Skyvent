from django.contrib import admin
from .models import Ticket

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'event', 'user', 'ticket_type', 'price', 'status', 'purchased_at')
    list_filter = ('ticket_type', 'status', 'event')
    search_fields = ('ticket_number', 'user__name', 'user__email', 'event__title', 'qr_token')
    readonly_fields = ('qr_token', 'purchased_at', 'updated_at')
