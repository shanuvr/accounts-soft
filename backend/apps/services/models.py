from django.db import models


class Service(models.Model):
    order_service = models.ForeignKey('services.OrderService', on_delete=models.CASCADE, related_name='service_items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    service_type = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, default='Pending')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'services'
        app_label = 'services'

    def __str__(self):
        return self.name
