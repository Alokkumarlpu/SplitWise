from rest_framework import generics, permissions
from django.db.models import Q
from .models import Activity
from .serializers import ActivitySerializer

class ActivityListView(generics.ListAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Activity.objects.filter(
            Q(user=user) | Q(group__members=user)
        ).distinct().order_by('-created_at')
