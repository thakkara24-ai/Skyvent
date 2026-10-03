from django.db import models
from django.conf import settings

PAYMENT_STATUS = (
    ('PENDING', 'Pending'),
    ('SUCCESS', 'Success'),
    ('FAILED', 'Failed'),
    ('REFUNDED', 'Refunded'),
)

TRANSACTION_TYPES = (
    ('INCOME', 'Income'),
    ('EXPENSE', 'Expense'),
)

TRANSACTION_CATEGORIES = (
    ('MEMBERSHIP', 'Membership Subscriptions'),
    ('EVENT_TICKET', 'Event Tickets'),
    ('MERCHANDISE', 'Merchandise Sales'),
    ('FUNDRAISER', 'Fundraising Donations'),
    ('REIMBURSEMENT', 'Volunteer Reimbursements'),
    ('OPERATIONS', 'Club Operations & Logistics'),
    ('CATERING', 'Food & Catering'),
    ('MARKETING', 'Marketing & Promo'),
    ('OTHER', 'Other'),
)

EXPENSE_STATUS = (
    ('PENDING', 'Pending Approval'),
    ('APPROVED', 'Approved'),
    ('REJECTED', 'Rejected'),
    ('PAID', 'Paid / Disbursed'),
)

class Payment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    provider = models.CharField(max_length=64, default='Demo Payment Provider')
    reference = models.CharField(max_length=128, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'

    def __str__(self):
        return f"{self.reference} - {self.user.name} (₹{self.amount}) [{self.status}]"


class Transaction(models.Model):
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, db_index=True)
    category = models.CharField(max_length=40, choices=TRANSACTION_CATEGORIES, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    reference_type = models.CharField(max_length=64, blank=True, default='')
    reference_id = models.CharField(max_length=128, blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Financial Transaction'
        verbose_name_plural = 'Financial Transactions'

    def __str__(self):
        sign = '+' if self.transaction_type == 'INCOME' else '-'
        return f"[{self.transaction_type}] {sign}₹{self.amount} - {self.get_category_display()} ({self.description[:40]})"


class Expense(models.Model):
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=40, choices=TRANSACTION_CATEGORIES, default='REIMBURSEMENT')
    description = models.TextField()
    receipt = models.CharField(max_length=500, blank=True, default='')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_expenses'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_expenses'
    )
    status = models.CharField(max_length=20, choices=EXPENSE_STATUS, default='PENDING', db_index=True)
    rejection_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Expense & Reimbursement'
        verbose_name_plural = 'Expenses & Reimbursements'

    def __str__(self):
        return f"{self.title} (₹{self.amount}) - {self.submitted_by.name} [{self.status}]"
