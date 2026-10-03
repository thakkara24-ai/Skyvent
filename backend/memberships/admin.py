from django.contrib import admin
from .models import MembershipPlan, Membership

@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_days', 'discount_percentage', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'start_date', 'end_date', 'status', 'effective_status', 'created_at')
    list_filter = ('status', 'plan', 'start_date', 'end_date')
    search_fields = ('user__name', 'user__email', 'plan__name')
