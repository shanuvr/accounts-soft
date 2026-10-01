from django.contrib import admin
from .models import PaymentMethod, PaymentTerm, Tax, DeliveryType, OrderStatus, PTDAStatus, AssignmentStatus, DeliveryStatus, PaymentStatus, Category, Subcategory, IncomeExpenseHead

for model in [PaymentMethod, PaymentTerm, Tax, DeliveryType, OrderStatus, PTDAStatus, AssignmentStatus, DeliveryStatus, PaymentStatus, Category, Subcategory, IncomeExpenseHead]:
    admin.site.register(model)
