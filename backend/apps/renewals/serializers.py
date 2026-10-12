from rest_framework import serializers
from .models import Renewal


class RenewalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Renewal
        fields = "__all__"
        extra_kwargs = {'company': {'required': False, 'allow_null': True}}