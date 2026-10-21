import json
import logging
import urllib.error
import urllib.request
from django.conf import settings
from django.core.management.base import BaseCommand
from payments.views import sync_external_payment

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetches payments from Leads external payments feed and syncs them to Account Soft.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            default='',
            help='Override the Leads external payments endpoint URL.',
        )
        parser.add_argument(
            '--key',
            default='',
            help='Override the external API key.',
        )

    def handle(self, *args, **options):
        base_url = options.get('url') or getattr(settings, 'LEAD_SOFT_PAYMENTS_API_URL', '')
        if not base_url:
            orders_url = getattr(settings, 'EXTERNAL_ORDERS_API_URL', '')
            if '/orders/' in orders_url:
                base_url = orders_url.replace('/orders/', '/payments/')
            elif orders_url:
                base_url = orders_url.rstrip('/') + '/payments/'
            else:
                base_url = 'http://127.0.0.1:8002/api/external/payments/'

        key = (
            options.get('key')
            or getattr(settings, 'EXTERNAL_ORDERS_API_KEY', '')
            or getattr(settings, 'LEAD_SOFT_API_TOKEN', '')
        )

        self.stdout.write(f'Connecting to Leads payments feed at: {base_url}')

        current_url = base_url
        total_synced = 0
        total_created = 0
        total_existing = 0
        page_num = 1

        while current_url:
            req = urllib.request.Request(current_url, method='GET')
            req.add_header('Accept', 'application/json')
            if key:
                req.add_header('Authorization', f'Bearer {key}')

            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f'Failed to fetch from {current_url}: {exc}'))
                break

            results = data.get('results', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
            self.stdout.write(f'Page {page_num}: retrieved {len(results)} payment(s).')

            for p in results:
                ok, res_data, _ = sync_external_payment(p)
                if ok:
                    total_synced += 1
                    if res_data.get('created'):
                        total_created += 1
                        self.stdout.write(self.style.SUCCESS(f"  [CREATED] Payment for Order {p.get('order_id')} - Rs.{p.get('amount')}"))
                    else:
                        total_existing += 1
                        self.stdout.write(f"  [EXISTS] Payment for Order {p.get('order_id')} - Rs.{p.get('amount')}")
                else:
                    self.stderr.write(self.style.WARNING(f"  [ERROR] {res_data.get('error')} for {p}"))

            next_url = data.get('next') if isinstance(data, dict) else None
            if next_url and next_url != current_url:
                current_url = next_url
                page_num += 1
            else:
                break

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSync completed! Total processed: {total_synced} ({total_created} newly created, {total_existing} already present).'
            )
        )
