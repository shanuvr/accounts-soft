import django.db.models.deletion
from django.db import migrations, models


def make_company_field(Company, related_name):
    field = models.ForeignKey(
        Company,
        on_delete=django.db.models.deletion.CASCADE,
        null=True,
        blank=True,
        related_name=related_name,
    )
    field.set_attributes_from_name('company')
    return field


def apply_schema_if_needed(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        cat_cols = {c.name.lower() for c in connection.introspection.get_table_description(cursor, 'product_categories')}
        prod_cols = {c.name.lower() for c in connection.introspection.get_table_description(cursor, 'products')}

    Company = apps.get_model('users', 'Company')
    ProductCategory = apps.get_model('customers', 'ProductCategory')
    Product = apps.get_model('customers', 'Product')

    # 1. Add company_id to product_categories if missing
    if 'company_id' not in cat_cols:
        schema_editor.add_field(ProductCategory, make_company_field(Company, 'product_categories'))

    # 2. Add company_id to products if missing
    if 'company_id' not in prod_cols:
        schema_editor.add_field(Product, make_company_field(Company, 'products'))

    # 3. Drop legacy unique index 'code' on products if present
    try:
        with connection.cursor() as cursor:
            cursor.execute('SHOW INDEX FROM products WHERE Key_name = %s', ['code'])
            if cursor.fetchall():
                cursor.execute('ALTER TABLE products DROP INDEX code')
    except Exception:
        pass

    # 4. Clean up any duplicate categories per company before adding unique key
    try:
        with connection.cursor() as cursor:
            cursor.execute('''
                DELETE c1 FROM product_categories c1
                INNER JOIN product_categories c2 
                WHERE c1.id > c2.id 
                  AND c1.name = c2.name 
                  AND ((c1.company_id = c2.company_id) OR (c1.company_id IS NULL AND c2.company_id IS NULL))
            ''')
    except Exception:
        pass

    # 5. Add unique index on product_categories (company_id, name) if not present
    try:
        with connection.cursor() as cursor:
            cursor.execute('SHOW INDEX FROM product_categories WHERE Key_name = %s', ['product_categories_company_name_uniq'])
            if not cursor.fetchall():
                cursor.execute('ALTER TABLE product_categories ADD UNIQUE KEY product_categories_company_name_uniq (company_id, name)')
    except Exception:
        pass

    # 6. Add unique index on products (company_id, name) if not present
    try:
        with connection.cursor() as cursor:
            cursor.execute('SHOW INDEX FROM products WHERE Key_name = %s', ['products_company_name_uniq'])
            if not cursor.fetchall():
                cursor.execute('ALTER TABLE products ADD UNIQUE KEY products_company_name_uniq (company_id, name)')
    except Exception:
        pass


def seed_all_companies(apps, schema_editor):
    Company = apps.get_model('users', 'Company')
    from customers.seeder import seed_company_defaults
    for company in Company.objects.all():
        seed_company_defaults(company)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_company_core_org_id'),
        ('customers', '0010_alter_employee_name'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
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
            ],
            database_operations=[
                migrations.RunPython(apply_schema_if_needed, noop),
            ],
        ),
        migrations.RunPython(seed_all_companies, noop),
    ]
