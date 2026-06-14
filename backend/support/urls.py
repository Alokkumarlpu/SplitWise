from django.urls import path
from .views import SupportTicketCreateView

urlpatterns = [
    path('', SupportTicketCreateView.as_view(), name='create_ticket'),
]
