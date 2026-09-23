"""Scaffolded client for the SystemSoft / Lead Soft API.

Django does NOT connect directly to the SystemSoft core database. Shared core
masters (Customers, Employees, Departments) are accessed through the SystemSoft
HTTP API instead. Configure the base URL, token and timeout via
LEAD_SOFT_API_URL, LEAD_SOFT_API_TOKEN and LEAD_SOFT_API_TIMEOUT in .env.

This is a scaffold: the exact endpoints and response field names are not fixed
yet, so RESOURCE_ENDPOINTS below are placeholders to review against the real
SystemSoft API contract.
"""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

# Placeholder endpoints — adjust once the real SystemSoft API contract is known.
RESOURCE_ENDPOINTS = {
    'customers': '/customers',
    'employees': '/employees',
    'departments': '/departments',
}


class SystemSoftClient:
    """Minimal HTTP client for the SystemSoft / Lead Soft API."""

    def __init__(self, base_url=None, token=None, timeout=None):
        self.base_url = (base_url if base_url is not None else settings.LEAD_SOFT_API_URL or '').rstrip('/')
        self.token = settings.LEAD_SOFT_API_TOKEN if token is None else token
        self.timeout = timeout or settings.LEAD_SOFT_API_TIMEOUT

    def is_configured(self):
        return bool(self.base_url)

    def _request(self, method, resource, pk=None, params=None, payload=None):
        if not self.is_configured():
            logger.warning(
                'LEAD_SOFT_API_URL is not set; skipping %s %s request.', method, resource
            )
            return [] if pk is None else None

        path = RESOURCE_ENDPOINTS[resource]
        if pk is not None:
            path = f'{path}/{urllib.parse.quote(str(pk))}'
        url = self.base_url + path
        if params:
            url = f'{url}?{urllib.parse.urlencode(params)}'

        body = json.dumps(payload).encode('utf-8') if payload is not None else None
        request = urllib.request.Request(url, data=body, method=method)
        request.add_header('Accept', 'application/json')
        if body is not None:
            request.add_header('Content-Type', 'application/json')
        if self.token:
            request.add_header('Authorization', f'Bearer {self.token}')

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
        except urllib.error.URLError as exc:
            logger.error('SystemSoft API %s %s failed: %s', method, url, exc)
            raise

        if not raw:
            return [] if pk is None else None
        return json.loads(raw.decode('utf-8'))

    def list_customers(self, **params):
        return self._request('GET', 'customers', params=params)

    def get_customer(self, pk):
        return self._request('GET', 'customers', pk=pk)

    def create_customer(self, data):
        return self._request('POST', 'customers', payload=data)

    def update_customer(self, pk, data):
        return self._request('PUT', 'customers', pk=pk, payload=data)

    def delete_customer(self, pk):
        return self._request('DELETE', 'customers', pk=pk)

    def list_employees(self, **params):
        return self._request('GET', 'employees', params=params)

    def get_employee(self, pk):
        return self._request('GET', 'employees', pk=pk)

    def create_employee(self, data):
        return self._request('POST', 'employees', payload=data)

    def update_employee(self, pk, data):
        return self._request('PUT', 'employees', pk=pk, payload=data)

    def delete_employee(self, pk):
        return self._request('DELETE', 'employees', pk=pk)

    def list_departments(self, **params):
        return self._request('GET', 'departments', params=params)

    def get_department(self, pk):
        return self._request('GET', 'departments', pk=pk)

    def create_department(self, data):
        return self._request('POST', 'departments', payload=data)

    def update_department(self, pk, data):
        return self._request('PUT', 'departments', pk=pk, payload=data)

    def delete_department(self, pk):
        return self._request('DELETE', 'departments', pk=pk)


client = SystemSoftClient()