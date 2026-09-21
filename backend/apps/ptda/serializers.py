from rest_framework import serializers
from .models import PTDATemplate, PTDA

class PTDATemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PTDATemplate
        fields = "__all__"

class PTDASerializer(serializers.ModelSerializer):
    class Meta:
        model = PTDA
        fields = "__all__"
