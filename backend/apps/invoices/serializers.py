from rest_framework import serializers
from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    customer_name = serializers.CharField(source='order.customer', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = "__all__"