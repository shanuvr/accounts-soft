from django.contrib import admin
from .models import Customer, CustomerType, Product, ProductCategory, Employee, Department, UOM

for model in [Customer, CustomerType, Product, ProductCategory, Employee, Department, UOM]:
    admin.site.register(model)
