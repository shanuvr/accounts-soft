from rest_framework import status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Customer, CustomerType, Product, ProductCategory, Department, UOM
from .serializers import CustomerSerializer, CustomerTypeSerializer, ProductSerializer, ProductCategorySerializer, CoreEmployeeSerializer, DepartmentSerializer, UOMSerializer
from .services import client as systemsoft
from .services import SystemSoftUnavailable
from users.services import (
    CoreApiError,
    CoreUnavailable,
    bearer_token_from_request,
    default_organization_for,
    client as core,
)


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

    def _unavailable(self):
        return Response(
            {'detail': 'SystemSoft identity service is unreachable. Please try again later.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    def list(self, request):
        try:
            items = getattr(systemsoft, f'list_{self.resource}')()
        except SystemSoftUnavailable:
            return self._unavailable()
        items = self._apply_search(request, items)
        return self._paginate(request, self._build_instances(items))

    def retrieve(self, request, pk=None):
        try:
            item = getattr(systemsoft, f'get_{self.resource_singular}')(pk)
        except SystemSoftUnavailable:
            return self._unavailable()
        if not item:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(self.model(**item))
        return Response(serializer.data)

    def create(self, request):
        try:
            data = getattr(systemsoft, f'create_{self.resource_singular}')(request.data)
        except SystemSoftUnavailable:
            return self._unavailable()
        serializer = self.serializer_class(self.model(**data)) if isinstance(data, dict) else None
        if serializer is not None:
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        try:
            data = getattr(systemsoft, f'update_{self.resource_singular}')(pk, request.data)
        except SystemSoftUnavailable:
            return self._unavailable()
        serializer = self.serializer_class(self.model(**data)) if isinstance(data, dict) else None
        return Response(serializer.data if serializer is not None else data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        try:
            getattr(systemsoft, f'delete_{self.resource_singular}')(pk)
        except SystemSoftUnavailable:
            return self._unavailable()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CustomerViewSet(SystemSoftResourceViewSet):
    resource = 'customers'
    resource_singular = 'customer'
    model = Customer
    serializer_class = CustomerSerializer
    search_fields = ['name', 'contact_person', 'phone', 'email', 'customer_id']

    def list(self, request):
        core_org_id = getattr(request.user, 'core_org_id', None)
        tenant_name = request.user.company.name if getattr(request.user, 'company', None) else ''
        try:
            items = systemsoft.list_customers(core_org_id=core_org_id, tenant_name=tenant_name)
        except SystemSoftUnavailable:
            return self._unavailable()
        items = self._apply_search(request, items)
        return self._paginate(request, self._build_instances(items))


class EmployeeViewSet(SystemSoftResourceViewSet):
    """Employees are owned by Systemsoft core; this view proxies to its API.

    All reads/writes carry the user's bearer token (core applies membership
    authorization server-side) and are scoped to the user's default
    organization. The local ``employees`` table is no longer used.
    """

    resource = 'employees'
    resource_singular = 'employee'
    serializer_class = CoreEmployeeSerializer
    search_fields = ['employee_code', 'name', 'email', 'designation', 'department']

    def _build_instances(self, items):
        return items

    def _org(self):
        org = default_organization_for(self.request)
        if org is None:
            raise PermissionDenied(
                'You are not a member of any organization. Join one in the Systemsoft identity service first.'
            )
        return org

    def _handle(self, exc):
        if isinstance(exc, CoreApiError):
            detail = exc.detail
            if isinstance(detail, dict):
                detail = detail.get('detail')
            return Response({'detail': detail or 'Identity service rejected the request.'},
                            status=exc.status or status.HTTP_502_BAD_GATEWAY)
        if isinstance(exc, CoreUnavailable):
            return self._unavailable()
        return None

    def _token(self):
        return bearer_token_from_request(self.request)

    def _prepare(self, data):
        data = dict(data or {})
        department_name = data.pop('department_name', None)
        if department_name and not data.get('department'):
            data['department'] = department_name
        return data

    def list(self, request):
        try:
            items = core.list_employees(self._org()['id'], self._token())
        except (CoreApiError, CoreUnavailable) as exc:
            response = self._handle(exc)
            if response is not None:
                return response
            raise
        items = self._apply_search(request, items)
        return self._paginate(request, self._build_instances(items))

    def retrieve(self, request, pk=None):
        try:
            item = core.get_employee(self._org()['id'], pk, self._token())
        except (CoreApiError, CoreUnavailable) as exc:
            response = self._handle(exc)
            if response is not None:
                return response
            raise
        if not item:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(item)
        return Response(serializer.data)

    def create(self, request):
        data = self._prepare(request.data)
        data['organization'] = self._org()['id']
        try:
            item = core.create_employee(data, self._token())
        except (CoreApiError, CoreUnavailable) as exc:
            response = self._handle(exc)
            if response is not None:
                return response
            raise
        serializer = self.serializer_class(item) if isinstance(item, dict) else None
        return Response(serializer.data if serializer is not None else item, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        data = self._prepare(request.data)
        try:
            item = core.update_employee(pk, data, self._token())
        except (CoreApiError, CoreUnavailable) as exc:
            response = self._handle(exc)
            if response is not None:
                return response
            raise
        serializer = self.serializer_class(item) if isinstance(item, dict) else None
        return Response(serializer.data if serializer is not None else item)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        try:
            core.delete_employee(pk, self._token())
        except (CoreApiError, CoreUnavailable) as exc:
            response = self._handle(exc)
            if response is not None:
                return response
            raise
        return Response(status=status.HTTP_204_NO_CONTENT)


class DepartmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Department.objects.all()
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