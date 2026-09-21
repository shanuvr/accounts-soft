from rest_framework import serializers
from .models import ReportConfig

class ReportConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportConfig
        fields = "__all__"
