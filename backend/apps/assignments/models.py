from django.db import models


class Assignment(models.Model):
    order_service = models.ForeignKey('services.OrderService', on_delete=models.CASCADE, related_name='assignments')
    employee = models.CharField(max_length=120, blank=True, null=True, default='')
    department = models.CharField(max_length=120, blank=True, null=True, default='')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, default='Medium', choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High'), ('Critical', 'Critical')])
    status = models.CharField(max_length=20, default='Pending')
    progress = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'assignments'
        app_label = 'assignments'

    def __str__(self):
        return self.title
