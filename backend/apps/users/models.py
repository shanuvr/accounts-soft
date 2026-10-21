from django.db import models
from django.conf import settings


class Company(models.Model):
    name = models.CharField(max_length=200, unique=True)
    core_org_id = models.IntegerField(null=True, blank=True, unique=True, db_index=True)
    contact_no = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'companies'
        app_label = 'users'
        ordering = ['name']

    def __str__(self):
        return self.name


class Profile(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name='members', null=True, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
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
