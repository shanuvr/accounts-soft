from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Backfill delivery records for order services that do not have one yet.'

    def handle(self, *args, **options):
        from deliveries.models import Delivery
        from orders.models import OrderService

        created = 0
        skipped = 0
        for service in OrderService.objects.prefetch_related('deliveries', 'order').all():
            if service.deliveries.exists():
                skipped += 1
                continue
            order = service.order
            scheduled = service.delivery_date or order.delivery_date
            delivered = service.status in ('Completed', 'Delivered')
            Delivery.objects.create(
                order_service=service,
                scheduled_date=scheduled,
                status='Delivered' if delivered else 'Pending',
                actual_date=order.updated_at if delivered else None,
                notes='Backfilled from existing order service',
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Seeded deliveries: {created} created, {skipped} already present.'
            )
        )