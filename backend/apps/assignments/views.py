from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from .models import Assignment
from .serializers import AssignmentSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        return scoped_queryset(Assignment.objects.all(), self.request.user, company_field='order_service__order__company')

    def perform_create(self, serializer):
        assignment = serializer.save()
        if assignment.order_service:
            from ptda.models import PTDA
            PTDA.objects.filter(order_service=assignment.order_service).update(status=assignment.status)

    def perform_update(self, serializer):
        assignment = serializer.save()
        if assignment.order_service:
            from ptda.models import PTDA
            PTDA.objects.filter(order_service=assignment.order_service).update(status=assignment.status)
