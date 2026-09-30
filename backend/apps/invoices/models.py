from django.db import models


class Invoice(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='invoices')
    invoice_id = models.CharField(max_length=20, unique=True, blank=True)
    invoice_type = models.CharField(max_length=50, default='Full Invoice')
    plan_stage = models.CharField(max_length=200, blank=True, default='')
    invoice_date = models.DateField()
    due_date = models.DateField()
    payment_terms = models.CharField(max_length=50, default='Net 7')
    items = models.JSONField(default=list)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, default='Draft')
    sent_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    auto = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'invoices'
        app_label = 'invoices'

    def __str__(self):
        return self.invoice_id

    def save(self, *args, **kwargs):
        if not self.invoice_id:
            self.invoice_id = self._next_invoice_id()
        super().save(*args, **kwargs)

    @staticmethod
    def _next_invoice_id():
        numbers = []
        for inv in Invoice.objects.all():
            tail = inv.invoice_id.split('-')[-1]
            if tail.isdigit():
                numbers.append(int(tail))
        n = (max(numbers) if numbers else 0) + 1
        return 'INV-{:03d}'.format(n)