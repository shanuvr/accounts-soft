from django.db import models
from django.utils.text import slugify


class PaymentMethod(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'payment_methods'
        app_label = 'masters'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = slugify(self.name)[:10].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class PaymentTerm(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    days_due = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'payment_terms'
        app_label = 'masters'

    def __str__(self):
        return self.name


class Tax(models.Model):
    name = models.CharField(max_length=100, unique=True)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    type = models.CharField(max_length=30, blank=True, default='Other')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'taxes'
        app_label = 'masters'

    def __str__(self):
        return self.name


class DeliveryType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'delivery_types'
        app_label = 'masters'

    def __str__(self):
        return self.name


class OrderStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=50)
    is_terminal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'order_statuses'
        app_label = 'masters'

    def __str__(self):
        return self.label


class PTDAStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=50)
    is_terminal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'ptda_statuses'
        app_label = 'masters'

    def __str__(self):
        return self.label


class AssignmentStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=50)
    is_terminal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'assignment_statuses'
        app_label = 'masters'

    def __str__(self):
        return self.label


class DeliveryStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=50)
    is_terminal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'delivery_statuses'
        app_label = 'masters'

    def __str__(self):
        return self.label


class PaymentStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=50)
    is_terminal = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'payment_statuses'
        app_label = 'masters'

    def __str__(self):
        return self.label


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'categories'
        app_label = 'masters'

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = slugify(self.name)[:20].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Subcategory(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('category', 'name')
        db_table = 'subcategories'
        app_label = 'masters'

    def __str__(self):
        return self.name
