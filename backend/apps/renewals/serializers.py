from rest_framework import serializers
from .models import Renewal


class RenewalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Renewal
        fields = "__all__"