"""
URL configuration for SKYVENT project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # SKYVENT REST APIs
    path('api/', include('accounts.urls')),
    path('api/', include('memberships.urls')),
    path('api/', include('events.urls')),
    path('api/', include('tickets.urls')),
    path('api/', include('attendance.urls')),
    path('api/', include('merchandise.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('announcements.urls')),
    path('api/', include('fundraisers.urls')),
    path('api/', include('finance.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('dashboard.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
