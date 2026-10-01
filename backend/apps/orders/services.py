"""Client for the read-only external orders feed on the Lead Soft app.

Account Soft does not own the confirmed orders — they live in the Lead Soft
suite and are consumed through its external API (GET /api/external/orders/).
This mirrors the SystemSoft client in ``customers.services``: the base URL and
shared API key come from ``EXTERNAL_ORDERS_API_URL`` and
``EXTERNAL_ORDERS_API_KEY`` in .env. When the feed cannot be fetched the client
raises ``ExternalOrdersUnavailable`` so views can surface a clear error instead
of silently returning an empty result that looks like a genuine no-orders case.
"""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)


class ExternalOrdersUnavailable(Exception):
    """Raised when the Lead Soft external orders feed cannot be fetched.

    Lets views report a clear 5xx to the frontend instead of silently returning
    an empty envelope that looks like a genuine no-orders case.
    """


class ExternalOrdersClient:
    """Minimal HTTP client for the Lead Soft external orders feed."""

    def __init__(self, base_url=None, key=None, timeout=None):
        self.base_url = (base_url if base_url is not None else settings.EXTERNAL_ORDERS_API_URL or '').rstrip('/')
        self.key = settings.EXTERNAL_ORDERS_API_KEY if key is None else key
        self.timeout = timeout or settings.EXTERNAL_ORDERS_API_TIMEOUT

    def is_configured(self):
        return bool(self.base_url and self.key)

    def list_orders(self, page=1, page_size=500, company=''):
        if not self.is_configured():
            logger.warning(
                'EXTERNAL_ORDERS_API_URL / EXTERNAL_ORDERS_API_KEY are not set; skipping external orders feed.'
            )
            raise ExternalOrdersUnavailable('External orders feed is not configured.')

        params = {'page': page, 'page_size': page_size}
        if company:
            params['company'] = company
        url = f"{self.base_url}?{urllib.parse.urlencode(params)}"

        request = urllib.request.Request(url, method='GET')
        request.add_header('Accept', 'application/json')
        if self.key:
            request.add_header('Authorization', f'Bearer {self.key}')

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
        except urllib.error.URLError as exc:
            logger.error('External orders feed %s failed: %s', url, exc)
            raise ExternalOrdersUnavailable from exc
        except Exception as exc:  # noqa: BLE001 - raise a surfaced error instead of acting like no orders exist
            logger.error('External orders feed %s errored: %s', url, exc)
            raise ExternalOrdersUnavailable from exc

        if not raw:
            raise ExternalOrdersUnavailable('External orders feed returned an empty body.')
        try:
            envelope = json.loads(raw.decode('utf-8'))
        except ValueError:
            logger.error('External orders feed %s returned invalid JSON.', url)
            raise ExternalOrdersUnavailable
        if isinstance(envelope, dict) and isinstance(envelope.get('results'), list):
            return envelope
        raise ExternalOrdersUnavailable('External orders feed returned an unexpected payload.')


client = ExternalOrdersClient()