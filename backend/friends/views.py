from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Friendship, FriendInvite
from .serializers import FriendshipSerializer, FriendInviteSerializer
from activity.models import Activity

class FriendshipViewSet(viewsets.ModelViewSet):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Friendship.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request):
        identifier = request.data.get('identifier')
        if not identifier:
            return Response({"error": "Username or email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Look up friend user
            friend_user = User.objects.get(Q(username=identifier) | Q(email=identifier))
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if friend_user == request.user:
            return Response({"error": "You cannot add yourself as a friend."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if friendship already exists
        if Friendship.objects.filter(user=request.user, friend=friend_user).exists():
            return Response({"error": "You are already friends with this user."}, status=status.HTTP_400_BAD_REQUEST)

        # Create both records inside a transaction
        with transaction.atomic():
            f1 = Friendship.objects.create(user=request.user, friend=friend_user)
            f2, created = Friendship.objects.get_or_create(user=friend_user, friend=request.user)

            # Log activity
            Activity.objects.create(
                type='member_added',
                user=request.user,
                description=f"{request.user.username} added {friend_user.username} as a friend."
            )

        serializer = self.get_serializer(f1)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            friendship = Friendship.objects.get(id=pk, user=request.user)
        except Friendship.DoesNotExist:
            return Response({"error": "Friendship not found."}, status=status.HTTP_404_NOT_FOUND)

        friend_user = friendship.friend

        # Delete both records inside a transaction
        with transaction.atomic():
            friendship.delete()
            Friendship.objects.filter(user=friend_user, friend=request.user).delete()

            # Log activity
            Activity.objects.create(
                type='member_removed',
                user=request.user,
                description=f"{request.user.username} removed {friend_user.username} from friends."
            )

        return Response({"message": "Friend removed successfully."}, status=status.HTTP_200_OK)

class FriendInviteView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already friends with a user owning this email
        friend_user = User.objects.filter(email=email).first()
        if friend_user:
            if Friendship.objects.filter(user=request.user, friend=friend_user).exists():
                return Response({"error": "You are already friends with this user."}, status=status.HTTP_400_BAD_REQUEST)

        invite = FriendInvite.objects.create(
            sender=request.user,
            email=email,
            status='pending'
        )

        # Log activity
        Activity.objects.create(
            type='member_added',
            user=request.user,
            description=f"{request.user.username} sent a Splitwise invite to {email}."
        )

        serializer = FriendInviteSerializer(invite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
