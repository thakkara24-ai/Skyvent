from django.contrib import admin
from .models import Payment, Transaction, Expense

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'user', 'amount', 'currency', 'provider', 'status', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('reference', 'user__name', 'user__email')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'category', 'amount', 'description', 'reference_type', 'reference_id', 'created_at')
    list_filter = ('transaction_type', 'category', 'created_at')
    search_fields = ('description', 'reference_id', 'reference_type')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'category', 'submitted_by', 'approved_by', 'status', 'created_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'description', 'submitted_by__name', 'submitted_by__email')
