from django.contrib import admin
from .models import PaymentMethod, PaymentTerm, Tax, DeliveryType, OrderStatus, PTDAStatus, AssignmentStatus, DeliveryStatus, PaymentStatus, Category, Subcategory

for model in [PaymentMethod, PaymentTerm, Tax, DeliveryType, OrderStatus, PTDAStatus, AssignmentStatus, DeliveryStatus, PaymentStatus, Category, Subcategory]:
    admin.site.register(model)
