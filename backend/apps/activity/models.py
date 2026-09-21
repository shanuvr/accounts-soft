from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)
    module = models.CharField(max_length=50)
    record_type = models.CharField(max_length=50)
    record_id = models.CharField(max_length=50)
    previous_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

        db_table = 'audit_logs'
        app_label = 'activity'

    def __str__(self):
        return f"{self.user} - {self.action} - {self.record_type} {self.record_id} - {self.timestamp}"
