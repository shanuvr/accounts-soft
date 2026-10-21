from django.test import TestCase
from django.utils import timezone
from orders.models import Order, OrderService
from ptda.models import PTDA
from assignments.models import Assignment


class ExternalPtdIntegrationTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(
            order_id='QTN403106072026A',
            customer='Hotel Kottaram Regency',
            order_date=timezone.now().date(),
            delivery_date=timezone.now().date(),
        )
        self.service = OrderService.objects.create(
            order=self.order,
            service_name='Website Development',
            requires_ptda=True,
        )
        self.ptda = PTDA.objects.create(
            order_service=self.service,
            title='Website Development (website)',
            status='Pending',
            data={'projectName': 'Hotel Website'},
            billable=True,
            price=10000,
        )
        self.assignment = Assignment.objects.create(
            order_service=self.service,
            title='Website Development',
            employee='Development',
            department='Development Team',
            status='Pending',
            allocated_hours=100,
        )

    def test_get_external_ptd_requests(self):
        resp = self.client.get('/api/ptda/external-requests/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(len(data) >= 1)
        item = next(x for x in data if x['orderId'] == 'QTN403106072026A')
        self.assertEqual(item['name'], 'Website Development')
        self.assertEqual(item['client'], 'Hotel Kottaram Regency')
        self.assertEqual(item['status'], 'pending')
        self.assertEqual(item['decisionStatus'], 'Pending')

    def test_accept_ptd_decision(self):
        resp = self.client.post('/api/ptda/external-decision/', {
            'ptdId': self.ptda.id,
            'action': 'accept',
            'decidedBy': 'Test PM',
        }, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.ptda.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.ptda.status, 'Accepted')
        self.assertEqual(self.assignment.status, 'Accepted')

    def test_reject_ptd_decision(self):
        resp = self.client.post('/api/ptda/external-decision/', {
            'ptdId': self.ptda.id,
            'action': 'reject',
            'remark': 'Scope needs revision',
            'decidedBy': 'Test PM',
        }, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.ptda.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.ptda.status, 'Rejected')
        self.assertEqual(self.assignment.status, 'Rejected')
        self.assertIn('Scope needs revision', self.assignment.description)

    def test_reopen_ptd_decision(self):
        resp = self.client.post('/api/ptda/external-decision/', {
            'ptdId': self.ptda.id,
            'action': 'reopen',
        }, content_type='application/json')
        self.assertEqual(resp.status_code, 200)
        self.ptda.refresh_from_db()
        self.assignment.refresh_from_db()
        self.assertEqual(self.ptda.status, 'Pending')
        self.assertEqual(self.assignment.status, 'Pending')
