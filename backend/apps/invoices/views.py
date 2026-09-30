from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer