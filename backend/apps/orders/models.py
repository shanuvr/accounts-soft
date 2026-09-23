from django.db import models


class Order(models.Model):
    order_id = models.CharField(max_length=20, unique=True)
    lead_soft_ref = models.CharField(max_length=50, blank=True, help_text='Original Lead Soft reference')
    customer = models.CharField(max_length=200, blank=True, null=True, default='')
    order_date = models.DateField()
    delivery_date = models.DateField()
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_received = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    order_status = models.CharField(max_length=20, default='Pending')
    payment_status = models.CharField(max_length=20, default='Unpaid')
    delivery_status = models.CharField(max_length=20, default='Pending')
    sales_person = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    is_cancelled = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'orders'
        app_label = 'orders'

    def __str__(self):
        return self.order_id

    def save(self, *args, **kwargs):
        self.final_amount = self.subtotal - self.discount + self.tax_amount
        self.pending_amount = self.final_amount - self.total_received
        super().save(*args, **kwargs)


class OrderService(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='services')
    product = models.ForeignKey('customers.Product', on_delete=models.SET_NULL, null=True, blank=True)
    service_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.ForeignKey('customers.UOM', on_delete=models.SET_NULL, null=True, blank=True)
    tax = models.ForeignKey('masters.Tax', on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    requires_ptda = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='Pending')
    start_date = models.DateField(null=True, blank=True)
    delivery_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'order_services'
        app_label = 'services'

    def __str__(self):
        return f"{self.order.order_id} - {self.service_name}"

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)