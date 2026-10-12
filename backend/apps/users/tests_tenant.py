from unittest import mock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from users.models import Company
from orders.models import Order
from payments.models import Payment
from transactions.models import Transaction


def make_token(user_id=10, email='user@org1.com', name='User 1', org_id=101, permissions=None, app_code='accounts-soft'):
    token = AccessToken()
    token['user_id'] = user_id
    token['email'] = email
    token['name'] = name
    token['enabled_apps'] = [app_code]
    token['app_access'] = [
        {
            'org': org_id,
            'app': app_code,
            'role': 'Accounts Manager',
            'permissions': permissions if permissions is not None else ['accounts.orders.view', 'accounts.payments.record'],
        }
    ]
    return str(token)


class TenantIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.comp1 = Company.objects.create(core_org_id=101, name='Company Alpha')
        self.comp2 = Company.objects.create(core_org_id=202, name='Company Beta')

        self.order1 = Order.objects.create(
            order_id='ORD-1001',
            company=self.comp1,
            customer='Customer Alpha',
            order_date='2026-10-01',
            delivery_date='2026-10-15',
            subtotal=1000,
            final_amount=1000,
        )
        self.order2 = Order.objects.create(
            order_id='ORD-2001',
            company=self.comp2,
            customer='Customer Beta',
            order_date='2026-10-02',
            delivery_date='2026-10-16',
            subtotal=2000,
            final_amount=2000,
        )

        self.payment1 = Payment.objects.create(
            order=self.order1,
            amount=500,
            date='2026-10-05',
        )
        self.payment2 = Payment.objects.create(
            order=self.order2,
            amount=1000,
            date='2026-10-06',
        )

        self.tx1 = Transaction.objects.create(
            company=self.comp1,
            entry_type='Expense',
            date='2026-10-05',
            amount=200,
        )
        self.tx2 = Transaction.objects.create(
            company=self.comp2,
            entry_type='Expense',
            date='2026-10-06',
            amount=300,
        )

    def test_tenant_identifies_company_and_sees_only_own_orders(self):
        token1 = make_token(user_id=11, org_id=101)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')

        res = self.client.get('/api/orders/orders/')
        self.assertEqual(res.status_code, 200)
        results = res.json().get('results', res.json())
        order_ids = [o['order_id'] for o in results]
        self.assertIn('ORD-1001', order_ids)
        self.assertNotIn('ORD-2001', order_ids)

    def test_tenant2_sees_only_own_orders(self):
        token2 = make_token(user_id=22, org_id=202)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')

        res = self.client.get('/api/orders/orders/')
        self.assertEqual(res.status_code, 200)
        results = res.json().get('results', res.json())
        order_ids = [o['order_id'] for o in results]
        self.assertNotIn('ORD-1001', order_ids)
        self.assertIn('ORD-2001', order_ids)

    def test_tenant_sees_only_own_payments(self):
        token1 = make_token(user_id=11, org_id=101)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')

        res = self.client.get('/api/payments/payments/')
        self.assertEqual(res.status_code, 200)
        results = res.json().get('results', res.json())
        payment_ids = [p['id'] for p in results]
        self.assertIn(self.payment1.id, payment_ids)
        self.assertNotIn(self.payment2.id, payment_ids)

    def test_tenant_sees_only_own_transactions(self):
        token1 = make_token(user_id=11, org_id=101)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')

        res = self.client.get('/api/transactions/transactions/')
        self.assertEqual(res.status_code, 200)
        results = res.json().get('results', res.json())
        tx_ids = [t['id'] for t in results]
        self.assertIn(self.tx1.id, tx_ids)
        self.assertNotIn(self.tx2.id, tx_ids)

    def test_external_payment_sync_attaches_to_correct_tenant(self):
        res = self.client.post(
            '/api/payments/external-sync/',
            {
                'order_id': 'ORD-NEW-99',
                'customer': 'New Client',
                'amount': 750,
                'date': '2026-10-10',
                'core_org_id': 101,
                'tenant_name': 'Company Alpha',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        new_order = Order.objects.get(order_id='ORD-NEW-99')
        self.assertEqual(new_order.company_id, self.comp1.id)
        self.assertEqual(new_order.payments.count(), 1)
        self.assertEqual(float(new_order.payments.first().amount), 750.0)

    def test_user_without_accounts_soft_access_denied(self):
        token = make_token(user_id=99, app_code='time-tracker')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res = self.client.get('/api/orders/orders/')
        self.assertEqual(res.status_code, 401)

    def test_user_without_order_permission_denied(self):
        token = make_token(user_id=11, org_id=101, permissions=['accounts.items.view'])
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res = self.client.get('/api/orders/orders/')
        self.assertEqual(res.status_code, 403)
