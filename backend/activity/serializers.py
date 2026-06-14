from rest_framework import serializers
from .models import Activity

class ActivitySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)

    class Meta:
        model = Activity
        fields = ('id', 'type', 'user', 'username', 'group', 'group_name', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')
