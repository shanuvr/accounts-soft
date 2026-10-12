from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from users.permissions import write_permission
from .models import PTDATemplate, PTDA
from .serializers import PTDATemplateSerializer, PTDASerializer

class PTDATemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.ptda.create', 'accounts.ptda.edit')]
    queryset = PTDATemplate.objects.all()
    serializer_class = PTDATemplateSerializer

class PTDAViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.ptda.create', 'accounts.ptda.edit')]
    serializer_class = PTDASerializer

    def get_queryset(self):
        return scoped_queryset(PTDA.objects.all(), self.request.user, company_field='order_service__order__company')
