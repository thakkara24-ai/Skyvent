from django.contrib import admin
from .models import Announcement

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'audience', 'priority', 'published', 'published_at', 'created_by')
    list_filter = ('audience', 'priority', 'published')
    search_fields = ('title', 'content')
