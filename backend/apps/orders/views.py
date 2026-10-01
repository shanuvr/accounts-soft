from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order, OrderService
from .serializers import OrderSerializer, OrderServiceSerializer
from .services import ExternalOrdersUnavailable, client as external_orders

import time

EXTERNAL_FEED_TTL = 15
_external_cache = {'at': 0.0, 'data': None}

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderServiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = OrderService.objects.all()
    serializer_class = OrderServiceSerializer

class ExternalOrdersView(APIView):
    """Read-only orders feed proxied from the Lead Soft app.

    Forwards ``page`` / ``page_size`` / ``company`` query params and returns the
    external envelope unchanged, so the frontend can render confirmed orders
    that originate in Lead Soft alongside locally-created Accounting orders.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = time.time()
        if _external_cache['data'] is not None and now - _external_cache['at'] < EXTERNAL_FEED_TTL:
            return Response(_external_cache['data'])
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 500)
        company = request.query_params.get('company', '')
        try:
            envelope = external_orders.list_orders(page=page, page_size=page_size, company=company)
        except ExternalOrdersUnavailable:
            _external_cache['at'] = 0.0
            _external_cache['data'] = None
            return Response(
                {'detail': 'External orders feed (Lead Soft) is unreachable. Please try again later.', 'count': 0, 'page': 1, 'page_size': 500, 'results': []},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        _external_cache['at'] = now
        _external_cache['data'] = envelope
        return Response(envelope)
