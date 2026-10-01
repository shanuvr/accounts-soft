from django.db import models


class Transaction(models.Model):
    class EntryType(models.TextChoices):
        INCOME = 'Income', 'Income'
        EXPENSE = 'Expense', 'Expense'

    entry_type = models.CharField(
        max_length=10,
        choices=EntryType.choices,
        default=EntryType.EXPENSE,
    )
    date = models.DateField()
    head = models.CharField(max_length=100, default='General Expense')
    category = models.CharField(max_length=100, blank=True, default='')
    subcategory = models.CharField(max_length=100, blank=True, default='')
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cash_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    bank_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, default='Cash')
    bank_payment_type = models.CharField(max_length=20, blank=True, default='')
    bank_name = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-id']
        db_table = 'transactions'
        app_label = 'transactions'

    def __str__(self):
        return f"{self.entry_type} {self.head} - {self.amount}"