from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings


class CoreUserPrincipal:
    """Lightweight stand-in for ``request.user`` when a core-issued JWT is presented.

    accounts-soft does not keep its own user table. The JWT is verified against
    the Systemsoft core signing key (SIMPLE_JWT SIGNING_KEY), and the user id is
    taken from the token claims. Identity details (email/name/organizations) are
    resolved lazily through the core API — never from a local database.
    """

    def __init__(self, user_id, token=None, email='', name='', permissions=None):
        self.id = user_id
        self.pk = user_id
        self.token = token
        self.email = email
        self.name = name
        self.permissions = permissions or []
        self.is_authenticated = True
        self.is_anonymous = False
        self.is_staff = False
        self.is_superuser = False

    def __str__(self):
        return self.email or str(self.id)


def _app_code():
    return getattr(settings, 'CORE_APP_CODE', 'accounts-soft')


def _permissions_for(token, app_code):
    permissions = []
    for entry in token.get('app_access') or []:
        if entry.get('app') == app_code:
            permissions.extend(entry.get('permissions') or [])
    return sorted(set(permissions))


class CoreJWTAuthentication(JWTAuthentication):
    """Validates a Systemsoft core JWT without touching the local auth.User table.

    As well as verifying the signature/expiry against core's signing key, it
    enforces that the user has been granted access to *this* application and
    attaches the granted permissions to the resulting principal.
    """

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken('Token contained no recognizable user identification')

        app_code = _app_code()
        enabled_apps = validated_token.get('enabled_apps')
        # `enabled_apps` is absent on tokens issued before central access was
        # introduced; only enforce when the claim is present.
        if enabled_apps is not None and app_code not in enabled_apps:
            raise InvalidToken(
                f'You do not have access to {app_code}.', code='no_app_access',
            )

        return CoreUserPrincipal(
            user_id=user_id,
            token=str(validated_token),
            permissions=_permissions_for(validated_token, app_code),
        )
