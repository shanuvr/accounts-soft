"""Client for the Systemsoft core identity/tenant API.

accounts-soft does not keep its own user/company/employees master. Systemsoft
core (system_core) is the authority for identity, organizations, memberships
and employees. This module talks to core over HTTP:

- Login/registration are proxied to core; the returned JWT is validated by
  ``users.authentication.CoreJWTAuthentication`` on subsequent requests.
- Per-user reads (my organizations, my memberships, my profile, employees)
  forward the user's bearer token so core applies its own server-side
  authorization (membership scoping).
- ``CORE_SERVICE_TOKEN`` is available as an ``Api-Key`` fallback for
  machine-level calls (unused by the current user-facing flow).

When ``CORE_API_URL`` is unset every call raises ``CoreUnavailable`` so views
report a clear 5xx instead of an empty result that looks like a genuine
no-records case.
"""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


class CoreApiError(Exception):
    """The core API answered with an error status (4xx/5xx)."""

    def __init__(self, status, detail):
        self.status = status
        self.detail = detail
        super().__init__(f'Core API error {status}: {detail}')


class CoreUnavailable(Exception):
    """Raised when a configured core request fails (network, invalid JSON, or
    the service is not configured). Views map this to a clear 5xx response."""


class CoreClient:
    """Minimal HTTP client for the Systemsoft core API."""

    def __init__(self, base_url=None, service_token=None, timeout=None):
        self.base_url = (base_url if base_url is not None else settings.CORE_API_URL or '').rstrip('/')
        self.service_token = service_token if service_token is not None else settings.CORE_SERVICE_TOKEN
        self.timeout = timeout or settings.CORE_API_TIMEOUT

    def is_configured(self):
        return bool(self.base_url)

    # --- low level ---------------------------------------------------------

    def _request(self, method, path, params=None, payload=None, access_token=None):
        if not self.is_configured():
            raise CoreUnavailable('Systemsoft core is not configured (CORE_API_URL is empty).')

        url = self.base_url + path
        if params:
            query = {k: v for k, v in params.items() if v is not None}
            if query:
                url = f'{url}?{urllib.parse.urlencode(query)}'

        body = json.dumps(payload).encode('utf-8') if payload is not None else None
        request = urllib.request.Request(url, data=body, method=method)
        request.add_header('Accept', 'application/json')
        if body is not None:
            request.add_header('Content-Type', 'application/json')
        if access_token:
            request.add_header('Authorization', f'Bearer {access_token}')
        elif self.service_token:
            request.add_header('Authorization', f'Api-Key {self.service_token}')

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
        except urllib.error.HTTPError as exc:
            raw = exc.read()
            try:
                parsed = json.loads(raw.decode('utf-8'))
                detail = parsed.get('detail') if isinstance(parsed, dict) else parsed
            except (ValueError, UnicodeDecodeError):
                detail = raw.decode('utf-8', 'replace').strip() or exc.reason
            logger.error('Core API %s %s -> %s: %s', method, url, exc.code, detail)
            raise CoreApiError(exc.code, detail)
        except urllib.error.URLError as exc:
            logger.error('Core API %s %s failed: %s', method, url, exc)
            raise CoreUnavailable(str(exc)) from exc

        if not raw:
            return None
        try:
            return json.loads(raw.decode('utf-8'))
        except ValueError as exc:
            logger.error('Core API %s %s returned invalid JSON: %s', method, url, exc)
            raise CoreUnavailable('Systemsoft core returned invalid JSON.') from exc

    def _walk_pages(self, path, params=None, access_token=None):
        """Walk a DRF-paginated list endpoint and return a flat list."""
        params = dict(params or {})
        params.setdefault('page_size', 100)
        page = 1
        items = []
        while True:
            envelope = self._request('GET', path, params={**params, 'page': page}, access_token=access_token)
            if isinstance(envelope, dict):
                results = envelope.get('results') or []
                has_next = bool(envelope.get('next'))
            else:
                results = envelope or []
                has_next = False
            if isinstance(results, list):
                items.extend(results)
            if not has_next:
                break
            page += 1
        return items

    # --- auth / identity ---------------------------------------------------

    def login(self, email, password):
        return self._request('POST', '/api/auth/token/', payload={'email': email, 'password': password})

    def refresh(self, refresh_token):
        return self._request('POST', '/api/auth/token/refresh/', payload={'refresh': refresh_token})

    def register_user(self, payload):
        return self._request('POST', '/api/v1/users/', payload=payload)

    def get_me(self, access_token, user_id):
        return self._request('GET', f'/api/v1/users/{int(user_id)}/', access_token=access_token)

    def me_organizations(self, access_token):
        return self._walk_pages('/api/v1/organizations/', access_token=access_token)

    def me_memberships(self, access_token):
        return self._walk_pages('/api/v1/memberships/', access_token=access_token)

    def create_organization(self, access_token, name):
        return self._request('POST', '/api/v1/organizations/', payload={'name': name}, access_token=access_token)

    # --- employees (owned by core) ----------------------------------------

    def list_employees(self, organization_id, access_token):
        return self._walk_pages(
            '/api/v1/employees/',
            params={'organization_id': organization_id},
            access_token=access_token,
        )

    def get_employee(self, organization_id, pk, access_token):
        return self._request(
            'GET',
            f'/api/v1/employees/{urllib.parse.quote(str(pk))}/',
            params={'organization_id': organization_id},
            access_token=access_token,
        )

    def create_employee(self, payload, access_token):
        return self._request('POST', '/api/v1/employees/', payload=payload, access_token=access_token)

    def update_employee(self, pk, payload, access_token):
        return self._request(
            'PATCH',
            f'/api/v1/employees/{urllib.parse.quote(str(pk))}/',
            payload=payload,
            access_token=access_token,
        )

    def delete_employee(self, pk, access_token):
        return self._request(
            'DELETE',
            f'/api/v1/employees/{urllib.parse.quote(str(pk))}/',
            access_token=access_token,
        )


