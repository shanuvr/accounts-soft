from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0008_employee_managed'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='employee',
                    name='employee_code',
                    field=models.CharField(blank=True, db_column='code', max_length=20, unique=True),
                ),
                migrations.AlterField(
                    model_name='employee',
                    name='phone',
                    field=models.CharField(blank=True, db_column='mobile', max_length=20),
                ),
            ],
        ),
    ]