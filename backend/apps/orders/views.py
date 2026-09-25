from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order, OrderService
from .serializers import OrderSerializer, OrderServiceSerializer
from .services import client as external_orders

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
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 500)
        company = request.query_params.get('company', '')
        envelope = external_orders.list_orders(page=page, page_size=page_size, company=company)
        return Response(envelope)
