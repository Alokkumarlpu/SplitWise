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
    GlobalBalanceView, MeView
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
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/users/me/', MeView.as_view(), name='user_me'),
    path('api/users/', UserSearchView.as_view(), name='user_search'),
    path('api/balances/', GlobalBalanceView.as_view(), name='global_balances'),
    path('api/expenses/<int:expense_id>/messages/', ChatMessageListView.as_view(), name='expense_messages'),
]

