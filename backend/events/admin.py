from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'venue', 'start_datetime', 'capacity', 'member_price', 'non_member_price', 'status', 'created_at')
    list_filter = ('category', 'status', 'start_datetime')
    search_fields = ('title', 'description', 'venue')
    ordering = ('start_datetime',)
