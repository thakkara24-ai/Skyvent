from django.urls import path
from .views import AdminDashboardView, MemberDashboardView, ReportsView, AuditLogListView

urlpatterns = [
    path('dashboard/admin/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('dashboard/member/', MemberDashboardView.as_view(), name='member_dashboard'),
    path('reports/', ReportsView.as_view(), name='reports'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit_logs'),
]
