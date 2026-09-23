from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Customer, CustomerType, Product, ProductCategory, Employee, Department, UOM
from .serializers import CustomerSerializer, CustomerTypeSerializer, ProductSerializer, ProductCategorySerializer, EmployeeSerializer, DepartmentSerializer, UOMSerializer
from .services import client as systemsoft


class SystemSoftResourceViewSet(viewsets.GenericViewSet):
    """Base viewset for resources owned by the SystemSoft core and accessed
    through the SystemSoft API (no direct database connection)."""

    resource = None
    resource_singular = None
    model = None
    serializer_class = None
    search_fields = []

    def _build_instances(self, items):
        return [self.model(**item) for item in items]

    def _apply_search(self, request, items):
        term = (request.query_params.get('search') or '').strip()
        if not term or not self.search_fields:
            return items
        lower = term.lower()
        return [
            item for item in items
            if any(lower in str(item.get(field, '')).lower() for field in self.search_fields)
        ]

    def _paginate(self, request, instances):
        page = self.paginate_queryset(instances)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.serializer_class(instances, many=True)
        return Response(serializer.data)

    def list(self, request):
        items = getattr(systemsoft, f'list_{self.resource}')()
        items = self._apply_search(request, items)
        return self._paginate(request, self._build_instances(items))

    def retrieve(self, request, pk=None):
        item = getattr(systemsoft, f'get_{self.resource_singular}')(pk)
        if not item:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(self.model(**item))
        return Response(serializer.data)

    def create(self, request):
        data = getattr(systemsoft, f'create_{self.resource_singular}')(request.data)
        serializer = self.serializer_class(self.model(**data)) if isinstance(data, dict) else None
        if serializer is not None:
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        data = getattr(systemsoft, f'update_{self.resource_singular}')(pk, request.data)
        serializer = self.serializer_class(self.model(**data)) if isinstance(data, dict) else None
        return Response(serializer.data if serializer is not None else data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        getattr(systemsoft, f'delete_{self.resource_singular}')(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerViewSet(SystemSoftResourceViewSet):
    resource = 'customers'
    resource_singular = 'customer'
    model = Customer
    serializer_class = CustomerSerializer
    search_fields = ['name', 'contact_person', 'phone', 'email', 'customer_id']


class EmployeeViewSet(SystemSoftResourceViewSet):
    resource = 'employees'
    resource_singular = 'employee'
    model = Employee
    serializer_class = EmployeeSerializer
    search_fields = ['name', 'employee_code', 'email', 'designation']


class DepartmentViewSet(SystemSoftResourceViewSet):
    resource = 'departments'
    resource_singular = 'department'
    model = Department
    serializer_class = DepartmentSerializer
    search_fields = ['name', 'code']


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


class UOMViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = UOM.objects.all()
    serializer_class = UOMSerializer
    search_fields = ['name', 'code']