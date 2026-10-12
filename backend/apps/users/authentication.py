from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.settings import api_settings

from .scoping import get_or_sync_company


class CoreUserPrincipal:
    """Lightweight stand-in for ``request.user`` when a core-issued JWT is presented.

    accounts-soft does not keep its own user table. The JWT is verified against
    the Systemsoft core signing key (SIMPLE_JWT SIGNING_KEY), and the user id is
    taken from the token claims. Identity details and company context are
    extracted directly from the token claims and mapped to a local Company record.
    """

    def __init__(
        self,
        user_id,
        token=None,
        email='',
        name='',
        permissions=None,
        role='',
        company=None,
        core_org_id=None,
        org_ids=None,
        is_superuser=False,
    ):
        self.id = user_id
        self.pk = user_id
        self.token = token
        self.email = email
        self.name = name
        self.permissions = permissions or []
        self.role = role
        self.company = company
        self.company_id = getattr(company, 'id', None)
        self.core_org_id = core_org_id
        self.org_ids = org_ids or []
        self.is_authenticated = True
        self.is_anonymous = False
        self.is_superuser = is_superuser
        self.is_staff = is_superuser or role in ('admin', 'owner', 'Accounts Manager')

    def __str__(self):
        return self.email or str(self.id)


def _app_code():
    return getattr(settings, 'CORE_APP_CODE', 'accounts-soft')


class CoreJWTAuthentication(JWTAuthentication):
    """Validates a Systemsoft core JWT without touching the local auth.User table.

    As well as verifying the signature/expiry against core's signing key, it
    enforces that the user has been granted access to *this* application,
    attaches the granted permissions, and identifies the active company / organization.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token, request=request), validated_token

    def get_user(self, validated_token, request=None):
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

        app_access = validated_token.get('app_access') or []
        grants = [entry for entry in app_access if entry.get('app') == app_code]

        # Extract org ids the user has access to for this app
        org_ids = [entry.get('org') for entry in grants if entry.get('org') is not None]

        # Determine requested or active organization
        target_org = None
        if request is not None:
            raw_org = (
                request.headers.get('X-Organization-ID')
                or request.headers.get('X-Core-Org-Id')
                or getattr(getattr(request, 'query_params', None), 'get', lambda k: None)('organization_id')
                or getattr(getattr(request, 'query_params', None), 'get', lambda k: None)('core_org_id')
            )
            if raw_org and str(raw_org).isdigit():
                target_org = int(raw_org)

        # Match grant for the active org
        chosen_grant = None
        if target_org is not None:
            for g in grants:
                if g.get('org') == target_org:
                    chosen_grant = g
                    break
        if chosen_grant is None and grants:
            chosen_grant = grants[0]

        core_org_id = chosen_grant.get('org') if chosen_grant else (target_org or (org_ids[0] if org_ids else None))
        role = chosen_grant.get('role') if chosen_grant else ''
        permissions = list(chosen_grant.get('permissions') or []) if chosen_grant else []

        # If no specific grant but app_access is absent (legacy) or user is superuser, collect any permissions
        if not permissions and not chosen_grant:
            for entry in grants:
                permissions.extend(entry.get('permissions') or [])
            permissions = sorted(set(permissions))

        # Resolve or sync local company
        company = get_or_sync_company(core_org_id) if core_org_id else None

        email = validated_token.get('email', '')
        name = validated_token.get('name', '')
        is_superuser = bool(validated_token.get('is_superuser', False) or role in ('admin', 'owner'))

        return CoreUserPrincipal(
            user_id=user_id,
            token=str(validated_token),
            email=email,
            name=name,
            permissions=permissions,
            role=role,
            company=company,
            core_org_id=core_org_id,
            org_ids=org_ids,
            is_superuser=is_superuser,
        )
