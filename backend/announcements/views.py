from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from django.utils import timezone

from .models import Announcement
from .serializers import AnnouncementSerializer
from notifications.models import Notification
from accounts.models import User
from common.responses import success_response, error_response
from common.permissions import ReadOnlyOrStaff
from common.utils import create_audit_log, broadcast_ws_event

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all().order_by('-published_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [ReadOnlyOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['published_at', 'priority']

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.all()

        if not (user.is_authenticated and (user.role in ['SUPER_ADMIN', 'PRESIDENT'] or user.is_superuser)):
            queryset = queryset.filter(published=True)
            if user.is_authenticated:
                # Filter by audience
                if user.role == 'VOLUNTEER':
                    queryset = queryset.filter(audience__in=['ALL', 'VOLUNTEERS', 'MEMBERS'])
                elif user.role == 'TREASURER':
                    queryset = queryset.filter(audience__in=['ALL', 'TREASURERS', 'MEMBERS'])
                elif user.role == 'MEMBER':
                    queryset = queryset.filter(audience__in=['ALL', 'MEMBERS'])
            else:
                queryset = queryset.filter(audience='ALL')

        return queryset.order_by('-published_at')

    def perform_create(self, serializer):
        announcement = serializer.save(created_by=self.request.user)
        create_audit_log(
            self.request.user,
            "ANNOUNCEMENT_CREATED",
            "Announcement",
            announcement.id,
            {"title": announcement.title, "priority": announcement.priority}
        )

        # Create notifications for targeted users
        if announcement.published:
            users_query = User.objects.filter(is_active=True)
            if announcement.audience == 'MEMBERS':
                users_query = users_query.filter(role__in=['MEMBER', 'VOLUNTEER', 'TREASURER', 'PRESIDENT', 'SUPER_ADMIN'])
            elif announcement.audience == 'VOLUNTEERS':
                users_query = users_query.filter(role__in=['VOLUNTEER', 'SUPER_ADMIN', 'PRESIDENT'])
            elif announcement.audience == 'TREASURERS':
                users_query = users_query.filter(role__in=['TREASURER', 'SUPER_ADMIN', 'PRESIDENT'])

            notifications = [
                Notification(
                    user=u,
                    title=f"Announcement: {announcement.title}",
                    message=announcement.content[:150] + ('...' if len(announcement.content) > 150 else ''),
                    notification_type='SYSTEM'
                )
                for u in users_query[:100]  # bulk batch
            ]
            Notification.objects.bulk_create(notifications)

        broadcast_ws_event("announcement_created", {
            "id": announcement.id,
            "title": announcement.title,
            "priority": announcement.priority,
            "audience": announcement.audience
        })
