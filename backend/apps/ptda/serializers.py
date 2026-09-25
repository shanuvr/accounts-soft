from rest_framework import serializers
from .models import PTDATemplate, PTDA

class PTDATemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PTDATemplate
        fields = "__all__"

class PTDASerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order_service.order.order_id', read_only=True)
    service_name = serializers.CharField(source='order_service.service_name', read_only=True, default='')
    customer_name = serializers.CharField(source='order_service.order.customer', read_only=True, default='')

    class Meta:
        model = PTDA
        fields = "__all__"
