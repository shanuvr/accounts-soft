from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import PaymentMethod, PaymentTerm, Tax, DeliveryType, OrderStatus, PTDAStatus, AssignmentStatus, DeliveryStatus, PaymentStatus, Category, Subcategory, IncomeExpenseHead
from .serializers import PaymentMethodSerializer, PaymentTermSerializer, TaxSerializer, DeliveryTypeSerializer, OrderStatusSerializer, PTDAStatusSerializer, AssignmentStatusSerializer, DeliveryStatusSerializer, PaymentStatusSerializer, CategorySerializer, SubcategorySerializer, IncomeExpenseHeadSerializer

class PaymentMethodViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    search_fields = ['name', 'code']

class PaymentTermViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer
    search_fields = ['name']

class TaxViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Tax.objects.all()
    serializer_class = TaxSerializer
    search_fields = ['name', 'type']

class DeliveryTypeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = DeliveryType.objects.all()
    serializer_class = DeliveryTypeSerializer
    search_fields = ['name']

class OrderStatusViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = OrderStatus.objects.all()
    serializer_class = OrderStatusSerializer
    search_fields = ['name', 'label']

class PTDAStatusViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PTDAStatus.objects.all()
    serializer_class = PTDAStatusSerializer
    search_fields = ['name', 'label']

class AssignmentStatusViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = AssignmentStatus.objects.all()
    serializer_class = AssignmentStatusSerializer
    search_fields = ['name', 'label']

class DeliveryStatusViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = DeliveryStatus.objects.all()
    serializer_class = DeliveryStatusSerializer
    search_fields = ['name', 'label']

class PaymentStatusViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PaymentStatus.objects.all()
    serializer_class = PaymentStatusSerializer
    search_fields = ['name', 'label']

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    search_fields = ['name', 'code']

class SubcategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Subcategory.objects.select_related('category').all()
    serializer_class = SubcategorySerializer
    search_fields = ['name', 'category__name']


class IncomeExpenseHeadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = IncomeExpenseHead.objects.all()
    serializer_class = IncomeExpenseHeadSerializer
    search_fields = ['entry_type', 'name']

    def get_queryset(self):
        qs = super().get_queryset()
        company_id = self.request.query_params.get('company_id')
        if company_id:
            qs = qs.filter(Q(company_id__isnull=True) | Q(company_id=company_id))
        return qs

    def _company_id_from_request(self):
        raw = self.request.query_params.get('company_id')
        return int(raw) if raw and str(raw).strip().isdigit() else None

    def perform_create(self, serializer):
        serializer.save(company_id=self._company_id_from_request())

    def perform_update(self, serializer):
        company_id = self._company_id_from_request()
        if company_id is not None:
            serializer.save(company_id=company_id)
        else:
            serializer.save()
