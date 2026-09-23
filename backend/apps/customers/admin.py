from django.contrib import admin
from .models import CustomerType, Product, ProductCategory, UOM

for model in [CustomerType, Product, ProductCategory, UOM]:
    admin.site.register(model)