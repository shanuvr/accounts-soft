from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Customer, CustomerType, Product, ProductCategory, Employee, Department, UOM
from .serializers import CustomerSerializer, CustomerTypeSerializer, ProductSerializer, ProductCategorySerializer, EmployeeSerializer, DepartmentSerializer, UOMSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ['name', 'contact_person', 'phone', 'email', 'customer_id']
    ordering_fields = ['name', 'created_at']


class CustomerTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = CustomerType.objects.all()
    serializer_class = CustomerTypeSerializer
    search_fields = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    search_fields = ['name', 'code']


class ProductCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    search_fields = ['name']


class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    search_fields = ['name', 'employee_code', 'email', 'designation']


class DepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    search_fields = ['name', 'code']


class UOMViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = UOM.objects.all()
    serializer_class = UOMSerializer
    search_fields = ['name', 'code']