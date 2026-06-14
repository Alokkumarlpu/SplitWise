from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FriendshipViewSet, FriendInviteView

router = DefaultRouter()
router.register(r'', FriendshipViewSet, basename='friendship')

urlpatterns = [
    path('invite/', FriendInviteView.as_view(), name='friend_invite'),
    path('', include(router.urls)),
]
