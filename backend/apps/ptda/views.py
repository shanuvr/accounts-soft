from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import PTDATemplate, PTDA
from .serializers import PTDATemplateSerializer, PTDASerializer

class PTDATemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PTDATemplate.objects.all()
    serializer_class = PTDATemplateSerializer

class PTDAViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = PTDA.objects.all()
    serializer_class = PTDASerializer
