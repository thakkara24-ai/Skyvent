from django.urls import path
from .views import CheckInView, EventAttendanceListView

urlpatterns = [
    path('attendance/check-in/', CheckInView.as_view(), name='attendance_check_in'),
    path('events/<int:event_id>/attendance/', EventAttendanceListView.as_view(), name='event_attendance_list'),
]
