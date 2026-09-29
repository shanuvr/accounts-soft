from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ptda', '0003_alter_ptda_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='ptda',
            name='billable',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='ptda',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=14),
        ),
    ]