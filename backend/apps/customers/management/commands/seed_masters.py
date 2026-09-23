from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed default master data into the Account Soft database.'

    def handle(self, *args, **options):
        self.seed_masters()

    def seed_masters(self):
        from customers.models import CustomerType, Product, ProductCategory, UOM
        from masters.models import (
            AssignmentStatus,
            Category,
            DeliveryStatus,
            DeliveryType,
            OrderStatus,
            PTDAStatus,
            PaymentMethod,
            PaymentStatus,
            PaymentTerm,
            Subcategory,
            Tax,
        )

        for name in ['Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Card', 'Net Banking', 'Other']:
            PaymentMethod.objects.get_or_create(name=name)

        for name, days in [
            ('Full Advance', 0),
            ('50% Advance / 50% Delivery', 0),
            ('30/40/30', 0),
            ('Monthly', 0),
            ('30 Days Credit', 30),
        ]:
            PaymentTerm.objects.get_or_create(name=name, defaults={'days_due': days})

        for name, rate, tax_type in [
            ('GST 18%', '18.00', 'CGST + SGST'),
            ('GST 12%', '12.00', 'CGST + SGST'),
            ('GST 5%', '5.00', 'CGST + SGST'),
            ('IGST 18%', '18.00', 'IGST'),
            ('IGST 12%', '12.00', 'IGST'),
            ('Tax Exempt', '0.00', 'Exempt'),
        ]:
            Tax.objects.get_or_create(name=name, defaults={'rate': rate, 'type': tax_type})

        for name in ['One-Time', 'Recurring', 'Milestone', 'Subscription', 'Annual Renewal']:
            DeliveryType.objects.get_or_create(name=name)

        statuses = {
            OrderStatus: ['New', 'Under Review', 'In Progress', 'Partially Delivered', 'Delivered', 'Completed', 'On Hold', 'Cancelled'],
            PTDAStatus: ['Not Created', 'Draft', 'In Progress', 'Completed', 'Approved', 'Archived'],
            AssignmentStatus: ['Not Started', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Overdue'],
            DeliveryStatus: ['Not Started', 'In Progress', 'Ready for Delivery', 'Delivered', 'Partially Delivered', 'Overdue', 'Cancelled'],
            PaymentStatus: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded', 'Partially Refunded'],
        }
        for model, names in statuses.items():
            for name in names:
                model.objects.get_or_create(name=name, defaults={'label': name})

        for name, code in [('Unit', 'UNT'), ('Day', 'DAY'), ('Month', 'MON'), ('Year', 'YR'), ('License', 'LIC'), ('Project', 'PRJ'), ('Hour', 'HR')]:
            UOM.objects.get_or_create(name=name, defaults={'code': code})

        for name in ['Individual', 'Business', 'Corporate', 'Government', 'Partner']:
            CustomerType.objects.get_or_create(name=name)

        category_data = [
            ('Domain', 'Domain registration and management services'),
            ('Hosting', 'Web hosting and server services'),
            ('SSL', 'SSL certificates and security'),
            ('Development', 'Website and application development'),
            ('Server', 'Server provisioning and management'),
            ('Maintenance', 'Ongoing maintenance and support'),
            ('Email', 'Email hosting and services'),
            ('Hardware', 'Hardware supply and setup'),
            ('Training', 'Training and onboarding'),
        ]
        for name, desc in category_data:
            ProductCategory.objects.get_or_create(name=name, defaults={'description': desc})

        category_sub_data = [
            ('Administrative', 'Office & General Overhead Expenses', [
                ('Office Stationery', 'Printing paper, files, pens'),
                ('Pantry & Catering', 'Coffee, tea, snacks'),
            ]),
            ('Operating Expenses', 'Core Operations & Field Logistics', [
                ('Fuel & Transit', 'Vehicle fuel & travel fares'),
                ('Hardware Repair', 'UPS, AC & Equipment maintenance'),
            ]),
            ('IT & Infrastructure', 'Software, Broadband & Cloud Infrastructure', [
                ('Internet & Phone', 'Fiber broadband & phone lines'),
                ('Software Subscription', 'SaaS tools & cloud hosting'),
            ]),
            ('Sales & Marketing', 'Advertising, Events & Client Outreach', []),
            ('Human Resources', 'Payroll, Training & Recruitment', []),
            ('Miscellaneous', 'General & Contingency Expenses', [
                ('Sundry Expenses', 'Minor unclassified expenses'),
                ('Guest Refreshment & Snacks', 'Tea, coffee & snacks for visitors'),
                ('General Maintenance', 'Small office repairs & maintenance'),
                ('Other Expenses', 'Miscellaneous petty cash expenses'),
            ]),
        ]
        for cat_name, cat_desc, sub_list in category_sub_data:
            cat, _ = Category.objects.get_or_create(name=cat_name, defaults={'description': cat_desc})
            for sub_name, sub_desc in sub_list:
                Subcategory.objects.get_or_create(category=cat, name=sub_name, defaults={'description': sub_desc})

        product_data = [
            ('Domain Registration', 'Domain', 1500, True, 'domain', 2),
            ('Web Hosting', 'Hosting', 8000, True, 'hosting', 4),
            ('SSL Certificate', 'SSL', 2500, True, 'ssl', 1.5),
            ('Website Development', 'Development', 110000, True, 'website', 100),
            ('Maintenance', 'Maintenance', 3500, False, '', 10),
        ]
        for index, (name, category, price, requires_ptda, template, hours) in enumerate(product_data, start=1):
            cat = ProductCategory.objects.filter(name=category).first()
            Product.objects.get_or_create(
                name=name,
                defaults={
                    'code': f'PRD{index:03d}',
                    'category': cat,
                    'default_price': price,
                    'requires_ptda': requires_ptda,
                    'ptda_template': template,
                    'default_hours': hours,
                },
            )

        self.stdout.write(self.style.SUCCESS('Seeded masters and product catalogue.'))