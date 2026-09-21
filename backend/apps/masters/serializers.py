from rest_framework import serializers
from .models import PaymentMethod, PaymentTerm, Tax, DeliveryType, OrderStatus, PTDAStatus, AssignmentStatus, DeliveryStatus, PaymentStatus, Category, Subcategory

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = "__all__"

class PaymentTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTerm
        fields = "__all__"

class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = "__all__"

class DeliveryTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryType
        fields = "__all__"

class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = "__all__"

class PTDAStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = PTDAStatus
        fields = "__all__"

class AssignmentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentStatus
        fields = "__all__"

class DeliveryStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryStatus
        fields = "__all__"

class PaymentStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentStatus
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class SubcategorySerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category', 'category_name', 'description', 'is_active', 'created_at']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''
