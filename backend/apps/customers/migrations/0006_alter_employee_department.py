from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0005_department_managed'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='employee',
                    name='department',
                    field=models.IntegerField(blank=True, db_column='branch_id', null=True),
                ),
            ],
        ),
    ]