from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Fundraiser, FundraiserTask
from .serializers import FundraiserSerializer, FundraiserTaskSerializer
from common.responses import success_response, error_response
from common.permissions import IsVolunteerOrStaff, IsPresidentOrAdmin, ReadOnlyOrStaff
from common.utils import create_audit_log, broadcast_ws_event

class FundraiserViewSet(viewsets.ModelViewSet):
    queryset = Fundraiser.objects.all().order_by('-created_at')
    serializer_class = FundraiserSerializer
    permission_classes = [ReadOnlyOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'goal_amount', 'raised_amount', 'end_date']

    def perform_create(self, serializer):
        fundraiser = serializer.save(created_by=self.request.user)
        create_audit_log(self.request.user, "FUNDRAISER_CREATED", "Fundraiser", fundraiser.id, {"title": fundraiser.title})

    @action(detail=True, methods=['get', 'post'], url_path='tasks')
    def fundraiser_tasks(self, request, pk=None):
        fundraiser = self.get_object()
        if request.method == 'GET':
            tasks = fundraiser.tasks.all().select_related('assignee')
            return success_response(data=FundraiserTaskSerializer(tasks, many=True).data)
        
        # POST new task
        if not (request.user.role in ['SUPER_ADMIN', 'PRESIDENT', 'VOLUNTEER'] or request.user.is_superuser):
            return error_response(message="Permission denied.", code="FORBIDDEN")
        
        data = request.data.copy()
        data['fundraiser'] = fundraiser.id
        serializer = FundraiserTaskSerializer(data=data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        task = serializer.save(fundraiser=fundraiser)
        create_audit_log(request.user, "FUNDRAISER_TASK_CREATED", "FundraiserTask", task.id, {"title": task.title})
        return success_response(data=FundraiserTaskSerializer(task).data, status_code=status.HTTP_201_CREATED)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = FundraiserTask.objects.all().select_related('fundraiser', 'assignee').order_by('due_date')
    serializer_class = FundraiserTaskSerializer
    permission_classes = [IsAuthenticated, IsVolunteerOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = FundraiserTask.objects.all().select_related('fundraiser', 'assignee')
        fundraiser_id = self.request.query_params.get('fundraiser_id')
        status_param = self.request.query_params.get('status')
        assignee_id = self.request.query_params.get('assignee_id')

        if fundraiser_id:
            queryset = queryset.filter(fundraiser_id=fundraiser_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if assignee_id:
            queryset = queryset.filter(assignee_id=assignee_id)

        return queryset.order_by('due_date')

    def perform_update(self, serializer):
        task = serializer.save()
        create_audit_log(self.request.user, "FUNDRAISER_TASK_UPDATED", "FundraiserTask", task.id, {
            "status": task.status,
            "progress": task.progress
        })
