# Account Soft

Order-to-Delivery and Financial Operations platform.

## Architecture

- **Backend**: Django 6.1 + Django REST Framework + JWT Authentication
- **Frontend**: React 19 + Vite + React Router + Tailwind CSS 4
- **Database (dedicated)**: Account Soft's own database — Account Soft masters
  (Payment Methods, Payment Terms, Taxes, Delivery Types, Statuses, UOM,
  Customer Types, Product/Service catalogue) plus all operational data.
- **Shared DB (SystemSoft)**: The shared core masters — Customers, Employees,
  Departments — are read/written in the **SystemSoft / Lead Soft** suite's
  database (`leadsdb`). **Customers, Employees, Departments do not live in
  Account Soft's dedicated DB.**
- **Default**: SQLite for both (local development); MySQL via `.env` when enabled.

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_masters
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

- `DB_NAME`, `DB_USER`, `DB_PASSWORD` — Account Soft's dedicated MySQL database
- `SHARED_DB_NAME`, `SHARED_DB_USER`, `SHARED_DB_PASSWORD` — SystemSoft `leadsdb`
  (shared core masters: Customers, Employees, Departments)
- `LEAD_SOFT_API_URL`, `LEAD_SOFT_API_TOKEN` — optional, for later order import

When `DB_NAME` is provided in `.env`, the backend uses MySQL for the dedicated
DB. Otherwise, SQLite (`backend/db.sqlite3`) is used. When `SHARED_DB_NAME` is
provided, the shared DB is MySQL; otherwise a local `shared.sqlite3` seeded by
`python manage.py seed_masters` is used.

## API Endpoints

All API routes are under `/api/v1/`:

- `/api/v1/auth/token/` — JWT token obtain
- `/api/v1/auth/token/refresh/` — JWT token refresh
- `/api/v1/users/profiles/` — User profiles
- `/api/v1/customers/` — Customer management
- `/api/v1/masters/` — Payment methods, terms, taxes, delivery types, statuses
- `/api/v1/orders/` — Orders and order services
- `/api/v1/services/` — Service items
- `/api/v1/ptda/` — PTDAs and templates
- `/api/v1/assignments/` — Assignments
- `/api/v1/deliveries/` — Deliveries
- `/api/v1/payments/` — Payments and schedules
- `/api/v1/documents/` — Documents
- `/api/v1/activity/` — Audit logs
- `/api/v1/reports/` — Report configurations

## Project Structure

```
backend/
  config/          # Django project config (settings, urls, database router)
  apps/
    users/         # User profiles (Django auth)
    customers/     # Core: Customers, Products, Employees, Departments, UOM
    masters/       # Account Soft: Payment methods, taxes, statuses, delivery types
    orders/        # Orders, Order Services
    services/      # Service items
    ptda/          # PTDAs and templates
    assignments/   # Assignments
    deliveries/    # Deliveries
    payments/      # Payments and schedules
    documents/     # Documents
    activity/      # Audit logs
    reports/       # Report configurations
frontend/
  src/
    api/           # Axios client, auth, data API functions
    store/         # Zustand-like external stores
    pages/         # React page components
    components/    # Reusable components
    data/          # Mock data (fallback)
```

## SystemSoft / Lead Soft Integration

The shared core masters — **Customers** (`transactions_clientdetail`),
**Employees** (`master_staff`) and **Departments/Branches** (`master_branch`) —
are owned by the SystemSoft / Lead Soft suite and are accessed by Account Soft
through its `leadsdb` database (configured as the `shared` database alias, with
a Django database router in `config/database_router.py`). Imported orders retain
their original Lead Soft reference.

## Default Credentials

- Email: `admin@accountsoft.com`
- Password: `admin123`
