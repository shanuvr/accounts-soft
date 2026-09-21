from rest_framework import serializers
from .models import Customer, CustomerType, Product, ProductCategory, Employee, Department, UOM


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"
        extra_kwargs = {'customer_id': {'read_only': True}}


class CustomerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerType
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'code', 'category', 'category_name', 'description', 'default_price', 'unit', 'requires_ptda', 'ptda_template', 'default_hours', 'is_active', 'created_at', 'updated_at']

    def get_category(self, obj):
        return obj.category.name if obj.category else ''

    def create(self, validated_data):
        category_name = validated_data.pop('category_name', '')
        instance = super().create(validated_data)
        self._apply_category(instance, category_name)
        return instance

    def update(self, instance, validated_data):
        category_name = validated_data.pop('category_name', '')
        instance = super().update(instance, validated_data)
        self._apply_category(instance, category_name)
        return instance

    def _apply_category(self, instance, category_name):
        if category_name:
            category = ProductCategory.objects.filter(name=category_name).first()
            if category:
                instance.category = category
                instance.save(update_fields=['category'])


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    department = serializers.SerializerMethodField()
    department_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Employee
        fields = ['id', 'employee_code', 'name', 'designation', 'phone', 'email', 'department', 'department_name', 'created_at', 'updated_at']

    def get_department(self, obj):
        return obj.department.name if obj.department else ''

    def create(self, validated_data):
        department_name = validated_data.pop('department_name', '')
        instance = super().create(validated_data)
        self._apply_department(instance, department_name)
        return instance

    def update(self, instance, validated_data):
        department_name = validated_data.pop('department_name', '')
        instance = super().update(instance, validated_data)
        self._apply_department(instance, department_name)
        return instance

    def _apply_department(self, instance, department_name):
        if department_name:
            department = Department.objects.filter(name=department_name).first()
            if department:
                instance.department = department
                instance.save(update_fields=['department'])


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class UOMSerializer(serializers.ModelSerializer):
    class Meta:
        model = UOM
        fields = "__all__"