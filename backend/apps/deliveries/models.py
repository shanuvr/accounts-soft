from django.db import models


class Delivery(models.Model):
    order_service = models.ForeignKey('services.OrderService', on_delete=models.CASCADE, related_name='deliveries')
    delivery_type = models.ForeignKey('masters.DeliveryType', on_delete=models.SET_NULL, null=True, blank=True)
    scheduled_date = models.DateField()
    actual_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='Pending')
    tracking_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'deliveries'
        app_label = 'deliveries'

    def __str__(self):
        return f"{self.order_service.order.order_id} - {self.scheduled_date}"
