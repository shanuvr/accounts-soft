from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.scoping import scoped_queryset
from users.permissions import require_permission
from .models import Order, OrderService
from .serializers import OrderSerializer, OrderServiceSerializer
from .services import ExternalOrdersUnavailable, client as external_orders

import time

EXTERNAL_FEED_TTL = 15
_external_caches = {}


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, require_permission('accounts.orders.view')]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return scoped_queryset(Order.objects.all(), self.request.user)

    def perform_create(self, serializer):
        serializer.save(company=getattr(self.request.user, 'company', None))


class OrderServiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, require_permission('accounts.orders.view')]
    serializer_class = OrderServiceSerializer

    def get_queryset(self):
        return scoped_queryset(OrderService.objects.all(), self.request.user, company_field='order__company')


class ExternalOrdersView(APIView):
    """Read-only orders feed proxied from the Lead Soft app.

    Forwards ``page`` / ``page_size`` / ``company`` query params and returns the
    external envelope unchanged, scoped to the authenticated user's company/tenant.
    """

    permission_classes = [IsAuthenticated, require_permission('accounts.orders.view')]

    def get(self, request):
        core_org_id = getattr(request.user, 'core_org_id', None)
        tenant_name = request.user.company.name if getattr(request.user, 'company', None) else ''
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 500)
        company = request.query_params.get('company', '')

        cache_key = f"{core_org_id}_{page}_{page_size}_{company}"
        now = time.time()
        cached = _external_caches.get(cache_key)
        if cached is not None and now - cached['at'] < EXTERNAL_FEED_TTL:
            return Response(cached['data'])

        try:
            envelope = external_orders.list_orders(
                page=page,
                page_size=page_size,
                company=company,
                core_org_id=core_org_id,
                tenant_name=tenant_name,
            )
        except ExternalOrdersUnavailable:
            _external_caches.pop(cache_key, None)
            return Response(
                {'detail': 'External orders feed (Lead Soft) is unreachable. Please try again later.', 'count': 0, 'page': 1, 'page_size': 500, 'results': []},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        _external_caches[cache_key] = {'at': now, 'data': envelope}
        return Response(envelope)
