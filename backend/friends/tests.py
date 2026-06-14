from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Friendship, FriendInvite

class FriendsTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username='alice', email='alice@test.com', password='password123')
        self.user_b = User.objects.create_user(username='bob', email='bob@test.com', password='password123')
        self.friends_url = reverse('friendship-list')
        self.invite_url = reverse('friend_invite')
        self.dashboard_url = reverse('dashboard')

    def test_add_friend_success(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.friends_url, {"identifier": "bob"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify reciprocal friendships
        self.assertEqual(Friendship.objects.filter(user=self.user_a, friend=self.user_b).count(), 1)
        self.assertEqual(Friendship.objects.filter(user=self.user_b, friend=self.user_a).count(), 1)

    def test_add_friend_by_email(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.friends_url, {"identifier": "bob@test.com"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Friendship.objects.filter(user=self.user_a, friend=self.user_b).count(), 1)

    def test_add_friend_not_found(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.friends_url, {"identifier": "nonexistent"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_self_fails(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.friends_url, {"identifier": "alice"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_friendship(self):
        # Create reciprocal friendship
        Friendship.objects.create(user=self.user_a, friend=self.user_b)
        Friendship.objects.create(user=self.user_b, friend=self.user_a)
        
        self.client.force_authenticate(user=self.user_a)
        fs_record = Friendship.objects.get(user=self.user_a, friend=self.user_b)
        url = reverse('friendship-detail', kwargs={'pk': fs_record.id})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify reciprocal deletion
        self.assertEqual(Friendship.objects.filter(user=self.user_a, friend=self.user_b).count(), 0)
        self.assertEqual(Friendship.objects.filter(user=self.user_b, friend=self.user_a).count(), 0)

    def test_invite_friend(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(self.invite_url, {"email": "stranger@test.com"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FriendInvite.objects.filter(sender=self.user_a, email="stranger@test.com").count(), 1)

    def test_dashboard_endpoint(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.get(self.dashboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("groups", response.data)
        self.assertIn("friends", response.data)
        self.assertIn("balances", response.data)
        self.assertIn("activities", response.data)
