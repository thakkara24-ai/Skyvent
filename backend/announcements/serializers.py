from rest_framework import serializers
from .models import Announcement
from accounts.serializers import UserSerializer

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'audience', 'priority',
            'published', 'published_at', 'expires_at',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
