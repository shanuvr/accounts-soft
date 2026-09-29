from django.db import migrations, models


def create_departments_table(apps, schema_editor):
    """Bring the ``departments`` table into existence.

    The department master was previously read through the (unconfigured)
    SystemSoft API, so no table exists in accounts_db yet. Earlier drafts left a
    stale, empty ``departments`` table behind in some local databases — that is
    dropped first. The table is created under the historical name
    (``master_branch``) so the subsequent ``AlterModelTable`` can rename it into
    place cleanly."""
    connection = schema_editor.connection
    existing = connection.introspection.table_names()
    if 'departments' in existing:
        schema_editor.execute('DROP TABLE departments')
    if 'master_branch' in existing:
        schema_editor.execute('DROP TABLE master_branch')
    Department = apps.get_model('customers', 'Department')
    schema_editor.create_model(Department)


def reverse_departments_table(apps, schema_editor):
    schema_editor.execute('DROP TABLE IF EXISTS departments')
    schema_editor.execute('DROP TABLE IF EXISTS master_branch')


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ('customers', '0004_alter_customertype_options_alter_product_options_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='department',
            options={},
        ),
        migrations.RunPython(
            create_departments_table,
            reverse_departments_table,
        ),
        migrations.AlterModelTable(
            name='department',
            table='departments',
        ),
        migrations.AlterField(
            model_name='department',
            name='code',
            field=models.CharField(max_length=20, unique=True),
        ),
        migrations.AddField(
            model_name='department',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]