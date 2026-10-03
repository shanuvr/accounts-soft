# Account Soft

Order-to-Delivery and Financial Operations platform.

## Architecture

- **Backend**: Django 6.1 + Django REST Framework + JWT (tokens issued by `system_core`)
- **Frontend**: React 19 + Vite + React Router + Tailwind CSS 4
- **Database**: Account Soft's own dedicated MySQL database (accounts_db) — all
  operational data plus the masters catalogue (Payment Methods, Payment Terms,
  Taxes, Delivery Types, Statuses, Categories/Subcategories, UOM, Customer
  Types, Departments, Product/Service categories).
- **Shared core data (SystemSoft)**: Customers are NOT stored in accounts_db
  and NOT accessed via a second database connection. They are read/written
  through the **SystemSoft / Lead Soft API**
  (`LEAD_SOFT_API_URL` / `LEAD_SOFT_API_TOKEN`). The client scaffold lives in
  `backend/apps/customers/services.py`; when the API URL is unset the customer
  endpoints return empty results.
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
  for the shared core master (Customers)

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

## SystemSoft Core Integration

**SystemSoft core (`system_core`)** is the central identity/tenant service. It
owns organizations, users, memberships, employees and subscriptions. Account
Soft does **not** keep its own user/company/employee tables — those live in core.

### How it works

- **Login / Register**: proxied through Account Soft's own endpoints
  (`/api/auth/token/`, `/api/auth/register/`) to core. Core issues the JWTs;
  Account Soft never stores passwords or issues tokens itself.
- **Token validation**: Account Soft validates core-issued bearer JWTs against
  core's signing key (`CORE_JWT_SIGNING_KEY`, set as `SIMPLE_JWT.SIGNING_KEY`).
- **Organization context**: the current user's organizations/memberships are
  read from core (`GET /api/v1/organizations/`, `/api/v1/memberships/`). A
  user's first active membership is treated as the default organization and is
  used to scope core data reads. See `GET /api/auth/me/`.
- **Employees**: the employees master is owned by core. Account Soft's
  `/api/customers/employees/` endpoints proxy to core's `/api/v1/employees/`,
  scoped to the user's default organization (local `employees` table unused).
- **Departments**: still local — core exposes `department` as free-text on an
  employee, not as its own entity.

### Environment configuration

Add to `.env.dev` / `.env.prod`:

- `CORE_API_URL` — core base URL (e.g. `http://127.0.0.1:8001`)
- `CORE_SERVICE_TOKEN` — from `create_service_app --application accounts-soft`
- `CORE_JWT_SIGNING_KEY` — core's `SECRET_KEY` (its JWT signing key)

When `CORE_API_URL` is unset, auth and employee endpoints return a clear `5xx`
instead of empty results. Run core on its own port (both default to 8000).

### One-time setup on core

```
python manage.py seed_applications
python manage.py create_service_app --name "Account Soft" --application accounts-soft \
    --scopes employees:read,employees:write,employees:delete,organizations:read,memberships:read
```

After registering a company, an org owner/admin (or core superuser) must enable
the **accounts-soft subscription** for the organization in core — applications
cannot self-subscribe, so this step is manual.

## SystemSoft / Lead Soft Integration

The shared core master — **Customers** — is owned by the SystemSoft / Lead Soft
suite and is accessed by Account Soft through the SystemSoft API (client
scaffold in `backend/apps/customers/services.py`, endpoint under
`/v1/api/customers/`). No direct database connection is made to the SystemSoft
core. Imported orders retain their original Lead Soft reference.

## Default Credentials

- Email: `admin@accountsoft.com`
- Password: `admin123`



## Run

### Backend

```bash
$ENV:ENV = "dev"
cd ~\Desktop\Codebase\Systemsoft_suite\accounts-soft\backend
venv\Scripts\activate
python manage.py runserver
```

### Frontend

```bash
cd ~\Desktop\Codebase\Systemsoft_suite\accounts-soft\frontend
npm run dev
```