def bearer_token_from_request(request):
    """Return the raw ``Bearer`` token from the request's Authorization header."""
    parts = request.META.get('HTTP_AUTHORIZATION', '').split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]
    return None


def default_organization_for(request):
    """Return the requestor's first active membership as {id, name, role} or None."""
    token = bearer_token_from_request(request)
    me = getattr(request.user, 'id', None)
    if not token or not me:
        return None
    for membership in client.me_memberships(token):
        if membership.get('user') != me:
            continue
        if membership.get('status') != 'active':
            continue
        return {
            'id': membership.get('organization'),
            'name': membership.get('organization_name'),
            'role': membership.get('role'),
        }
    return None


def user_payload(core_user, access_token):
    """Build the enriched ``user`` object the frontend expects.

    Combines core's identity record with the user's organizations/memberships.
    Shape mirrors the previous accounts-soft login payload so the React
    auth store works unchanged: {id, email, name, role, company, organizations}.
    """
    core_user = core_user or {}
    user_id = core_user.get('id')
    orgs = client.me_organizations(access_token)
    memberships = client.me_memberships(access_token)

    roles = {}
    for membership in memberships:
        if membership.get('user') == user_id:
            roles[membership.get('organization')] = membership.get('role')

    organizations = []
    for org in orgs:
        organizations.append({
            'id': org.get('id'),
            'name': org.get('name'),
            'status': org.get('status'),
            'role': roles.get(org.get('id'), 'member'),
        })

    default = next((o for o in organizations if o.get('status') == 'active'), None)
    if default is None and organizations:
        default = organizations[0]

    from .scoping import get_or_sync_company
    company = None
    if default:
        local_comp = get_or_sync_company(default.get('id'), default.get('name'))
        company = {
            'id': local_comp.id if local_comp else default.get('id'),
            'core_org_id': default.get('id'),
            'name': default.get('name'),
        }

    return {
        'id': user_id,
        'email': core_user.get('email'),
        'name': core_user.get('name') or core_user.get('email'),
        'role': (default or {}).get('role') or 'member',
        'company': company,
        'organizations': organizations,
    }


def app_enabled(core_user, app_code):
    """Whether the login payload shows this app granted to the user.

    ``enabled_apps`` is absent on older core responses; treat that as enabled so
    existing logins keep working.
    """
    enabled = (core_user or {}).get('enabled_apps')
    if enabled is None:
        return True
    return app_code in enabled


def app_permissions(core_user, app_code):
    """Flat, de-duplicated permission list for ``app_code`` from the login payload."""
    permissions = []
    for entry in (core_user or {}).get('app_access') or []:
        if entry.get('app') == app_code:
            permissions.extend(entry.get('permissions') or [])
    return sorted(set(permissions))


def fallback_user_payload(core_user):
    """Minimal user payload used when the organization resolution step fails."""
    core_user = core_user or {}
    return {
        'id': core_user.get('id'),
        'email': core_user.get('email'),
        'name': core_user.get('name') or core_user.get('email'),
        'role': 'member',
        'company': None,
        'organizations': [],
    }


client = CoreClient()