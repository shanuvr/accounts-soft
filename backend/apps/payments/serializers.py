from rest_framework import serializers
from .models import Payment, PaymentSchedule

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

class PaymentScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSchedule
        fields = "__all__"
