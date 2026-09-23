# Account Soft

Order-to-Delivery and Financial Operations platform.

## Architecture

- **Backend**: Django 6.1 + Django REST Framework + JWT Authentication
- **Frontend**: React 19 + Vite + React Router + Tailwind CSS 4
- **Database**: Account Soft's own dedicated MySQL database (accounts_db) — all
  operational data plus the masters catalogue (Payment Methods, Payment Terms,
  Taxes, Delivery Types, Statuses, Categories/Subcategories, UOM, Customer
  Types, Product/Service categories).
- **Shared core data (SystemSoft)**: Customers, Employees and Departments are
  NOT stored in accounts_db and NOT accessed via a second database connection.
  They are read/written through the **SystemSoft / Lead Soft API**
  (`LEAD_SOFT_API_URL` / `LEAD_SOFT_API_TOKEN`). The client scaffold lives in
  `backend/apps/customers/services.py`; when the API URL is unset the
  customer/department/employee endpoints return empty results.
- Default: SQLite for local development when `DB_NAME` is not set in `.env`;
  MySQL when enabled.

## Prerequisites

`Mysql 8.4 LTS`

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
- `LEAD_SOFT_API_URL`, `LEAD_SOFT_API_TOKEN` — SystemSoft / Lead Soft API used
  for the shared core masters (Customers, Employees, Departments)

When `DB_NAME` is provided in `.env`, the backend uses MySQL for the database.
Otherwise, SQLite (`backend/db.sqlite3`) is used.

## API Endpoints

The frontend calls the API under `/v1/api/` (Django is mounted at `/v1/` and
serves bare `api/` routes), so in production the server must expose:

- `/v1/api/auth/token/` — JWT token obtain
- `/v1/api/auth/token/refresh/` — JWT token refresh
- `/v1/api/users/profiles/` — User profiles
- `/v1/api/customers/` — Customer management
- `/v1/api/masters/` — Payment methods, terms, taxes, delivery types, statuses
- `/v1/api/orders/` — Orders and order services
- `/v1/api/services/` — Service items
- `/v1/api/ptda/` — PTDAs and templates
- `/v1/api/assignments/` — Assignments
- `/v1/api/deliveries/` — Deliveries
- `/v1/api/payments/` — Payments and schedules
- `/v1/api/documents/` — Documents
- `/v1/api/activity/` — Audit logs
- `/v1/api/reports/` — Report configurations

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

The shared core masters — **Customers**, **Employees** and
**Departments/Branches** — are owned by the SystemSoft / Lead Soft suite and are
accessed by Account Soft through the SystemSoft API (client scaffold in
`backend/apps/customers/services.py`, endpoints under `/v1/api/customers/`,
`/v1/api/customers/employees/` and `/v1/api/customers/departments/`). No direct
database connection is made to the SystemSoft core. Imported orders retain their
original Lead Soft reference.

## Default Credentials

- Email: `admin@accountsoft.com`
- Password: `admin123`



## Run

### Backend

```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm run dev
```