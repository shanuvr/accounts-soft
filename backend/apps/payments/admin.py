from django.contrib import admin
from .models import Payment, PaymentSchedule

admin.site.register(Payment)
admin.site.register(PaymentSchedule)
