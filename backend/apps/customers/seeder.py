from .models import Product, ProductCategory

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
    """Seed default product categories and products for a company if it has none."""
    if not company:
        return

    category_map = {}
    for name, desc in DEFAULT_CATEGORIES:
        cat, _ = ProductCategory.objects.get_or_create(
            company=company,
            name=name,
            defaults={'description': desc},
        )
        category_map[name] = cat

    if Product.objects.filter(company=company).exists():
        return

    for index, (name, cat_name, price, requires_ptda, template, hours) in enumerate(DEFAULT_PRODUCTS, start=1):
        cat = category_map.get(cat_name) or ProductCategory.objects.filter(company=company, name=cat_name).first()
        Product.objects.get_or_create(
            company=company,
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

