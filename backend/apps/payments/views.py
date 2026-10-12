from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils.dateparse import parse_date
from users.permissions import write_permission
from orders.models import Order
from masters.models import PaymentMethod, PaymentStatus
from .models import Payment, PaymentSchedule
from .serializers import PaymentSerializer, PaymentScheduleSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.payments.record', 'accounts.payments.edit')]
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class PaymentScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.payments.record', 'accounts.payments.edit')]
    queryset = PaymentSchedule.objects.all()
    serializer_class = PaymentScheduleSerializer


class ExternalPaymentSyncView(APIView):
    """Receives payments recorded in Lead Soft (or external systems) and syncs them to Account Soft.

    Creates or attaches to an Order with ``order_id``, resolves PaymentMethod & PaymentStatus,
    and creates the Payment record in Account Soft.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        order_id = (data.get('order_id') or data.get('orderNo') or '').strip()
        if not order_id:
            return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        amount_val = data.get('amount')
        try:
            amount = float(amount_val)
        except (ValueError, TypeError):
            return Response({'error': 'valid amount is required'}, status=status.HTTP_400_BAD_REQUEST)

        date_str = (data.get('date') or data.get('payment_date') or '').strip()
        method_name = (data.get('method') or data.get('payment_method') or 'Bank Transfer').strip()
        reference = (data.get('reference') or data.get('reference_no') or '').strip()
        notes = (data.get('notes') or '').strip()
        received_by = (data.get('received_by') or data.get('receivedBy') or '').strip()
        customer = (data.get('customer') or data.get('company') or data.get('clientName') or '').strip()

        p_date = parse_date(date_str)
        if not p_date:
            from django.utils.timezone import now

            p_date = now().date()

        with transaction.atomic():
            # Get or create local order
            order = Order.objects.filter(order_id__iexact=order_id).first()
            if not order:
                order = Order.objects.create(
                    order_id=order_id,
                    customer=customer,
                    order_date=p_date,
                    delivery_date=p_date,
                    subtotal=amount,
                    final_amount=amount,
                    order_status='Pending',
                    payment_status='Unpaid',
                    sales_person=received_by,
                )
            elif customer and not order.customer:
                order.customer = customer
                order.save()

            # Resolve payment method
            method_obj = PaymentMethod.objects.filter(name__iexact=method_name).first()
            if not method_obj and method_name:
                method_obj = PaymentMethod.objects.create(name=method_name)

            # Resolve payment status (default Received)
            status_obj = (
                PaymentStatus.objects.filter(name__iexact='Received').first()
                or PaymentStatus.objects.filter(label__iexact='Received').first()
                or PaymentStatus.objects.first()
            )

            payment = Payment.objects.create(
                order=order,
                amount=amount,
                date=p_date,
                method=method_obj,
                status=status_obj,
                reference=reference,
                notes=notes,
                received_by=received_by,
            )

            # Recalculate total received and pending on order
            total_rec = sum(p.amount for p in order.payments.all())
            order.total_received = total_rec
            order.pending_amount = max(0, float(order.final_amount) - float(total_rec))
            if float(order.final_amount) > 0:
                if float(total_rec) >= float(order.final_amount):
                    order.payment_status = 'Paid'
                elif float(total_rec) > 0:
                    order.payment_status = 'Partially Paid'
            order.save()

        return Response(
            {
                'status': 'success',
                'payment_id': payment.id,
                'order_id': order.order_id,
                'amount': str(payment.amount),
                'message': 'Payment synced to Account Soft successfully',
            },
            status=status.HTTP_201_CREATED,
        )

