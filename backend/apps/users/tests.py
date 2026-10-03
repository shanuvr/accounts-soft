from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from users.services import CoreApiError, CoreUnavailable, client


def fake_tokens(email='john@acme.com', name='John Doe', user_id=7):
    return {
        'refresh': 'r.efresh.token',
        'access': 'ac.cess.token',
        'user': {'id': user_id, 'email': email, 'name': name},
    }


def fake_or_organizations():
    return [{'id': 1, 'name': 'Acme Pvt Ltd', 'status': 'active', 'member_count': 1}]


def fake_memberships():
    return [{
        'id': 3,
        'user': 7,
        'user_email': 'john@acme.com',
        'organization': 1,
        'organization_name': 'Acme Pvt Ltd',
        'role': 'owner',
        'status': 'active',
    }]


def bearer(user_id=7):
    token = AccessToken()
    token['user_id'] = user_id
    return str(token)


class ProxyAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_login_proxies_to_core_and_returns_enriched_user(self):
        with (
            mock.patch.object(client, 'login', return_value=fake_tokens()) as login,
            mock.patch.object(client, 'me_organizations', return_value=fake_or_organizations()),
            mock.patch.object(client, 'me_memberships', return_value=fake_memberships()),
        ):
            res = self.client.post(
                '/api/auth/token/',
                {'email': 'john@acme.com', 'password': 'secret123'},
                format='json',
            )
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['access'], 'ac.cess.token')
        self.assertEqual(body['user']['email'], 'john@acme.com')
        self.assertEqual(body['user']['role'], 'owner')
        self.assertEqual(body['user']['company']['name'], 'Acme Pvt Ltd')
        login.assert_called_once_with('john@acme.com', 'secret123')

    def test_login_bad_credentials_passes_core_error_through(self):
        with mock.patch.object(
            client,
            'login',
            side_effect=CoreApiError(401, 'No active account found with the given credentials'),
        ):
            res = self.client.post(
                '/api/auth/token/',
                {'email': 'other@acme.com', 'password': 'wrong123'},
                format='json',
            )
        self.assertEqual(res.status_code, 401)
        self.assertIn('No active account', res.json()['detail'])

    def test_login_unconfigured_core_returns_502(self):
        with mock.patch.object(client, 'login', side_effect=CoreUnavailable('not configured')):
            res = self.client.post(
                '/api/auth/token/',
                {'email': 'other@acme.com', 'password': 'wrong123'},
                format='json',
            )
        self.assertEqual(res.status_code, 502)

    def test_register_creates_user_then_organization(self):
        with (
            mock.patch.object(client, 'register_user', return_value={'id': 7, 'email': 'john@acme.com', 'name': 'John Doe'}),
            mock.patch.object(client, 'login', return_value=fake_tokens()),
            mock.patch.object(client, 'create_organization', return_value={'id': 1, 'name': 'Acme Pvt Ltd', 'status': 'active'}) as create_org,
            mock.patch.object(client, 'me_organizations', return_value=fake_or_organizations()),
            mock.patch.object(client, 'me_memberships', return_value=fake_memberships()),
        ):
            res = self.client.post(
                '/api/auth/register/',
                {
                    'email': 'john@acme.com',
                    'name': 'John Doe',
                    'password': 'secret123',
                    'company': {'name': 'Acme Pvt Ltd'},
                },
                format='json',
            )
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body['user']['company']['name'], 'Acme Pvt Ltd')
        create_org.assert_called_once_with('ac.cess.token', 'Acme Pvt Ltd')

    def test_register_rejects_core_field_errors(self):
        with mock.patch.object(
            client,
            'register_user',
            side_effect=CoreApiError(400, {'email': ['A user with this email already exists.']}),
        ):
            res = self.client.post(
                '/api/auth/register/',
                {
                    'email': 'dup@acme.com',
                    'name': 'Dup User',
                    'password': 'secret123',
                    'company': {'name': 'Beta Ltd'},
                },
                format='json',
            )
        self.assertEqual(res.status_code, 400)
        self.assertIn('already exists', res.json()['email'][0])

    def test_me_returns_enriched_profile(self):
        token = bearer()
        with (
            mock.patch.object(client, 'get_me', return_value={'id': 7, 'email': 'john@acme.com', 'name': 'John Doe'}),
            mock.patch.object(client, 'me_organizations', return_value=fake_or_organizations()),
            mock.patch.object(client, 'me_memberships', return_value=fake_memberships()),
        ):
            res = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['email'], 'john@acme.com')
        self.assertEqual(body['role'], 'owner')
        self.assertEqual(body['company']['name'], 'Acme Pvt Ltd')


class EmployeeProxyTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_employee_list_proxies_to_core_with_default_org(self):
        token = bearer()
        employees = [{
            'id': 501,
            'employee_code': '501',
            'name': 'John',
            'department': 'Engineering',
            'designation': 'Engineer',
            'phone': '1234567890',
            'email': 'john@companyx.com',
            'status': 'active',
        }]
        with (
            mock.patch.object(client, 'me_memberships', return_value=fake_memberships()),
            mock.patch.object(client, 'list_employees', return_value=employees) as list_employees,
        ):
            res = self.client.get('/api/customers/employees/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['count'], 1)
        self.assertEqual(body['results'][0]['name'], 'John')
        list_employees.assert_called_once_with(1, token)

    def test_employee_create_passes_organization_and_maps_department_name(self):
        token = bearer()
        with (
            mock.patch.object(client, 'me_memberships', return_value=fake_memberships()),
            mock.patch.object(client, 'create_employee', return_value={
                'id': 502,
                'employee_code': '502',
                'name': 'Jane',
                'department': 'Operations',
                'designation': '',
                'phone': '',
                'email': '',
                'status': 'active',
            }) as create_employee,
        ):
            res = self.client.post(
                '/api/customers/employees/',
                {'name': 'Jane', 'department_name': 'Operations'},
                HTTP_AUTHORIZATION=f'Bearer {token}',
                format='json',
            )
        self.assertEqual(res.status_code, 201)
        create_employee.assert_called_once()
        payload = create_employee.call_args.args[0]
        self.assertEqual(payload['organization'], 1)
        self.assertEqual(payload['department'], 'Operations')

    def test_unconfigured_core_returns_502(self):
        token = bearer()
        with (
            mock.patch.object(client, 'me_memberships', return_value=fake_memberships()),
            mock.patch.object(client, 'list_employees', side_effect=CoreUnavailable('not configured')),
        ):
            res = self.client.get('/api/customers/employees/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(res.status_code, 502)
        self.assertIn('unreachable', res.json()['detail'].lower())