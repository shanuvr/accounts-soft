from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils.dateparse import parse_date
from users.scoping import scoped_queryset, get_or_sync_company
from users.permissions import write_permission
from orders.models import Order
from masters.models import PaymentMethod, PaymentStatus
from .models import Payment, PaymentSchedule
from .serializers import PaymentSerializer, PaymentScheduleSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.payments.record', 'accounts.payments.edit')]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return scoped_queryset(Payment.objects.all(), self.request.user, company_field='order__company')


class PaymentScheduleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.payments.record', 'accounts.payments.edit')]
    serializer_class = PaymentScheduleSerializer

    def get_queryset(self):
        return scoped_queryset(PaymentSchedule.objects.all(), self.request.user, company_field='order__company')


def sync_external_payment(data):
    """Core logic to sync a payment from an external system (like Leads) to Account Soft."""
    order_id = (data.get('order_id') or data.get('orderNo') or '').strip()
    if not order_id:
        return False, {'error': 'order_id is required'}, None

    amount_val = data.get('amount')
    try:
        from decimal import Decimal
        import re
        if isinstance(amount_val, str):
            amount_val = re.sub(r'[^\d.]', '', amount_val)
        amount = Decimal(str(amount_val))
    except (ValueError, TypeError, Exception):
        return False, {'error': 'valid amount is required'}, None

    date_str = (data.get('date') or data.get('payment_date') or '').strip()
    method_name = (data.get('method') or data.get('payment_method') or 'Bank Transfer').strip()
    reference = (data.get('reference') or data.get('reference_no') or '').strip()
    notes = (data.get('notes') or '').strip()
    received_by = (data.get('received_by') or data.get('receivedBy') or '').strip()
    customer = (data.get('customer') or data.get('company') or data.get('clientName') or '').strip()

    core_org_id = data.get('core_org_id')
    tenant_name = data.get('tenant_name') or data.get('tenant')
    company = None
    if core_org_id:
        company = get_or_sync_company(core_org_id, tenant_name)
    elif tenant_name:
        from users.models import Company
        company = Company.objects.filter(name__iexact=tenant_name).first()

    order_value = None
    if data.get('order_value') is not None:
        try:
            cleaned_val = re.sub(r'[^\d.]', '', str(data['order_value']))
            if cleaned_val:
                order_value = Decimal(cleaned_val)
        except Exception:
            pass

    p_date = parse_date(date_str)
    if not p_date:
        from django.utils.timezone import now

        p_date = now().date()

    with transaction.atomic():
        order = Order.objects.filter(order_id__iexact=order_id).first()
        if not order:
            initial_val = order_value or amount
            order = Order.objects.create(
                order_id=order_id,
                company=company,
                customer=customer,
                order_date=p_date,
                delivery_date=p_date,
                subtotal=initial_val,
                final_amount=initial_val,
                order_status='Pending',
                payment_status='Unpaid',
                sales_person=received_by,
            )
        else:
            updated = False
            if company and not order.company:
                order.company = company
                updated = True
            if customer and not order.customer:
                order.customer = customer
                updated = True
            if order_value and (not order.final_amount or order.final_amount <= amount):
                order.final_amount = order_value
                order.subtotal = order_value
                updated = True
            if updated:
                order.save()

        method_obj = PaymentMethod.objects.filter(name__iexact=method_name).first()
        if not method_obj and method_name:
            method_obj = PaymentMethod.objects.create(name=method_name)

        status_obj = (
            PaymentStatus.objects.filter(name__iexact='Received').first()
            or PaymentStatus.objects.filter(label__iexact='Received').first()
            or PaymentStatus.objects.first()
        )

        payment = Payment.objects.filter(
            order=order,
            amount=amount,
            date=p_date,
            reference=reference,
        ).first()
        created = False
        if not payment:
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
            created = True

        total_rec = sum((p.amount for p in order.payments.all()), Decimal('0'))
        order.total_received = total_rec
        final_amt = Decimal(str(order.final_amount or 0))
        order.pending_amount = max(Decimal('0'), final_amt - total_rec)
        if final_amt > 0:
            if total_rec >= final_amt:
                order.payment_status = 'Paid'
            elif total_rec > 0:
                order.payment_status = 'Partially Paid'
            else:
                order.payment_status = 'Unpaid'
        order.save()

    return True, {
        'status': 'success',
        'created': created,
        'payment_id': payment.id,
        'order_id': order.order_id,
        'amount': str(payment.amount),
        'message': 'Payment created' if created else 'Payment already exists',
    }, payment


class ExternalPaymentSyncView(APIView):
    """Receives payments recorded in Lead Soft (or external systems) and syncs them to Account Soft.

    Creates or attaches to an Order with ``order_id``, resolves PaymentMethod & PaymentStatus,
    associates with the correct Company/tenant, and creates the Payment record in Account Soft.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        ok, res_data, _ = sync_external_payment(request.data)
        if not ok:
            return Response(res_data, status=status.HTTP_400_BAD_REQUEST)
        is_created = res_data.get('created', False)
        return Response(res_data, status=status.HTTP_201_CREATED if is_created else status.HTTP_200_OK)

