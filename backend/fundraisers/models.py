from django.db import models
from django.conf import settings
from django.utils import timezone

FUNDRAISER_STATUS = (
    ('PLANNED', 'Planned'),
    ('ACTIVE', 'Active Campaign'),
    ('COMPLETED', 'Completed'),
    ('CANCELLED', 'Cancelled'),
)

TASK_STATUS = (
    ('TODO', 'To Do'),
    ('IN_PROGRESS', 'In Progress'),
    ('COMPLETED', 'Completed'),
    ('BLOCKED', 'Blocked'),
)

TASK_PRIORITY = (
    ('LOW', 'Low'),
    ('MEDIUM', 'Medium'),
    ('HIGH', 'High'),
    ('URGENT', 'Urgent'),
)

class Fundraiser(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=FUNDRAISER_STATUS, default='ACTIVE')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_fundraisers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Fundraiser'
        verbose_name_plural = 'Fundraisers'

    def __str__(self):
        return f"{self.title} (Goal: ₹{self.goal_amount}, Raised: ₹{self.raised_amount})"

    @property
    def progress_percentage(self):
        if self.goal_amount <= 0:
            return 0
        return min(100, int((self.raised_amount / self.goal_amount) * 100))


class FundraiserTask(models.Model):
    fundraiser = models.ForeignKey(
        Fundraiser,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fundraiser_tasks'
    )
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='TODO')
    priority = models.CharField(max_length=20, choices=TASK_PRIORITY, default='MEDIUM')
    due_date = models.DateField()
    progress = models.PositiveIntegerField(default=0, help_text="Percentage 0-100")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', '-priority']
        verbose_name = 'Fundraiser Task'
        verbose_name_plural = 'Fundraiser Tasks'

    def __str__(self):
        return f"{self.title} [{self.status}] (Due: {self.due_date})"

    @property
    def is_overdue(self):
        if self.status == 'COMPLETED':
            return False
        return self.due_date < timezone.now().date()
