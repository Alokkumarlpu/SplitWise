from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import SupportTicket

class SupportTicketTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='supportuser', password='password123')
        self.support_url = reverse('create_ticket')

    def test_anonymous_ticket_success(self):
        data = {
            "name": "John Doe",
            "email": "john@example.com",
            "subject": "App crashes on login",
            "message": "When I try to login, the app closes immediately."
        }
        response = self.client.post(self.support_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SupportTicket.objects.count(), 1)
        ticket = SupportTicket.objects.first()
        self.assertEqual(ticket.name, "John Doe")
        self.assertEqual(ticket.email, "john@example.com")
        self.assertEqual(ticket.subject, "App crashes on login")
        self.assertNil = False
        self.assertIsNone(ticket.user)

    def test_anonymous_ticket_fails_missing_fields(self):
        data = {
            "subject": "App crashes on login",
            "message": "When I try to login, the app closes immediately."
        }
        response = self.client.post(self.support_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Name and email are required for guest support tickets.
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(SupportTicket.objects.count(), 0)

    def test_authenticated_ticket_success(self):
        self.client.force_authenticate(user=self.user)
        data = {
            "subject": "Feedback on settings",
            "message": "I love the new Settings interface!"
        }
        response = self.client.post(self.support_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SupportTicket.objects.count(), 1)
        ticket = SupportTicket.objects.first()
        self.assertEqual(ticket.user, self.user)
        self.assertEqual(ticket.subject, "Feedback on settings")
        self.assertEqual(ticket.message, "I love the new Settings interface!")
