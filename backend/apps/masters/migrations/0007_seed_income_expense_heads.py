from django.db import migrations

INCOME_HEADS = [
    'Consulting Fees',
    'Product Sales',
    'Interest Income',
    'Service Charges',
    'Recurring Retainers',
    'Investment Returns',
    'Other Income',
]

EXPENSE_HEADS = [
    'Office Supplies',
    'Travel & Conveyance',
    'Utilities & Internet',
    'Staff Refreshments',
    'Equipment Maintenance',
    'Professional Fees',
    'Rent & Maintenance',
    'Sales & Marketing',
    'Software Subscriptions',
]


def seed_defaults(apps, schema_editor):
    IncomeExpenseHead = apps.get_model('masters', 'IncomeExpenseHead')
    for idx, name in enumerate(INCOME_HEADS, start=1):
        IncomeExpenseHead.objects.get_or_create(
            entry_type='Income',
            name=name,
            company_id=None,
            defaults={'sort_order': idx},
        )
    for idx, name in enumerate(EXPENSE_HEADS, start=1):
        IncomeExpenseHead.objects.get_or_create(
            entry_type='Expense',
            name=name,
            company_id=None,
            defaults={'sort_order': idx},
        )


def unseed_defaults(apps, schema_editor):
    IncomeExpenseHead = apps.get_model('masters', 'IncomeExpenseHead')
    IncomeExpenseHead.objects.filter(
        entry_type='Income',
        company_id__isnull=True,
        name__in=INCOME_HEADS,
    ).delete()
    IncomeExpenseHead.objects.filter(
        entry_type='Expense',
        company_id__isnull=True,
        name__in=EXPENSE_HEADS,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('masters', '0006_incomeexpensehead'),
    ]

    operations = [
        migrations.RunPython(seed_defaults, unseed_defaults),
    ]