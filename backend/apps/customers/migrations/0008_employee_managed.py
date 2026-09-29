from django.db import migrations, models
import django.db.models.deletion


def create_employees_table(apps, schema_editor):
    """Bring the managed ``employees`` table into existence.

    Employees were previously read through the (unconfigured) SystemSoft API,
    so no table exists in accounts_db yet. Earlier drafts left a stale, empty
    ``employees`` table in some local databases — that is dropped first and the
    table is created fresh with the schema matching the current model."""
    connection = schema_editor.connection
    existing = connection.introspection.table_names()
    for table in ('employees', 'master_staff'):
        if table in existing:
            schema_editor.execute(f'DROP TABLE {table}')

    if connection.vendor == 'mysql':
        sql = (
            'CREATE TABLE employees ('
            ' id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,'
            ' code varchar(20) NOT NULL UNIQUE,'
            ' name varchar(120) NOT NULL,'
            ' role varchar(120) NOT NULL,'
            ' mobile varchar(20) NOT NULL,'
            ' email varchar(254) NOT NULL,'
            ' branch_id bigint NULL,'
            ' created_at datetime(6) NOT NULL,'
            ' updated_at datetime(6) NOT NULL)'
        )
    else:
        sql = (
            'CREATE TABLE employees ('
            ' id integer NOT NULL PRIMARY KEY AUTOINCREMENT,'
            ' code varchar(20) NOT NULL UNIQUE,'
            ' name varchar(120) NOT NULL,'
            ' role varchar(120) NOT NULL,'
            ' mobile varchar(20) NOT NULL,'
            ' email varchar(254) NOT NULL,'
            ' branch_id bigint NULL,'
            ' created_at datetime NOT NULL,'
            ' updated_at datetime NOT NULL)'
        )
    schema_editor.execute(sql)


def reverse_employees_table(apps, schema_editor):
    schema_editor.execute('DROP TABLE IF EXISTS employees')
    schema_editor.execute('DROP TABLE IF EXISTS master_staff')


class Migration(migrations.Migration):

    atomic = False

    dependencies = [
        ('customers', '0007_alter_department_options'),
    ]

    operations = [
        migrations.RunPython(
            create_employees_table,
            reverse_employees_table,
        ),
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterModelOptions(
                    name='employee',
                    options={'ordering': ['-created_at']},
                ),
                migrations.AlterModelTable(
                    name='employee',
                    table='employees',
                ),
                migrations.AddField(
                    model_name='employee',
                    name='name',
                    field=models.CharField(max_length=120),
                ),
                migrations.AddField(
                    model_name='employee',
                    name='email',
                    field=models.EmailField(blank=True, max_length=254),
                ),
                migrations.AddField(
                    model_name='employee',
                    name='updated_at',
                    field=models.DateTimeField(auto_now=True),
                ),
                migrations.RemoveField(
                    model_name='employee',
                    name='is_active',
                ),
                migrations.RemoveField(
                    model_name='employee',
                    name='user',
                ),
                migrations.AlterField(
                    model_name='employee',
                    name='designation',
                    field=models.CharField(blank=True, db_column='role', max_length=120),
                ),
                migrations.AlterField(
                    model_name='employee',
                    name='department',
                    field=models.ForeignKey(blank=True, db_column='branch_id', null=True,
                                            on_delete=django.db.models.deletion.SET_NULL,
                                            related_name='employees', to='customers.department'),
                ),
            ],
        ),
    ]