from rest_framework import viewsets, views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Notification
from .serializers import NotificationSerializer
from common.responses import success_response, error_response

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    def partial_update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = request.data.get('is_read', True)
        notification.save(update_fields=['is_read'])
        return success_response(data=NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return success_response(message="All notifications marked as read.")

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return success_response(data={'unread_count': count})
