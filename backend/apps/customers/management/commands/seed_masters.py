from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed default master data into Account Soft databases (dedicated + shared fallback).'

    def handle(self, *args, **options):
        self.seed_dedicated()
        self.seed_shared()

    def seed_dedicated(self):
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

        self.stdout.write(self.style.SUCCESS('Seeded dedicated masters (default DB).'))

    def seed_shared(self):
        db = 'shared'
        engine = settings.DATABASES[db]['ENGINE']
        if 'sqlite' not in engine:
            self.stdout.write('Shared DB is MySQL (SystemSoft) — no seeding needed.')
            return
        self._ensure_shared_sqlite_tables(db)
        self.seed_shared_sqlite_fallback(db)

    def _ensure_shared_sqlite_tables(self, db):
        from django.db import connections

        with connections[db].cursor() as cursor:
            for statement in SHARED_SQLITE_DDL:
                cursor.execute(statement)

    def seed_shared_sqlite_fallback(self, db):
        from customers.models import Customer, Department, Employee

        departments = ['Operations', 'Development', 'Design', 'Support', 'Accounts', 'Sales', 'Administration']
        dept_map = {}
        for i, name in enumerate(departments, start=1):
            dept, _ = Department.objects.using(db).get_or_create(
                code=f'BR{i:02d}',
                defaults={'name': name},
            )
            dept_map[name] = dept

        employees = [
            ('ST001', 'Rahul Sharma', 'Operations'),
            ('ST002', 'Sneha Patil', 'Operations'),
            ('ST003', 'Amit Verma', 'Development'),
            ('ST004', 'Rohit Gupta', 'Development'),
            ('ST005', 'Priya Nair', 'Accounts'),
            ('ST006', 'Karan Malhotra', 'Sales'),
            ('ST007', 'Anita Desai', 'Sales'),
        ]
        for code, name, dept in employees:
            Employee.objects.using(db).get_or_create(
                employee_code=code,
                defaults={'name': name, 'department': dept_map.get(dept), 'email': f'{name.lower().split()[0]}@accountsoft.com'},
            )

        customers = [
            ('CUST-001', 'ABC Technologies Pvt Ltd', 'Rahul Sharma', '98765 43210', 'contact@abctech.com', 'Corporate', 'Active'),
            ('CUST-002', 'BlueSky Media', "Karan D'Souza", '98111 22233', 'hello@blueskymedia.in', 'SME', 'Active'),
            ('CUST-003', 'GreenLeaf Organics', 'Suresh Kumar', '97000 11122', 'contact@greenleaffoods.in', 'SME', 'Active'),
            ('CUST-004', 'Nova Systems', 'Vikram Rathore', '98220 44556', 'projects@novasystems.com', 'Corporate', 'Active'),
            ('CUST-005', 'Zenith Corp', 'Meera Iyer', '99887 66554', 'finance@zenithcorp.com', 'Corporate', 'Active'),
        ]
        for cid, company, contact, phone, email, category, status in customers:
            Customer.objects.using(db).get_or_create(
                customer_id=cid,
                defaults={
                    'name': company,
                    'contact_person': contact,
                    'phone': phone,
                    'email': email,
                    'customer_type': category,
                    'status': status,
                },
            )

        self.stdout.write(self.style.SUCCESS('Seeded shared masters fallback (shared.sqlite3).'))


SHARED_SQLITE_DDL = [
    """
    CREATE TABLE IF NOT EXISTS master_branch (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code VARCHAR(20) NOT NULL,
      name VARCHAR(50) NOT NULL,
      address VARCHAR(200) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS uniq_mb_code ON master_branch (code)",
    """
    CREATE TABLE IF NOT EXISTS master_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      role VARCHAR(120) NOT NULL DEFAULT '',
      mobile VARCHAR(20) NOT NULL DEFAULT '',
      email VARCHAR(254) NOT NULL DEFAULT '',
      branch_id BIGINT,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS transactions_clientdetail (
      id VARCHAR(20) PRIMARY KEY,
      order_no VARCHAR(30) NOT NULL DEFAULT '',
      lead_id VARCHAR(30) NOT NULL DEFAULT '',
      client_name VARCHAR(120) NOT NULL DEFAULT '',
      company VARCHAR(200) NOT NULL,
      mobile VARCHAR(20) NOT NULL DEFAULT '',
      email VARCHAR(254) NOT NULL DEFAULT '',
      category VARCHAR(100) NOT NULL DEFAULT '',
      accepted_date VARCHAR(30) NOT NULL DEFAULT '',
      collected_by VARCHAR(120) NOT NULL DEFAULT '',
      notes LONGTEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      client_token VARCHAR(64) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
    """,
]