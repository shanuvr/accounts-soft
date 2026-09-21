from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Profile
from .serializers import LoginTokenObtainPairSerializer, ProfileSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class LoginTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginTokenObtainPairSerializer
