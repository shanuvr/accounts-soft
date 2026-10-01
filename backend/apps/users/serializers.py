from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Company, Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = "__all__"


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'contact_no', 'email', 'address', 'created_at']


def _user_payload(user):
    profile = getattr(user, 'profile', None)
    return {
        'id': user.id,
        'name': user.get_full_name() or user.username,
        'email': user.email,
        'role': profile.role if profile else Profile.Role.MEMBER,
        'company': CompanySerializer(profile.company).data if profile and profile.company else None,
    }


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
            'user': _user_payload(user),
        }


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    company = CompanySerializer()

    def validate_username(self, value):
        UserModel = get_user_model()
        if UserModel.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value

    def validate_email(self, value):
        UserModel = get_user_model()
        if UserModel.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        company_data = validated_data.pop('company')
        company = Company.objects.create(**company_data)

        UserModel = get_user_model()
        user = UserModel.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('name', ''),
        )
        Profile.objects.create(user=user, company=company, role=Profile.Role.ADMIN)

        return {
            'refresh': RefreshToken.for_user(user),
            'user': _user_payload(user),
        }