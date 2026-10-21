from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        return scoped_queryset(Document.objects.all(), self.request.user, company_field='order__company')
