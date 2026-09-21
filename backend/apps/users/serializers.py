from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class LoginTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        password = attrs.get('password')

        user = authenticate(request=self.context.get('request'), username=identifier, password=password)
        if user is None and identifier and '@' in identifier:
            UserModel = get_user_model()
            try:
                email_user = UserModel.objects.get(email__iexact=identifier)
            except UserModel.DoesNotExist:
                email_user = None
            if email_user is not None:
                user = authenticate(request=self.context.get('request'), username=email_user.username, password=password)

        if user is None or not user.is_active:
            raise serializers.ValidationError(
                {'detail': 'No active account found with the given credentials'},
                code='authorization',
            )

        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'name': user.get_full_name() or user.username,
                'email': user.email,
            },
        }
