from rest_framework import serializers
from .models import SupportTicket

class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ('id', 'user', 'name', 'email', 'subject', 'message', 'status', 'created_at')
        read_only_fields = ('id', 'user', 'status', 'created_at')

    def validate(self, attrs):
        request = self.context.get('request')
        # If guest user (not authenticated), require name and email
        if not (request and request.user and request.user.is_authenticated):
            if not attrs.get('name') or not attrs.get('email'):
                raise serializers.ValidationError("Name and email are required for guest support tickets.")
        return attrs
