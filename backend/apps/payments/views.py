from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Payment, PaymentSchedule
from .serializers import PaymentSerializer, PaymentScheduleSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

class PaymentScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PaymentSchedule.objects.all()
    serializer_class = PaymentScheduleSerializer
