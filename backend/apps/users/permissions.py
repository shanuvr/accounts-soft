"""Permission enforcement for accounts-soft.

Permissions are granted centrally in SystemSoft core and delivered inside the
core-issued JWT as ``app_access`` claims. ``CoreJWTAuthentication`` attaches the
relevant list to ``request.user.permissions``; the helpers here enforce it.
"""
from rest_framework.permissions import SAFE_METHODS, BasePermission


def user_permissions(user):
    return set(getattr(user, 'permissions', None) or [])


def has_permission(user, *keys):
    """Return True if the user holds at least one of ``keys``.

    Superusers and users with no permission data attached (e.g. tokens minted
    before the central catalog existed) are allowed, so the app keeps working
    for legacy identities.
    """
    if getattr(user, 'is_superuser', False):
        return True
    perms = user_permissions(user)
    if not perms:
        return True
    return any(key in perms for key in keys)


def require_permission(*keys):
    """DRF permission factory enforcing at least one of ``keys``."""

    class _RequirePermission(BasePermission):
        message = 'You do not have permission to perform this action.'

        def has_permission(self, request, view):
            return has_permission(request.user, *keys)

    return _RequirePermission


def write_permission(*keys):
    """Read is open to any authenticated user; writes require at least one key."""

    class _WritePermission(BasePermission):
        message = 'You do not have permission to perform this action.'

        def has_permission(self, request, view):
            if request.method in SAFE_METHODS:
                return True
            return has_permission(request.user, *keys)

    return _WritePermission
