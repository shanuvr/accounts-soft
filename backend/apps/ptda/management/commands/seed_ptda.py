from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed PTD templates plus demo orders, services and PTDs for the PTD module.'

    def handle(self, *args, **options):
        self.seed_templates()
        self.seed_orders()

    def seed_templates(self):
        from ptda.models import PTDATemplate

        common = [
            {'key': 'technicalOwner', 'label': 'Technical Owner', 'type': 'text'},
            {'key': 'notes', 'label': 'Notes', 'type': 'textarea'},
        ]

        templates = {
            'domain': ('Domain Information', [
                {'key': 'domainName', 'label': 'Domain Name', 'type': 'text', 'required': True, 'placeholder': 'example.com'},
                {'key': 'extension', 'label': 'Domain Extension', 'type': 'select', 'options': ['.com', '.in', '.co.in', '.net', '.org', '.io']},
                {'key': 'registrar', 'label': 'Registrar', 'type': 'text'},
                {'key': 'registrationDate', 'label': 'Registration Date', 'type': 'date'},
                {'key': 'expiryDate', 'label': 'Expiry Date', 'type': 'date'},
                {'key': 'autoRenewal', 'label': 'Auto Renewal', 'type': 'select', 'options': ['Yes', 'No']},
                {'key': 'dnsProvider', 'label': 'DNS Provider', 'type': 'text'},
                {'key': 'nameservers', 'label': 'Nameservers', 'type': 'textarea'},
                *common,
            ]),
            'hosting': ('Hosting Information', [
                {'key': 'hostingProvider', 'label': 'Hosting Provider', 'type': 'text'},
                {'key': 'hostingPlan', 'label': 'Hosting Plan', 'type': 'text'},
                {'key': 'serverName', 'label': 'Server Name', 'type': 'text'},
                {'key': 'ipAddress', 'label': 'IP Address', 'type': 'text'},
                {'key': 'os', 'label': 'Operating System', 'type': 'select', 'options': ['Linux', 'Windows', 'cPanel/Apache', 'Other']},
                {'key': 'storage', 'label': 'Storage', 'type': 'text'},
                {'key': 'bandwidth', 'label': 'Bandwidth', 'type': 'text'},
                {'key': 'startDate', 'label': 'Start Date', 'type': 'date'},
                {'key': 'expiryDate', 'label': 'Expiry Date', 'type': 'date'},
                *common,
            ]),
            'ssl': ('SSL Information', [
                {'key': 'certType', 'label': 'Certificate Type', 'type': 'select', 'options': ['DV', 'OV', 'EV', 'Wildcard']},
                {'key': 'certProvider', 'label': 'Certificate Provider', 'type': 'text'},
                {'key': 'certDomain', 'label': 'Domain', 'type': 'text'},
                {'key': 'certId', 'label': 'Certificate ID', 'type': 'text'},
                {'key': 'issueDate', 'label': 'Issue Date', 'type': 'date'},
                {'key': 'expiryDate', 'label': 'Expiry Date', 'type': 'date'},
                {'key': 'installStatus', 'label': 'Installation Status', 'type': 'select', 'options': ['Not Installed', 'Pending', 'Installed']},
                *common,
            ]),
            'website': ('Project Information', [
                {'key': 'projectName', 'label': 'Project Name', 'type': 'text', 'required': True},
                {'key': 'projectType', 'label': 'Project Type', 'type': 'select', 'options': ['Corporate', 'E-commerce', 'Portal', 'Web App', 'Landing Page']},
                {'key': 'frontend', 'label': 'Frontend Technology', 'type': 'text'},
                {'key': 'backend', 'label': 'Backend Technology', 'type': 'text'},
                {'key': 'repo', 'label': 'Repository', 'type': 'text'},
                {'key': 'deploymentUrl', 'label': 'Deployment URL', 'type': 'text'},
                {'key': 'projectStart', 'label': 'Project Start Date', 'type': 'date'},
                {'key': 'expectedCompletion', 'label': 'Expected Completion Date', 'type': 'date'},
                *common,
            ]),
            'maintenance': ('Maintenance Information', [
                {'key': 'service', 'label': 'Project / Service', 'type': 'text'},
                {'key': 'maintenanceType', 'label': 'Maintenance Type', 'type': 'text'},
                {'key': 'startDate', 'label': 'Start Date', 'type': 'date'},
                {'key': 'endDate', 'label': 'End Date', 'type': 'date'},
                {'key': 'sla', 'label': 'SLA', 'type': 'text'},
                {'key': 'supportHours', 'label': 'Support Hours', 'type': 'text'},
                {'key': 'renewalDate', 'label': 'Renewal Date', 'type': 'date'},
                *common,
            ]),
            'generic': ('Project Information', [
                {'key': 'projectName', 'label': 'Project Name', 'type': 'text'},
                {'key': 'technicalOwner', 'label': 'Technical Owner', 'type': 'text'},
                {'key': 'startDate', 'label': 'Start Date', 'type': 'date'},
                {'key': 'targetDate', 'label': 'Target Completion Date', 'type': 'date'},
                {'key': 'priority', 'label': 'Priority', 'type': 'select', 'options': ['Low', 'Normal', 'High', 'Urgent']},
                {'key': 'notes', 'label': 'Notes', 'type': 'textarea'},
            ]),
        }

        for name, (title, fields) in templates.items():
            PTDATemplate.objects.update_or_create(
                name=name,
                defaults={
                    'service_type': name,
                    'fields_config': fields,
                    'is_active': True,
                },
            )
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(templates)} PTD templates.'))

    def seed_orders(self):
        try:
            self.seed_orders_inner()
        except Exception as exc:  # noqa: BLE001 - tolerate environment divergence (e.g. extra DB columns)
            self.stdout.write(self.style.WARNING(f'Skipped demo order/PTD seeding: {exc}'))

    def seed_orders_inner(self):
        from orders.models import Order, OrderService
        from ptda.models import PTDA, PTDATemplate

        today = timezone.localdate().isoformat()

        orders = [
            ('ORD-1024', 'ABC Technologies Pvt Ltd', 'Ongoing', 'Partially Paid'),
            ('ORD-1021', 'Nova Systems', 'Ongoing', 'Partially Paid'),
        ]
        order_map = {}
        for order_id, customer, order_status, payment_status in orders:
            order, created = Order.objects.get_or_create(
                order_id=order_id,
                defaults={
                    'customer': customer,
                    'order_date': today,
                    'delivery_date': today,
                    'order_status': order_status,
                    'payment_status': payment_status,
                },
            )
            order_map[order_id] = order

        services = [
            ('ORD-1024', 'Domain Registration', 'domain', 1500),
            ('ORD-1021', 'Web Hosting', 'hosting', 8000),
        ]
        service_map = {}
        for order_id, service_name, template_name, price in services:
            service, _ = OrderService.objects.get_or_create(
                order=order_map[order_id],
                service_name=service_name,
                defaults={
                    'unit_price': price,
                    'quantity': 1,
                    'subtotal': price,
                    'requires_ptda': True,
                },
            )
            service_map[(order_id, service_name)] = service

        ptds = [
            {
                'order': 'ORD-1024',
                'service': 'Domain Registration',
                'template': 'domain',
                'status': 'Completed',
                'billable': True,
                'price': 1500,
                'data': {
                    'domainName': 'abctechnologies.in',
                    'extension': '.in',
                    'registrar': 'GoDaddy',
                    'registrationDate': '2026-09-05',
                    'expiryDate': '2027-09-05',
                    'autoRenewal': 'Yes',
                    'dnsProvider': 'Cloudflare',
                    'nameservers': 'ns1.cloudflare.com\nns2.cloudflare.com',
                    'technicalOwner': 'Rahul Sharma',
                    'notes': 'Primary domain for the corporate website.',
                },
            },
            {
                'order': 'ORD-1021',
                'service': 'Web Hosting',
                'template': 'hosting',
                'status': 'Draft',
                'billable': True,
                'price': 8000,
                'data': {
                    'hostingProvider': 'Bluehost',
                    'hostingPlan': 'Business Pro',
                    'serverName': 'nova-prod-01',
                    'ipAddress': '103.21.58.41',
                    'os': 'Linux',
                    'storage': '100 GB',
                    'bandwidth': 'Unlimited',
                    'startDate': '2026-08-25',
                    'expiryDate': '2027-08-25',
                    'technicalOwner': 'Amit Verma',
                    'notes': '',
                },
            },
        ]

        created = 0
        for ptd in ptds:
            service = service_map[(ptd['order'], ptd['service'])]
            template = PTDATemplate.objects.filter(name=ptd['template']).first()
            _, was_created = PTDA.objects.get_or_create(
                order_service=service,
                defaults={
                    'template': template,
                    'title': f"{ptd['service']} ({ptd['template']})",
                    'status': ptd['status'],
                    'data': ptd['data'],
                    'billable': ptd['billable'],
                    'price': ptd['price'],
                },
            )
            created += 1 if was_created else 0

        self.stdout.write(self.style.SUCCESS(f'Seeded {len(orders)} orders and {len(services)} services.'))
        self.stdout.write(self.style.SUCCESS(f'Seeded {created} demo PTDs.'))