"""
URL configuration for splitwise_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from splitwise_api.views import (
    RegisterView, GroupViewSet, ExpenseViewSet,
    SettlementViewSet, ChatMessageListView, UserSearchView,
    GlobalBalanceView, MeView, CustomTokenObtainPairView,
    ProfileSettingsView, AvatarUploadView, PreferencesSettingsView,
    ChangePasswordView, DeleteAccountView, NotificationSettingsView,
    PrivacySettingsView, BlockUserView, UnblockUserView,
    TerminateSessionView, LogoutAllView
)

router = DefaultRouter()
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'settlements', SettlementViewSet, basename='settlement')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Custom API endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout-all/', LogoutAllView.as_view(), name='auth_logout_all'),
    
    path('api/users/me/', MeView.as_view(), name='user_me'),
    path('api/users/', UserSearchView.as_view(), name='user_search'),
    path('api/balances/', GlobalBalanceView.as_view(), name='global_balances'),
    path('api/expenses/<int:expense_id>/messages/', ChatMessageListView.as_view(), name='expense_messages'),
    
    # Profile & Settings endpoints
    path('api/profile/', ProfileSettingsView.as_view(), name='profile_settings'),
    path('api/profile/avatar/', AvatarUploadView.as_view(), name='profile_avatar'),
    path('api/profile/preferences/', PreferencesSettingsView.as_view(), name='profile_preferences'),
    path('api/profile/change-password/', ChangePasswordView.as_view(), name='profile_change_password'),
    path('api/profile/delete-account/', DeleteAccountView.as_view(), name='profile_delete_account'),
    path('api/profile/notifications/', NotificationSettingsView.as_view(), name='profile_notifications'),
    path('api/profile/privacy/', PrivacySettingsView.as_view(), name='profile_privacy'),
    path('api/profile/privacy/block/', BlockUserView.as_view(), name='profile_block'),
    path('api/profile/privacy/unblock/', UnblockUserView.as_view(), name='profile_unblock'),
    path('api/profile/privacy/terminate-session/', TerminateSessionView.as_view(), name='profile_terminate_session'),
]

