from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from splitwise_api.models import Group, Expense, Settlement, ChatMessage
from .models import Activity

class ActivityLoggingTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='alice', email='alice@test.com', password='password123')
        self.user_b = User.objects.create_user(username='bob', email='bob@test.com', password='password123')
        self.group = Group.objects.create(name='Trip')
        self.group.members.add(self.user_a, self.user_b)
        self.activity_url = reverse('activity_list')

    def test_group_add_member_logs_activity(self):
        self.client.force_authenticate(user=self.user_a)
        user_c = User.objects.create_user(username='charlie', password='password123')
        url = reverse('group-add-member', kwargs={'pk': self.group.id})
        
        response = self.client.post(url, {"identifier": "charlie"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify Activity entry was logged
        activities = Activity.objects.filter(type='member_added', group=self.group)
        self.assertEqual(activities.count(), 1)
        self.assertIn("charlie", activities.first().description)

    def test_expense_creation_logs_activity(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse('expense-list')
        
        data = {
            "group": self.group.id,
            "description": "Bus tickets",
            "amount": 200,
            "payer_id": self.user_a.id,
            "splits": [
                {"user_id": self.user_a.id, "split_type": "equal"},
                {"user_id": self.user_b.id, "split_type": "equal"}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Activity logged
        activities = Activity.objects.filter(type='expense_created', group=self.group)
        self.assertEqual(activities.count(), 1)
        self.assertIn("Bus tickets", activities.first().description)

    def test_settlement_logs_activity(self):
        self.client.force_authenticate(user=self.user_a)
        url = reverse('settlement-list')
        
        data = {
            "group": self.group.id,
            "payer_id": self.user_b.id,
            "payee_id": self.user_a.id,
            "amount": 50
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Activity logged
        activities = Activity.objects.filter(type='settlement_made', group=self.group)
        self.assertEqual(activities.count(), 1)
        self.assertIn("paid", activities.first().description)

    def test_chat_message_logs_activity(self):
        self.client.force_authenticate(user=self.user_a)
        expense = Expense.objects.create(group=self.group, description="Dinner", amount=100, payer=self.user_a)
        url = reverse('expense_messages', kwargs={'expense_id': expense.id})
        
        response = self.client.post(url, {"message": "Here is my share"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Activity logged
        activities = Activity.objects.filter(type='chat_message', group=self.group)
        self.assertEqual(activities.count(), 1)
        self.assertIn("Dinner", activities.first().description)

    def test_activity_list_access(self):
        self.client.force_authenticate(user=self.user_a)
        Activity.objects.create(
            type='expense_created',
            user=self.user_a,
            group=self.group,
            description="Alice created dinner bill"
        )
        
        response = self.client.get(self.activity_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['type'], 'expense_created')
