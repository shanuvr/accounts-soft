"""Multi-tenant query scoping helper for accounts-soft.

Ensures that viewsets and queries filter objects so that each user sees only data
belonging to their company/tenant.
"""
import logging
from django.db.models import Q

logger = logging.getLogger(__name__)


def get_or_sync_company(core_org_id, org_name=None):
    """Find or create a local Company mapped to a SystemCore organization id."""
    if not core_org_id:
        return None
    from users.models import Company

    company = Company.objects.filter(core_org_id=core_org_id).first()
    if company is None and org_name:
        company = Company.objects.filter(name__iexact=org_name).first()
        if company and company.core_org_id is None:
            company.core_org_id = core_org_id
            company.save(update_fields=['core_org_id'])
    if company is None:
        name = org_name or f'Company {core_org_id}'
        existing = Company.objects.filter(name=name).first()
        if existing:
            if existing.core_org_id is None:
                existing.core_org_id = core_org_id
                existing.save(update_fields=['core_org_id'])
            company = existing
        else:
            try:
                company = Company.objects.create(core_org_id=core_org_id, name=name)
            except Exception as exc:
                logger.warning('Could not create Company for org %s: %s', core_org_id, exc)
                company = Company.objects.filter(core_org_id=core_org_id).first() or Company.objects.filter(name=name).first()
    return company


def scoped_queryset(qs, user, company_field='company'):
    """Scope queryset to the user's company.

    - Authenticated users with a resolved company see records matching their company.
    - Superusers with no specific company filter see all records.
    - Anonymous users or users with no tenant access see an empty queryset.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return qs.none()

    company = getattr(user, 'company', None)
    if company is not None:
        return qs.filter(**{company_field: company})

    core_org_id = getattr(user, 'core_org_id', None)
    if core_org_id is not None:
        return qs.filter(**{f'{company_field}__core_org_id': core_org_id})

    if getattr(user, 'is_superuser', False):
        return qs

    return qs.none()
