import random

from django.utils import timezone

from .models import Order

ORDER_ID_PREFIX = 'PRG'
ORDER_ID_MIN = 1000
ORDER_ID_MAX = 9999


def generate_order_id(year=None):
    """Build a unique order id like ``PRG-2026-1298``.

    The trailing part is a random number within the year that is not already
    used by another order, so ids stay unique even when created concurrently.
    """
    year = year or timezone.now().year
    prefix = f'{ORDER_ID_PREFIX}-{year}-'
    used = set(
        Order.objects.filter(order_id__startswith=prefix).values_list('order_id', flat=True)
    )
    candidates = list(range(ORDER_ID_MIN, ORDER_ID_MAX + 1))
    random.shuffle(candidates)
    for number in candidates:
        candidate = f'{prefix}{number}'
        if candidate not in used:
            return candidate
    raise RuntimeError(f'No free order id available for {prefix.rstrip("-")}.')
