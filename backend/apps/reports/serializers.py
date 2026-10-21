from rest_framework import serializers
from .models import ReportConfig

class ReportConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportConfig
        fields = "__all__"
        extra_kwargs = {'company': {'required': False, 'allow_null': True}}
