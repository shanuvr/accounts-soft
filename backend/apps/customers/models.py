import re
import uuid

from django.db import models


class UOM(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

        db_table = 'uom'
        app_label = 'customers'

    def __str__(self):
        return self.name


class CustomerType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customer_types'
        app_label = 'customers'

    def __str__(self):
        return self.name


class Department(models.Model):
    """Shared master owned by SystemSoft (leadsdb: master_branch)."""

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50)
    address = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'master_branch'
        app_label = 'customers'

    def __str__(self):
        return self.name


class Employee(models.Model):
    """Shared master owned by SystemSoft (leadsdb: master_staff)."""

    employee_code = models.CharField(max_length=20, unique=True, blank=True, db_column='code')
    name = models.CharField(max_length=120)
    designation = models.CharField(max_length=120, blank=True, db_column='role')
    phone = models.CharField(max_length=20, blank=True, db_column='mobile')
    email = models.EmailField(blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, db_column='branch_id', related_name='employees')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'master_staff'
        app_label = 'customers'

    def save(self, *args, **kwargs):
        if not self.employee_code:
            self.employee_code = self._next_code()
        super().save(*args, **kwargs)

    def _next_code(self):
        last = Employee.objects.filter(employee_code__startswith='ST').order_by('-employee_code').values_list('employee_code', flat=True).first()
        if not last:
            return 'ST001'
        match = re.search(r'(\d+)$', str(last))
        try:
            num = int(match.group(1)) + 1 if match else 1
        except (ValueError, AttributeError):
            num = 1
        return f'ST{num:03d}'

    def __str__(self):
        return self.name


class Customer(models.Model):
    """Shared master owned by SystemSoft (leadsdb: transactions_clientdetail)."""

    customer_id = models.CharField(max_length=20, primary_key=True, db_column='id')
    lead_id = models.CharField(max_length=30, blank=True, default='')
    order_no = models.CharField(max_length=30, blank=True, default='')
    name = models.CharField(max_length=200, db_column='company')
    contact_person = models.CharField(max_length=120, blank=True, db_column='client_name')
    phone = models.CharField(max_length=20, blank=True, db_column='mobile')
    email = models.EmailField(blank=True)
    customer_type = models.CharField(max_length=100, blank=True, db_column='category')
    status = models.CharField(max_length=50, blank=True, default='Active')
    accepted_date = models.CharField(max_length=30, blank=True, default='')
    collected_by = models.CharField(max_length=120, blank=True, default='')
    notes = models.TextField(blank=True)
    client_token = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'transactions_clientdetail'
        app_label = 'customers'

    def save(self, *args, **kwargs):
        if not self.customer_id:
            self.customer_id = self._next_id()
        if not self.client_token:
            self.client_token = uuid.uuid4().hex
        super().save(*args, **kwargs)

    def _next_id(self):
        last = Customer.objects.order_by('-customer_id').values_list('customer_id', flat=True).first()
        if not last:
            return 'CUST-0001'
        match = re.search(r'(\d+)$', str(last))
        try:
            num = int(match.group(1)) + 1 if match else 1
        except (ValueError, AttributeError):
            num = 1
        return f'CUST-{num:04d}'

    def __str__(self):
        return self.name


class ProductCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_categories'
        app_label = 'customers'

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True, blank=True)
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    default_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.ForeignKey(UOM, on_delete=models.SET_NULL, null=True, blank=True)
    requires_ptda = models.BooleanField(default=False)
    ptda_template = models.CharField(max_length=50, blank=True)
    default_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        app_label = 'customers'

    def __str__(self):
        return self.name