import logging
from django.db import IntegrityError, transaction
from .models import Product, ProductCategory

logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    ('Domain', 'Domain registration and management services'),
    ('Hosting', 'Web hosting and server services'),
    ('SSL', 'SSL certificates and security'),
    ('Development', 'Website and application development'),
    ('Server', 'Server provisioning and management'),
    ('Maintenance', 'Ongoing maintenance and support'),
    ('Email', 'Email hosting and services'),
    ('Hardware', 'Hardware supply and setup'),
    ('Training', 'Training and onboarding'),
]

DEFAULT_PRODUCTS = [
    ('Domain Registration', 'Domain', 1500, True, 'domain', 2),
    ('Web Hosting', 'Hosting', 8000, True, 'hosting', 4),
    ('SSL Certificate', 'SSL', 2500, True, 'ssl', 1.5),
    ('Website Development', 'Development', 110000, True, 'website', 100),
    ('Maintenance', 'Maintenance', 3500, False, '', 10),
]


def seed_company_defaults(company):
    """Seed default product categories and products for a company safely and idempotently."""
    if not company:
        return

    company_id = getattr(company, 'id', None) or (company if isinstance(company, int) else None)
    if not company_id:
        return

    # Check if products already exist for this company
    if Product.objects.filter(company_id=company_id).exists():
        return

    category_map = {}
    for name, desc in DEFAULT_CATEGORIES:
        cat = ProductCategory.objects.filter(company_id=company_id, name=name).first()
        if not cat:
            try:
                with transaction.atomic():
                    cat, _ = ProductCategory.objects.get_or_create(
                        company_id=company_id,
                        name=name,
                        defaults={'description': desc},
                    )
            except IntegrityError:
                cat = ProductCategory.objects.filter(company_id=company_id, name=name).first()
        if cat:
            category_map[name] = cat

    for index, (name, cat_name, price, requires_ptda, template, hours) in enumerate(DEFAULT_PRODUCTS, start=1):
        if Product.objects.filter(company_id=company_id, name=name).exists():
            continue
        cat = category_map.get(cat_name) or ProductCategory.objects.filter(company_id=company_id, name=cat_name).first()
        try:
            with transaction.atomic():
                Product.objects.get_or_create(
                    company_id=company_id,
                    name=name,
                    defaults={
                        'code': f'PRD{index:03d}',
                        'category': cat,
                        'default_price': price,
                        'requires_ptda': requires_ptda,
                        'ptda_template': template,
                        'default_hours': hours,
                    },
                )
        except IntegrityError:
            pass
