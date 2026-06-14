from django.urls import path
from .views import (
    CalculatorHistoryListView, RentCalculatorView, TravelCalculatorView,
    InsuranceCalculatorView, FurnitureCalculatorView, GuestCalculatorView
)

urlpatterns = [
    path('', CalculatorHistoryListView.as_view(), name='calculator_history'),
    path('rent/', RentCalculatorView.as_view(), name='calculate_rent'),
    path('travel/', TravelCalculatorView.as_view(), name='calculate_travel'),
    path('insurance/', InsuranceCalculatorView.as_view(), name='calculate_insurance'),
    path('furniture/', FurnitureCalculatorView.as_view(), name='calculate_furniture'),
    path('guest/', GuestCalculatorView.as_view(), name='calculate_guest'),
]
