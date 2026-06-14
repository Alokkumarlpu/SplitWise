from django.urls import path
from .views import CalculatorHistoryListView, RentCalculatorView, TravelCalculatorView

urlpatterns = [
    path('', CalculatorHistoryListView.as_view(), name='calculator_history'),
    path('rent/', RentCalculatorView.as_view(), name='calculate_rent'),
    path('travel/', TravelCalculatorView.as_view(), name='calculate_travel'),
]
