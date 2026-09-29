from django.contrib import admin
from .models import CustomerType, Department, Product, ProductCategory, UOM

for model in [CustomerType, Department, Product, ProductCategory, UOM]:
    admin.site.register(model)