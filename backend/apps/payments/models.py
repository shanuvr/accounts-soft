from django.db import models


class Payment(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    method = models.ForeignKey('masters.PaymentMethod', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.ForeignKey('masters.PaymentStatus', on_delete=models.SET_NULL, null=True, blank=True)
    reference = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    received_by = models.CharField(max_length=200, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    invoice_id = models.CharField(max_length=50, blank=True)
    is_refunded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'payments'
        app_label = 'payments'

    def __str__(self):
        return f"{self.order.order_id} - {self.amount}"


class PaymentSchedule(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payment_schedules')
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'payment_schedules'
        app_label = 'payments'

    def __str__(self):
        return f"{self.order.order_id} - {self.due_date}"
