from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from users.scoping import scoped_queryset
from users.permissions import write_permission
from .models import PTDATemplate, PTDA
from .serializers import PTDATemplateSerializer, PTDASerializer

class PTDATemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.ptda.create', 'accounts.ptda.edit')]
    queryset = PTDATemplate.objects.all()
    serializer_class = PTDATemplateSerializer

class PTDAViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, write_permission('accounts.ptda.create', 'accounts.ptda.edit')]
    serializer_class = PTDASerializer

    def get_queryset(self):
        return scoped_queryset(PTDA.objects.all(), self.request.user, company_field='order_service__order__company')


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.utils import timezone
from assignments.models import Assignment


class ExternalPtdRequestsView(APIView):
    """
    Exposes assigned PTDs from Account Soft to external systems (Project Soft).
    Returns pending, accepted, and rejected PTDs.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        results = []
        ptdas = PTDA.objects.select_related('order_service__order', 'template').order_by('-id')
        seen_svcs = set()
        for ptd in ptdas:
            svc = ptd.order_service
            if not svc or svc.id in seen_svcs:
                continue
            seen_svcs.add(svc.id)
            order = svc.order
            if not order:
                continue

            assignment = Assignment.objects.filter(order_service=svc).first()
            if not assignment:
                continue

            raw_status = (assignment.status or ptd.status or 'Pending').lower()
            if raw_status in ['pending', 'assigned']:
                proj_status = 'pending'
                acco_status = 'Pending'
            elif raw_status in ['rejected', 'cancelled']:
                proj_status = 'rejected'
                acco_status = 'Rejected'
            else:
                proj_status = 'not-started'
                acco_status = 'Accepted'

            ptd_data = ptd.data or {}
            rejection_remark = (
                ptd_data.get('_rejection_remark', '')
                or (assignment.description if 'Rejected:' in (assignment.description or '') else '')
            )

            results.append({
                'id': f"ptd-acco-{ptd.id}",
                'ptdId': ptd.id,
                'assignmentId': assignment.id,
                'orderId': order.order_id,
                'ref': f"PTD-{order.order_id}",
                'name': svc.service_name,
                'title': ptd.title,
                'client': order.customer or '',
                'description': ptd.title or svc.description or f"{svc.service_name} technical specifications",
                'template': ptd.template_name or (ptd.template.name if ptd.template else 'generic'),
                'data': ptd_data,
                'estimatedHours': float(assignment.allocated_hours or 0),
                'allocatedHours': float(assignment.allocated_hours or 0),
                'usedHours': 0,
                'progress': float(assignment.progress or 0),
                'deadline': assignment.due_date.isoformat() if assignment.due_date else (order.delivery_date.isoformat() if order.delivery_date else ''),
                'receivedDate': assignment.start_date.isoformat() if assignment.start_date else ptd.created_at.date().isoformat(),
                'status': proj_status,
                'decisionStatus': acco_status,
                'source': 'Account Soft',
                'requestedBy': f"Accounts Dept ({assignment.employee or 'Operations'})",
                'notes': f"Order {order.order_id} ({order.customer}). PTD: {ptd.title}",
                'rejectionRemark': rejection_remark,
                'billable': ptd.billable,
                'price': float(ptd.price or 0),
            })
        return Response(results)


class ExternalPtdDecisionView(APIView):
    """
    Receives PM decisions from Project Soft: accept, reject, or reopen.
    Updates PTDA and Assignment statuses in Account Soft.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ptd_id = request.data.get('ptdId')
        order_id = request.data.get('orderId')
        action = request.data.get('action')
        remark = (request.data.get('remark') or '').strip()
        decided_by = request.data.get('decidedBy', 'Project Manager')

        if not action or action not in ['accept', 'reject', 'reopen']:
            return Response({'error': 'Invalid action. Must be accept, reject, or reopen.'}, status=status.HTTP_400_BAD_REQUEST)

        ptd = None
        if ptd_id:
            clean_id = str(ptd_id).replace('ptd-acco-', '')
            if clean_id.isdigit():
                ptd = PTDA.objects.filter(id=int(clean_id)).first()

        if not ptd and order_id:
            ptd = PTDA.objects.filter(order_service__order__order_id=order_id).first()

        if not ptd:
            return Response({'error': 'PTD not found.'}, status=status.HTTP_404_NOT_FOUND)

        svc = ptd.order_service
        assignment = Assignment.objects.filter(order_service=svc).first()
        ptd_data = dict(ptd.data or {})

        if action == 'accept':
            ptd.status = 'Accepted'
            ptd_data['_rejection_remark'] = ''
            ptd_data['_accepted_by'] = decided_by
            ptd_data['_accepted_date'] = timezone.now().date().isoformat()
            ptd.data = ptd_data
            ptd.save(update_fields=['status', 'data', 'updated_at'])

            if assignment:
                assignment.status = 'Accepted'
                assignment.save(update_fields=['status', 'updated_at'])

        elif action == 'reject':
            ptd.status = 'Rejected'
            ptd_data['_rejection_remark'] = remark or 'No remark provided.'
            ptd_data['_rejected_by'] = decided_by
            ptd_data['_rejected_date'] = timezone.now().date().isoformat()
            ptd.data = ptd_data
            ptd.save(update_fields=['status', 'data', 'updated_at'])

            if assignment:
                assignment.status = 'Rejected'
                if remark:
                    assignment.description = f"Rejected: {remark}"
                assignment.save(update_fields=['status', 'description', 'updated_at'])

        elif action == 'reopen':
            ptd.status = 'Pending'
            ptd_data.pop('_rejection_remark', None)
            ptd.data = ptd_data
            ptd.save(update_fields=['status', 'data', 'updated_at'])

            if assignment:
                assignment.status = 'Pending'
                assignment.save(update_fields=['status', 'updated_at'])

        return Response({
            'ok': True,
            'ptdId': ptd.id,
            'status': ptd.status,
            'assignmentStatus': assignment.status if assignment else None
        })
