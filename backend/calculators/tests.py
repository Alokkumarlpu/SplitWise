from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import CalculatorHistory

class CalculatorTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.rent_url = reverse('calculate_rent')
        self.travel_url = reverse('calculate_travel')
        self.history_url = reverse('calculator_history')

    def test_rent_split_equal(self):
        # Test anonymous equal split
        data = {
            "total_amount": 3000,
            "participants": 3
        }
        response = self.client.post(self.rent_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['per_person'], "1000.00")
        self.assertEqual(response.data['splits'], ["1000.00", "1000.00", "1000.00"])
        # Verify history is not logged for anonymous user
        self.assertEqual(CalculatorHistory.objects.count(), 0)

    def test_rent_split_weighted(self):
        # Test anonymous weighted split
        data = {
            "total_amount": 3000,
            "participants": 3,
            "room_weights": [120, 100, 80]
        }
        response = self.client.post(self.rent_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 3000 * 120 / 300 = 1200
        # 3000 * 100 / 300 = 1000
        # 3000 * 80 / 300 = 800
        self.assertEqual(response.data['splits'], ["1200.00", "1000.00", "800.00"])
        self.assertEqual(CalculatorHistory.objects.count(), 0)

    def test_rent_split_authenticated_logs_history(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "total_amount": 1500,
            "participants": 2
        }
        response = self.client.post(self.rent_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify history is logged
        self.assertEqual(CalculatorHistory.objects.count(), 1)
        history = CalculatorHistory.objects.first()
        self.assertEqual(history.user, self.user)
        self.assertEqual(history.calculator_type, 'rent')
        self.assertEqual(history.result_data['per_person'], "750.00")

    def test_travel_split(self):
        # Test anonymous travel split
        data = {
            "total_amount": 500,
            "participants": 4
        }
        response = self.client.post(self.travel_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['per_person'], "125.00")
        self.assertEqual(response.data['splits'], ["125.00", "125.00", "125.00", "125.00"])
        self.assertEqual(CalculatorHistory.objects.count(), 0)

    def test_travel_split_authenticated_logs_history(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "total_amount": 600,
            "participants": 3
        }
        response = self.client.post(self.travel_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(CalculatorHistory.objects.count(), 1)
        history = CalculatorHistory.objects.first()
        self.assertEqual(history.user, self.user)
        self.assertEqual(history.calculator_type, 'travel')

    def test_get_history_authenticated(self):
        self.client.force_authenticate(user=self.user)
        # Log a calculation first
        CalculatorHistory.objects.create(
            user=self.user,
            calculator_type='rent',
            input_data={"total_amount": 100},
            result_data={"per_person": "50.00"}
        )
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['calculator_type'], 'rent')

    def test_get_history_anonymous_denied(self):
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
