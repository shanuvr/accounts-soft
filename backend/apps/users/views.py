from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfileSerializer
from .services import (
    CoreApiError,
    CoreUnavailable,
    app_enabled,
    app_permissions,
    bearer_token_from_request,
    client as core,
    fallback_user_payload,
    user_payload,
)

UNREACHABLE = 'Identity service (SystemSoft) is unreachable. Please try again later.'


def _core_error(exc, default='Identity service rejected the request.'):
    detail = exc.detail
    if isinstance(detail, dict) and 'detail' in detail:
        detail = detail['detail']
    return Response({'detail': detail or default}, status=exc.status or status.HTTP_502_BAD_GATEWAY)


def _unreachable():
    return Response({'detail': UNREACHABLE}, status=status.HTTP_502_BAD_GATEWAY)


class ProfileViewSet(viewsets.ModelViewSet):
    """Retained for backward compatibility; no longer used by login/session.

    accounts-soft identity lives in Systemsoft core. This local table is kept
    only to avoid data churn and is typically empty.
    """

    permission_classes = [IsAuthenticated]
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class LoginTokenObtainPairView(APIView):
    """Proxy login to Systemsoft core and return core-issued tokens.

    The browser keeps using /api/auth/token/; credentials and the identity
    check happen entirely inside core. The response mirrors the previous
    accounts-soft shape so the frontend auth store is unchanged.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or request.data.get('username') or '').strip()
        password = request.data.get('password')

        try:
            data = core.login(email, password)
        except CoreApiError as exc:
            return _core_error(exc, default='Invalid email or password')
        except CoreUnavailable:
            return _unreachable()

        app_code = getattr(settings, 'CORE_APP_CODE', 'accounts-soft')
        core_user = data.get('user') or {}
        if not app_enabled(core_user, app_code):
            return Response(
                {'detail': f'Your account does not have access to {app_code}. '
                           f'Contact your administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user = user_payload(core_user, data.get('access'))
        except (CoreApiError, CoreUnavailable):
            user = fallback_user_payload(core_user)
        user['enabled_apps'] = core_user.get('enabled_apps') or []
        user['permissions'] = app_permissions(core_user, app_code)

        return Response({
            'refresh': data.get('refresh'),
            'access': data.get('access'),
            'user': user,
        })


class RefreshTokenView(APIView):
    """Proxy token refresh to core (core remains the only JWT issuer)."""

    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = core.refresh(request.data.get('refresh'))
        except CoreApiError as exc:
            return _core_error(exc, default='Refresh token is invalid')
        except CoreUnavailable:
            return _unreachable()
        response = {'access': data.get('access')}
        if data.get('refresh'):
            response['refresh'] = data['refresh']
        return Response(response)


class RegisterView(APIView):
    """Register a user + company through Systemsoft core.

    1. Create the global user in core (open endpoint).
    2. Log in to obtain tokens.
    3. Create the organization in core; the registering user becomes its owner.

    Enabling the accounts-soft subscription for the new organization is done by
    an org owner/admin or a core superuser (applications cannot self-subscribe).
    """

    permission_classes = [AllowAny]

    def post(self, request):
        company_data = request.data.get('company') or {}
        company_name = (
            company_data.get('name') if isinstance(company_data, dict) else None
        ) or request.data.get('company_name') or 'My Company'

        payload = {
            'email': (request.data.get('email') or '').strip(),
            'name': (request.data.get('name') or '').strip(),
            'password': request.data.get('password'),
        }

        try:
            core.register_user(payload)
            token_data = core.login(payload['email'], payload['password'])
        except CoreApiError as exc:
            if isinstance(exc.detail, dict):
                return Response(exc.detail, status=exc.status or status.HTTP_400_BAD_REQUEST)
            return Response({'detail': exc.detail or 'Registration failed'}, status=exc.status or status.HTTP_400_BAD_REQUEST)
        except CoreUnavailable:
            return _unreachable()

        access = token_data.get('access')
        try:
            core.create_organization(access, company_name)
        except CoreApiError as exc:
            return _core_error(exc, default='Could not create the company.')
        except CoreUnavailable:
            return _unreachable()

        try:
            user = user_payload(token_data.get('user') or {}, access)
        except (CoreApiError, CoreUnavailable):
            user = fallback_user_payload(token_data.get('user'))

        return Response({
            'refresh': token_data.get('refresh'),
            'access': access,
            'user': user,
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """Return the current user's enriched profile from core.

    Uses the bearer token presented by the client so core's own server-side
    membership authorization applies.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = bearer_token_from_request(request)
        user_id = getattr(request.user, 'id', None)
        if not token or not user_id:
            raise AuthenticationFailed('Invalid token.')
        try:
            core_user = core.get_me(token, user_id)
            payload = user_payload(core_user, token)
        except CoreApiError as exc:
            return _core_error(exc, default='Could not load your profile.')
        except CoreUnavailable:
            return _unreachable()
        return Response(payload)