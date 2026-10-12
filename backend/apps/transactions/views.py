from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer
    search_fields = ['entry_type', 'head', 'category', 'subcategory', 'bank_name', 'description']

    def get_queryset(self):
        return scoped_queryset(Transaction.objects.all(), self.request.user)

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, 'company', None))