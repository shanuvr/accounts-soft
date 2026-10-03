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

    def __init__(self, user_id, token=None, email='', name=''):
        self.id = user_id
        self.pk = user_id
        self.token = token
        self.email = email
        self.name = name
        self.is_authenticated = True
        self.is_anonymous = False
        self.is_staff = False
        self.is_superuser = False

    def __str__(self):
        return self.email or str(self.id)


class CoreJWTAuthentication(JWTAuthentication):
    """Validates a Systemsoft core JWT without touching the local auth.User table.

    The signature/expiry checks run against core's signing key. ``get_user`` is
    overridden so the presented identity maps to a ``CoreUserPrincipal`` instead
    of a local Django user record.
    """

    def get_user(self, validated_token):
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken('Token contained no recognizable user identification')
        return CoreUserPrincipal(user_id=user_id, token=str(validated_token))