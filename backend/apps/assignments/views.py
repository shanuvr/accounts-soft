from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Assignment
from .serializers import AssignmentSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
