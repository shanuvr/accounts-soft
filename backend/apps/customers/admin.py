from django.contrib import admin
from .models import CustomerType, Department, Employee, Product, ProductCategory, UOM

for model in [CustomerType, Department, Employee, Product, ProductCategory, UOM]:
    admin.site.register(model)