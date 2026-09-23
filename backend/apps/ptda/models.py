from django.db import models


class PTDATemplate(models.Model):
    name = models.CharField(max_length=200)
    service_type = models.CharField(max_length=50)
    fields_config = models.JSONField(default=list, help_text='Array of field definitions')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'ptda_templates'
        app_label = 'ptda'

    def __str__(self):
        return self.name


class PTDA(models.Model):
    order_service = models.ForeignKey('services.OrderService', on_delete=models.CASCADE, related_name='ptdas')
    template = models.ForeignKey('ptda.PTDATemplate', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    data = models.JSONField(default=dict, help_text='Field values for this PTDA instance')
    status = models.CharField(max_length=20, default='Pending')
    required = models.BooleanField(default=True)
    is_sensitive = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'ptdas'
        app_label = 'ptda'

    def __str__(self):
        return f"{self.order_service.order.order_id} - {self.title}"
