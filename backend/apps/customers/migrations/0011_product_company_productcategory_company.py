import django.db.models.deletion
from django.db import migrations, models


def seed_all_companies(apps, schema_editor):
    Company = apps.get_model('users', 'Company')
    ProductCategory = apps.get_model('customers', 'ProductCategory')
    Product = apps.get_model('customers', 'Product')

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

    for company in Company.objects.all():
        cat_map = {}
        for name, desc in DEFAULT_CATEGORIES:
            cat, _ = ProductCategory.objects.get_or_create(
                company=company,
                name=name,
                defaults={'description': desc},
            )
            cat_map[name] = cat

        if not Product.objects.filter(company=company).exists():
            for idx, (name, cat_name, price, requires_ptda, template, hours) in enumerate(DEFAULT_PRODUCTS, start=1):
                cat = cat_map.get(cat_name)
                Product.objects.get_or_create(
                    company=company,
                    name=name,
                    defaults={
                        'code': f'PRD{idx:03d}',
                        'category': cat,
                        'default_price': price,
                        'requires_ptda': requires_ptda,
                        'ptda_template': template,
                        'default_hours': hours,
                    },
                )


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_company_core_org_id'),
        ('customers', '0010_alter_employee_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='productcategory',
            name='company',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='product_categories',
                to='users.company',
            ),
        ),
        migrations.AlterField(
            model_name='productcategory',
            name='name',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterUniqueTogether(
            name='productcategory',
            unique_together={('company', 'name')},
        ),
        migrations.AddField(
            model_name='product',
            name='company',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to='users.company',
            ),
        ),
        migrations.AlterField(
            model_name='product',
            name='code',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AlterUniqueTogether(
            name='product',
            unique_together={('company', 'name')},
        ),
        migrations.RunPython(seed_all_companies, noop),
    ]

