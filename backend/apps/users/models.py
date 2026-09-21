from django.db import models
from django.conf import settings


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    employee_code = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'user_profiles'
        app_label = 'users'

    def __str__(self):
        return self.user.get_full_name() or self.user.username
