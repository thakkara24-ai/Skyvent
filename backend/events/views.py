from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Event
from .serializers import EventSerializer
from common.responses import success_response, error_response
from common.permissions import ReadOnlyOrVolunteerAdmin
from common.utils import create_audit_log, broadcast_ws_event

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('start_datetime')
    serializer_class = EventSerializer
    permission_classes = [ReadOnlyOrVolunteerAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'venue', 'category']
    ordering_fields = ['start_datetime', 'created_at', 'capacity', 'member_price']

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.all()

        # Non-volunteer/admin users only see PUBLISHED events
        if not (user.is_authenticated and (user.role in ['SUPER_ADMIN', 'VOLUNTEER'] or user.is_superuser)):
            queryset = queryset.filter(status='PUBLISHED')

        category = self.request.query_params.get('category')
        status_param = self.request.query_params.get('status')
        upcoming = self.request.query_params.get('upcoming')
        search = self.request.query_params.get('search')

        if category and category != 'ALL':
            queryset = queryset.filter(category=category)
        if status_param and user.is_authenticated and (user.role in ['SUPER_ADMIN', 'VOLUNTEER'] or user.is_superuser):
            queryset = queryset.filter(status=status_param)
        if upcoming == 'true':
            queryset = queryset.filter(end_datetime__gte=timezone.now())
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(venue__icontains=search)
            )

        return queryset.order_by('start_datetime')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        event = serializer.save(created_by=self.request.user)
        create_audit_log(self.request.user, "EVENT_CREATED", "Event", event.id, {"title": event.title})
        broadcast_ws_event("event_created", {"id": event.id, "title": event.title})
        return success_response(data=serializer.data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        event = serializer.save()
        if old_status != event.status:
            create_audit_log(
                self.request.user,
                "EVENT_STATUS_CHANGED",
                "Event",
                event.id,
                {"old_status": old_status, "new_status": event.status}
            )
            broadcast_ws_event("event_updated", {"id": event.id, "status": event.status})
        return success_response(data=serializer.data)
