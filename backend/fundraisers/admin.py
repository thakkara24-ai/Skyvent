from django.contrib import admin
from .models import Fundraiser, FundraiserTask

class FundraiserTaskInline(admin.TabularInline):
    model = FundraiserTask
    extra = 1

@admin.register(Fundraiser)
class FundraiserAdmin(admin.ModelAdmin):
    list_display = ('title', 'goal_amount', 'raised_amount', 'start_date', 'end_date', 'status', 'created_at')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('title', 'description')
    inlines = [FundraiserTaskInline]

@admin.register(FundraiserTask)
class FundraiserTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'fundraiser', 'assignee', 'status', 'priority', 'due_date', 'progress')
    list_filter = ('status', 'priority', 'due_date')
    search_fields = ('title', 'description', 'assignee__name')
