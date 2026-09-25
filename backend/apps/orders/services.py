"""Client for the read-only external orders feed on the Lead Soft app.

Account Soft does not own the confirmed orders — they live in the Lead Soft
suite and are consumed through its external API (GET /api/external/orders/).
This mirrors the SystemSoft client in ``customers.services``: the base URL and
shared API key come from ``EXTERNAL_ORDERS_API_URL`` and
``EXTERNAL_ORDERS_API_KEY`` in .env, and when either is unset the feed returns
empty results.
"""
import json
import logging
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings

logger = logging.getLogger(__name__)

EMPTY_ENVELOPE = {'count': 0, 'page': 1, 'page_size': 500, 'results': []}


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
                'EXTERNAL_ORDERS_API_URL / EXTERNAL_ORDERS_API_KEY are not set; returning empty orders feed.'
            )
            return dict(EMPTY_ENVELOPE)

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
            return dict(EMPTY_ENVELOPE)
        except Exception as exc:  # noqa: BLE001 - keep the feed resilient
            logger.error('External orders feed %s errored: %s', url, exc)
            return dict(EMPTY_ENVELOPE)

        if not raw:
            return dict(EMPTY_ENVELOPE)
        try:
            envelope = json.loads(raw.decode('utf-8'))
        except ValueError:
            logger.error('External orders feed %s returned invalid JSON.', url)
            return dict(EMPTY_ENVELOPE)
        if isinstance(envelope, dict) and isinstance(envelope.get('results'), list):
            return envelope
        return dict(EMPTY_ENVELOPE)


client = ExternalOrdersClient()