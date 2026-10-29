from django.db import IntegrityError, transaction
from rest_framework import serializers
from .models import Order, OrderService
from .order_ids import generate_order_id

NON_BILLABLE_PAYMENT_STATUS = 'Not Applicable'


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"
        extra_kwargs = {
            'company': {'required': False, 'allow_null': True},
            'order_id': {'required': False},
        }

    def validate(self, attrs):
        if attrs.get('is_billable') is False:
            attrs['subtotal'] = 0
            attrs['discount'] = 0
            attrs['tax_amount'] = 0
            attrs['payment_status'] = NON_BILLABLE_PAYMENT_STATUS
        return attrs

    def create(self, validated_data):
        explicit_id = validated_data.get('order_id')
        for _ in range(5):
            if not explicit_id:
                validated_data['order_id'] = generate_order_id()
            try:
                with transaction.atomic():
                    return super().create(validated_data)
            except IntegrityError:
                if explicit_id:
                    raise
        raise serializers.ValidationError({'order_id': 'Could not allocate a unique order id.'})


class OrderServiceSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)

    class Meta:
        model = OrderService
        fields = "__all__"
