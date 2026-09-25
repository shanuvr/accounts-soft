from rest_framework import serializers
from .models import Payment, PaymentSchedule

class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    customer_name = serializers.CharField(source='order.customer', read_only=True, default='')
    method_name = serializers.CharField(source='method.name', read_only=True, default='')
    status_name = serializers.CharField(source='status.name', read_only=True, default='')

    class Meta:
        model = Payment
        fields = "__all__"

class PaymentScheduleSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    customer_name = serializers.CharField(source='order.customer', read_only=True, default='')

    class Meta:
        model = PaymentSchedule
        fields = "__all__"
