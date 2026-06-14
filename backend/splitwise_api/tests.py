from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from splitwise_api.utils import calculate_splits, simplify_debts

class SplitCalculationTests(TestCase):
    def test_equal_split_with_rounding(self):
        # 100 split equally among 3 users
        uids = [1, 2, 3]
        result = calculate_splits(
            total_amount=Decimal('100.00'),
            members_ids=uids,
            split_type='equal',
            splits_data=[]
        )
        self.assertEqual(len(result), 3)
        self.assertEqual(sum(result.values()), Decimal('100.00'))
        # Payer or first member should get the extra penny
        self.assertEqual(result[1], Decimal('33.34'))
        self.assertEqual(result[2], Decimal('33.33'))
        self.assertEqual(result[3], Decimal('33.33'))

    def test_unequal_split(self):
        uids = [1, 2]
        splits_data = [
            {'user_id': 1, 'split_value': Decimal('70.00')},
            {'user_id': 2, 'split_value': Decimal('30.00')}
        ]
        result = calculate_splits(
            total_amount=Decimal('100.00'),
            members_ids=uids,
            split_type='unequal',
            splits_data=splits_data
        )
        self.assertEqual(result[1], Decimal('70.00'))
        self.assertEqual(result[2], Decimal('30.00'))

        # Sum of unequal splits doesn't equal total
        invalid_splits = [
            {'user_id': 1, 'split_value': Decimal('60.00')},
            {'user_id': 2, 'split_value': Decimal('30.00')}
        ]
        with self.assertRaises(ValueError):
            calculate_splits(
                total_amount=Decimal('100.00'),
                members_ids=uids,
                split_type='unequal',
                splits_data=invalid_splits
            )

    def test_percentage_split(self):
        uids = [1, 2]
        splits_data = [
            {'user_id': 1, 'split_value': Decimal('60.00')},
            {'user_id': 2, 'split_value': Decimal('40.00')}
        ]
        result = calculate_splits(
            total_amount=Decimal('250.00'),
            members_ids=uids,
            split_type='percentage',
            splits_data=splits_data
        )
        self.assertEqual(result[1], Decimal('150.00')) # 60% of 250
        self.assertEqual(result[2], Decimal('100.00')) # 40% of 250

        # Percentages do not sum to 100
        invalid_pct = [
            {'user_id': 1, 'split_value': Decimal('50.00')},
            {'user_id': 2, 'split_value': Decimal('40.00')}
        ]
        with self.assertRaises(ValueError):
            calculate_splits(
                total_amount=Decimal('250.00'),
                members_ids=uids,
                split_type='percentage',
                splits_data=invalid_pct
            )

    def test_shares_split(self):
        uids = [1, 2]
        splits_data = [
            {'user_id': 1, 'split_value': Decimal('1.00')},
            {'user_id': 2, 'split_value': Decimal('2.00')}
        ]
        result = calculate_splits(
            total_amount=Decimal('300.00'),
            members_ids=uids,
            split_type='shares',
            splits_data=splits_data
        )
        self.assertEqual(result[1], Decimal('100.00'))
        self.assertEqual(result[2], Decimal('200.00'))


class DebtSimplificationTests(TestCase):
    def setUp(self):
        # Create mock users
        self.user_a = User.objects.create_user(username='alice', email='a@test.com', password='password')
        self.user_b = User.objects.create_user(username='bob', email='b@test.com', password='password')
        self.user_c = User.objects.create_user(username='charlie', email='c@test.com', password='password')
        self.user_map = {
            self.user_a.id: self.user_a,
            self.user_b.id: self.user_b,
            self.user_c.id: self.user_c,
        }

    def test_basic_simplification(self):
        # A owes B 100, B owes C 100.
        # Net balance: A = -100, B = 0, C = +100
        net_balances = {
            self.user_a.id: Decimal('-100.00'),
            self.user_b.id: Decimal('0.00'),
            self.user_c.id: Decimal('100.00')
        }
        txs = simplify_debts(net_balances, self.user_map)
        
        self.assertEqual(len(txs), 1)
        self.assertEqual(txs[0]['from_user_id'], self.user_a.id)
        self.assertEqual(txs[0]['to_user_id'], self.user_c.id)
        self.assertEqual(txs[0]['amount'], Decimal('100.00'))

    def test_complex_simplification(self):
        # A owes B 100, C owes A 50, B owes C 200
        # Let's check net balances:
        # A owes: 100 (to B) - 50 (from C) = owes 50 net
        # B owes: -100 (from A) + 200 (to C) = is owed 100 net
        # C owes: 50 (to A) - 200 (from B) = owes 150 net
        # Let's simulate:
        # Net balances:
        # A: -50 (Debtor)
        # C: -150 (Debtor)
        # B: +200 (Creditor)
        net_balances = {
            self.user_a.id: Decimal('-50.00'),
            self.user_b.id: Decimal('200.00'),
            self.user_c.id: Decimal('-150.00'),
        }
        txs = simplify_debts(net_balances, self.user_map)

        # Expected output:
        # C pays B 150
        # A pays B 50
        # Total transactions = 2
        self.assertEqual(len(txs), 2)
        
        # Sort transactions for assertion consistency
        txs.sort(key=lambda x: x['from_user_id'])
        
        # self.user_a.id pays self.user_b.id 50
        self.assertEqual(txs[0]['from_user_id'], self.user_a.id)
        self.assertEqual(txs[0]['to_user_id'], self.user_b.id)
        self.assertEqual(txs[0]['amount'], Decimal('50.00'))

        # self.user_c.id pays self.user_b.id 150
        self.assertEqual(txs[1]['from_user_id'], self.user_c.id)
        self.assertEqual(txs[1]['to_user_id'], self.user_b.id)
        self.assertEqual(txs[1]['amount'], Decimal('150.00'))

from django.urls import reverse
from rest_framework.test import APITestCase
from splitwise_api.models import UserSession

class SettingsModuleTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', email='tester@test.com', password='password123')
        
    def test_password_change(self):
        self.client.force_authenticate(user=self.user)
        
        # Change password successfully
        url = reverse('profile_change_password')
        response = self.client.post(url, {
            'old_password': 'password123',
            'new_password': 'newpassword456'
        })
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword456'))

        # Change with incorrect old password
        response = self.client.post(url, {
            'old_password': 'wrongpassword',
            'new_password': 'newerpassword789'
        })
        self.assertEqual(response.status_code, 400)

    def test_session_management_and_revocation(self):
        # Obtain JWT
        login_url = reverse('token_obtain_pair')
        login_res = self.client.post(login_url, {
            'username': 'tester',
            'password': 'password123'
        })
        self.assertEqual(login_res.status_code, 200)
        access_token = login_res.data['access']

        # Confirm session was logged in database
        self.assertEqual(UserSession.objects.filter(user=self.user).count(), 1)
        session = UserSession.objects.filter(user=self.user).first()
        
        # Test authenticating with the token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        profile_url = reverse('profile_settings')
        profile_res = self.client.get(profile_url)
        self.assertEqual(profile_res.status_code, 200)

        # Invalidate the session (e.g. simulate terminate session / logout-all)
        session.delete()

        # Attempt to access profile settings again
        profile_res_revoked = self.client.get(profile_url)
        self.assertEqual(profile_res_revoked.status_code, 401)

    def test_account_deactivation_soft_delete(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('profile_delete_account')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 200)
        
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)

        # Login must fail for deactivated user
        self.client.logout()
        login_url = reverse('token_obtain_pair')
        login_res = self.client.post(login_url, {
            'username': 'tester',
            'password': 'password123'
        })
        self.assertEqual(login_res.status_code, 401)

