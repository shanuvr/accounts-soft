from django.db import models


class ReportConfig(models.Model):
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=[
        ('orders', 'Orders'),
        ('ptda', 'PTDA'),
        ('assignments', 'Assignments'),
        ('deliveries', 'Deliveries'),
        ('finance', 'Finance'),
    ])
    filters = models.JSONField(default=dict)
    columns = models.JSONField(default=list)
    format = models.CharField(max_length=20, default='pdf', choices=[('excel', 'Excel'), ('csv', 'CSV'), ('pdf', 'PDF')])
    is_active = models.BooleanField(default=True)
    created_by = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'report_configs'
        app_label = 'reports'

    def __str__(self):
        return self.name
