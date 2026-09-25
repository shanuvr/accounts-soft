from rest_framework import serializers

from orders.models import OrderService
from .models import PTDATemplate, PTDA


class PTDATemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PTDATemplate
        fields = "__all__"


class TemplateNameField(serializers.RelatedField):
    queryset = PTDATemplate.objects.all()

    def to_internal_value(self, data):
        if not data:
            return None
        is_pk = isinstance(data, int) or (isinstance(data, str) and data.isdigit())
        qs = PTDATemplate.objects.filter(pk=data) if is_pk else PTDATemplate.objects.filter(name=data)
        return qs.first()

    def to_representation(self, value):
        return value.name


class PTDASerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order_service.order.order_id', read_only=True)
    service_name = serializers.CharField(source='order_service.service_name', read_only=True)
    customer = serializers.SerializerMethodField()
    template = TemplateNameField(required=False, allow_null=True)
    order_service = serializers.PrimaryKeyRelatedField(
        queryset=OrderService.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = PTDA
        fields = "__all__"

    def get_customer(self, obj):
        return obj.order_service.order.customer or ''

    def validate(self, attrs):
        order_service = attrs.get('order_service')
        if order_service is None:
            order_id = self.initial_data.get('order_id')
            service_name = self.initial_data.get('service_name')
            if order_id and service_name:
                order_service = OrderService.objects.filter(
                    order__order_id=order_id,
                    service_name=service_name,
                ).first()
                if order_service is None:
                    raise serializers.ValidationError(
                        {'order_service': f'No service "{service_name}" found for order {order_id}. Create the service on the order first.'}
                    )
            else:
                raise serializers.ValidationError(
                    {'order_service': 'order_service id, or order_id + service_name, is required.'}
                )
            attrs['order_service'] = order_service
        return attrs
