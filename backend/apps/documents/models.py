from django.db import models


class Document(models.Model):
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='documents')
    order_service = models.ForeignKey('services.OrderService', on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50, choices=[
        ('quotation', 'Quotation'),
        ('confirmation', 'Confirmation'),
        ('ptda', 'PTDA'),
        ('invoice', 'Invoice'),
        ('payment_proof', 'Payment Proof'),
        ('other', 'Other'),
    ])
    file_path = models.CharField(max_length=500)
    file_name = models.CharField(max_length=200)
    uploaded_by = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['-uploaded_at']

        db_table = 'documents'
        app_label = 'documents'

    def __str__(self):
        return f"{self.order.order_id} - {self.title}"
