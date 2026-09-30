from django.conf import settings
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Invoice
from .serializers import InvoiceSerializer
from .services import build_invoice_email


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status in ('Draft', 'Cancelled'):
            return Response({'detail': 'Only issued invoices can be sent by email.'}, status=status.HTTP_400_BAD_REQUEST)
        if invoice.sent_at:
            return Response({'detail': 'Invoice has already been sent.'}, status=status.HTTP_400_BAD_REQUEST)

        recipient = (request.data.get('recipient') or '').strip()
        if not recipient:
            return Response({'detail': 'A recipient email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        email = build_invoice_email(invoice, recipient, settings.DEFAULT_FROM_EMAIL)
        try:
            email.send()
        except Exception as exc:
            return Response(
                {'detail': f'Failed to send email: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        invoice.sent_at = timezone.now()
        invoice.save(update_fields=['sent_at'])
        return Response(self.get_serializer(invoice).data)