from rest_framework import serializers
from .models import Payment, Transaction, Expense
from accounts.serializers import UserSerializer

class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'amount', 'currency', 'provider',
            'reference', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

class TransactionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'category', 'category_display',
            'amount', 'description', 'reference_type', 'reference_id',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

class ExpenseSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    approved_by = UserSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'amount', 'category', 'category_display',
            'description', 'receipt', 'submitted_by', 'approved_by',
            'status', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'submitted_by', 'approved_by', 'created_at', 'updated_at']

class CreateExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['title', 'amount', 'category', 'description', 'receipt']

class ApproveExpenseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['APPROVED', 'REJECTED', 'PAID'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')
