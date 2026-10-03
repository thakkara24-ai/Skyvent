from rest_framework import serializers
from .models import Fundraiser, FundraiserTask
from accounts.serializers import UserSerializer
from accounts.models import User

class FundraiserTaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assignee',
        write_only=True,
        required=False,
        allow_null=True
    )
    is_overdue = serializers.BooleanField(read_only=True)
    fundraiser_title = serializers.CharField(source='fundraiser.title', read_only=True)

    class Meta:
        model = FundraiserTask
        fields = [
            'id', 'fundraiser', 'fundraiser_title', 'title', 'description',
            'assignee', 'assignee_id', 'status', 'priority',
            'due_date', 'progress', 'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class FundraiserSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    progress_percentage = serializers.IntegerField(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Fundraiser
        fields = [
            'id', 'title', 'description', 'goal_amount', 'raised_amount',
            'start_date', 'end_date', 'status', 'created_by',
            'progress_percentage', 'tasks_count', 'completed_tasks_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_completed_tasks_count(self, obj):
        return obj.tasks.filter(status='COMPLETED').count()
