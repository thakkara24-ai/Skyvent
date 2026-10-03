from django.contrib import admin
from .models import Attendance

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'ticket', 'method', 'checked_in_by', 'checked_in_at')
    list_filter = ('method', 'event', 'checked_in_at')
    search_fields = ('user__name', 'user__email', 'ticket__ticket_number', 'event__title')
