from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from orders.models import Order
from payments.models import Payment
from payments.views import sync_external_payment


class ExternalPaymentSyncTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_sync_payment_creates_order_and_payment(self):
        payload = {
            'order_id': 'TEST-ORD-101',
            'customer': 'Test Client',
            'amount': '500.00',
            'order_value': '5,000.00',
            'date': '2026-10-12',
            'method': 'Bank Transfer',
            'reference': 'REF12345',
            'received_by': 'Admin',
        }
        resp = self.client.post('/api/payments/external-sync/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(resp.data.get('created'))

        order = Order.objects.get(order_id='TEST-ORD-101')
        self.assertEqual(order.final_amount, Decimal('5000.00'))
        self.assertEqual(order.total_received, Decimal('500.00'))
        self.assertEqual(order.pending_amount, Decimal('4500.00'))
        self.assertEqual(order.payment_status, 'Partially Paid')

        payment = Payment.objects.get(order=order)
        self.assertEqual(payment.amount, Decimal('500.00'))
        self.assertEqual(payment.reference, 'REF12345')

    def test_sync_payment_idempotency(self):
        payload = {
            'order_id': 'TEST-ORD-102',
            'customer': 'Test Client 2',
            'amount': '1000.00',
            'date': '2026-10-12',
            'reference': 'REF999',
        }
        ok1, res1, _ = sync_external_payment(payload)
        self.assertTrue(ok1)
        self.assertTrue(res1['created'])

        # Duplicate sync call
        ok2, res2, _ = sync_external_payment(payload)
        self.assertTrue(ok2)
        self.assertFalse(res2['created'])
        self.assertEqual(Payment.objects.filter(order__order_id='TEST-ORD-102').count(), 1)
