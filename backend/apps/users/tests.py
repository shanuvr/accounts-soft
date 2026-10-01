from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from .models import Company, Profile


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_creates_company_and_admin(self):
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'john',
                'email': 'john@acme.com',
                'password': 'secret123',
                'name': 'John Doe',
                'company': {
                    'name': 'Acme Pvt Ltd',
                    'contact_no': '9876543210',
                    'email': 'contact@acme.com',
                    'address': 'Thrissur, Kerala',
                },
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertIn('access', body)
        self.assertIn('refresh', body)
        self.assertEqual(body['user']['role'], Profile.Role.ADMIN)
        self.assertEqual(body['user']['company']['name'], 'Acme Pvt Ltd')

        user = get_user_model().objects.get(username='john')
        profile = user.profile
        self.assertTrue(user.check_password('secret123'))
        self.assertEqual(profile.role, Profile.Role.ADMIN)
        self.assertEqual(profile.company.name, 'Acme Pvt Ltd')

    def test_register_rejects_duplicate_username(self):
        Company.objects.create(name='Acme Pvt Ltd')
        get_user_model().objects.create_user(username='john', email='john@acme.com', password='secret123')
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'john',
                'email': 'other@acme.com',
                'password': 'secret123',
                'company': {'name': 'Beta Ltd'},
            },
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_register_rejects_duplicate_company_name(self):
        Company.objects.create(name='Acme Pvt Ltd')
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'john',
                'email': 'john@acme.com',
                'password': 'secret123',
                'company': {'name': 'Acme Pvt Ltd'},
            },
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_login_returns_role_and_company(self):
        company = Company.objects.create(name='Acme Pvt Ltd')
        user = get_user_model().objects.create_user(username='john', email='john@acme.com', password='secret123')
        Profile.objects.create(user=user, company=company, role=Profile.Role.ADMIN)

        res = self.client.post(
            '/api/auth/token/',
            {'username': 'john', 'password': 'secret123'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['user']['role'], Profile.Role.ADMIN)
        self.assertEqual(body['user']['company']['name'], 'Acme Pvt Ltd')