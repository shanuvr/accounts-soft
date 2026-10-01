from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Profile
from .serializers import LoginTokenObtainPairSerializer, ProfileSerializer, RegisterSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class LoginTokenObtainPairView(TokenObtainPairView):
    serializer_class = LoginTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        refresh = result['refresh']
        return Response(
            {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': result['user'],
            },
            status=status.HTTP_201_CREATED,
        )