from django.db import models


class Renewal(models.Model):
    type = models.CharField(max_length=50, default='Other')
    name = models.CharField(max_length=255)
    customer = models.CharField(max_length=255, blank=True, default='—')
    expiry_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notified = models.BooleanField(default=False)
    notified_at = models.DateField(null=True, blank=True)
    renewals = models.PositiveIntegerField(default=0)
    last_renewed_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['expiry_date']
        db_table = 'renewals'
        app_label = 'renewals'

    def __str__(self):
        return f"{self.name} - {self.expiry_date}"