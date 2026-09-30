"""Client for the SystemSoft / Lead Soft customers API.

Django does NOT connect directly to the SystemSoft core database. The shared
customers master is accessed through the Lead Soft HTTP API at
``/api/external/customers/`` (read-only, same shared key as the external orders
feed). The base URL, token and timeout are configured via LEAD_SOFT_API_URL,
LEAD_SOFT_API_TOKEN and LEAD_SOFT_API_TIMEOUT in .env; when LEAD_SOFT_API_TOKEN
is unset the shared ``EXTERNAL_ORDERS_API_KEY`` is used.
"""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


class SystemSoftUnavailable(Exception):
    """Raised when a configured SystemSoft / Lead Soft request fails.

    Lets views report a clear 5xx to the frontend instead of silently
    returning an empty result that looks like a genuine no-records case.
    """


RESOURCE_ENDPOINTS = {
    'customers': '/api/external/customers',
    'employees': '/employees',
    'departments': '/departments',
}

# Account Soft model fields accepted when building Customer instances from a
# remote payload (the over-arching model keys, not db_column names).
CUSTOMER_MODEL_FIELDS = frozenset({
    'customer_id', 'lead_id', 'order_no', 'name', 'contact_person', 'phone',
    'email', 'customer_type', 'status', 'accepted_date', 'collected_by',
    'notes', 'client_token',
})

# Remote (transactions_clientdetail) field names -> Account Soft model names.
CUSTOMER_FIELD_MAP = {
    'id': 'customer_id',
    'company': 'name',
    'client_name': 'contact_person',
    'mobile': 'phone',
    'category': 'customer_type',
}


class SystemSoftClient:
    """Minimal HTTP client for the SystemSoft / Lead Soft API."""

    def __init__(self, base_url=None, token=None, timeout=None):
        self.base_url = (base_url if base_url is not None else settings.LEAD_SOFT_API_URL or '').rstrip('/')
        self.token = (settings.LEAD_SOFT_API_TOKEN or settings.EXTERNAL_ORDERS_API_KEY) if token is None else token
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
            raise SystemSoftUnavailable from exc

        if not raw:
            return [] if pk is None else None
        try:
            return json.loads(raw.decode('utf-8'))
        except ValueError as exc:
            logger.error('SystemSoft API %s %s returned invalid JSON: %s', method, url, exc)
            raise SystemSoftUnavailable from exc

    def _map_customer(self, data):
        if not isinstance(data, dict):
            return data
        mapped = {CUSTOMER_FIELD_MAP.get(key, key): value for key, value in data.items()}
        return {key: value for key, value in mapped.items() if key in CUSTOMER_MODEL_FIELDS}

    def list_customers(self, **params):
        """Fetch every page of the read-only customers feed, newest-first.

        The remote endpoint returns a DRF paginated envelope with a page_size
        cap of 500, so the client walks all pages and returns a flat list of
        mapped records for Account Soft's own pagination to work over.
        """
        page = int(params.get('page') or 1)
        page_size = min(int(params.get('page_size') or 500), 500)
        items = []
        while True:
            envelope = self._request('GET', 'customers', params={'page': page, 'page_size': page_size})
            if isinstance(envelope, dict):
                results = envelope.get('results') or []
            else:
                results = envelope or []
            batch = [self._map_customer(record) for record in results if isinstance(record, dict)]
            if not batch:
                break
            items.extend(batch)
            page += 1
            if isinstance(envelope, dict) and not envelope.get('next'):
                break
        return items

    def get_customer(self, pk):
        data = self._request('GET', 'customers', pk=pk)
        return self._map_customer(data) if isinstance(data, dict) else None

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