import os
import pymysql
pymysql.install_as_MySQLdb()
if pymysql.version_info < (2, 2, 1):
    pymysql.version_info = (2, 2, 1, 'final', 0)
from pathlib import Path
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

env = os.getenv("ENV", "prod")
print(f"Loading settings for environment: {env}")
load_dotenv(BASE_DIR.parent / f".env.{env}")

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-apseb*=qkk(ui0)y)g#l$q4dh3nq_cs#pzv(1(03o9g66!l^)!')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*'] if DEBUG else os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'django_filters',
    'corsheaders',
    # Local apps
    'users',
    'customers',
    'masters',
    'orders',
    'services',
    'ptda',
    'assignments',
    'deliveries',
    'payments',
    'invoices',
    'renewals',
    'documents',
    'activity',
    'reports',
    'transactions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Database Configuration ---
# Account Soft uses a single dedicated MySQL database (accounts_db). All
# operational data and the masters catalogue (Payment Methods, Taxes, Statuses,
# Categories, ...) live here. Shared core data (Customers, Employees,
# Departments) is NOT stored locally — it is accessed through the SystemSoft /
# Lead Soft API (see LEAD_SOFT_API_* below).
if os.getenv('DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
        },
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        },
    }

# --- Auth & API ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

CORS_ALLOW_ALL_ORIGINS = DEBUG

# --- Shared Data Integration (Lead Soft / SystemSoft) ---
# Account Soft reads shared/core data (customers, employees, products, etc.)
# from the external system via its API. Set the base URL and auth token in .env.
LEAD_SOFT_API_URL = os.getenv('LEAD_SOFT_API_URL', '')
LEAD_SOFT_API_TOKEN = os.getenv('LEAD_SOFT_API_TOKEN', '')
LEAD_SOFT_API_TIMEOUT = int(os.getenv('LEAD_SOFT_API_TIMEOUT', '15'))

# --- External Orders (Lead Soft) ---
# Account Soft's Orders section is fed by the read-only external orders feed on
# the Lead Soft app (GET /api/external/orders/). The base URL points at that
# endpoint and EXTERNAL_ORDERS_API_KEY holds the shared API key. When the URL or
# key is unset the external feed returns empty results (like the customers
# endpoints above).
EXTERNAL_ORDERS_API_URL = os.getenv('EXTERNAL_ORDERS_API_URL', '')
EXTERNAL_ORDERS_API_KEY = os.getenv('EXTERNAL_ORDERS_API_KEY', '')
EXTERNAL_ORDERS_API_TIMEOUT = int(os.getenv('EXTERNAL_ORDERS_API_TIMEOUT', '15'))

# --- Email (invoice sending) ---
# Django's MAILERS setting. When EMAIL_HOST is empty the console backend is
# used (dev prints emails to the server console instead of delivering).
# Configure EMAIL_HOST et al. in .env to deliver real mail via SMTP.
_EMAIL_HOST = os.getenv('EMAIL_HOST', '')
if _EMAIL_HOST:
    _MAILER_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    _MAILER_OPTIONS = {
        'host': _EMAIL_HOST,
        'port': int(os.getenv('EMAIL_PORT', '587')),
        'username': os.getenv('EMAIL_HOST_USER', ''),
        'password': os.getenv('EMAIL_HOST_PASSWORD', ''),
        'use_tls': os.getenv('EMAIL_USE_TLS', 'True') == 'True',
        'use_ssl': os.getenv('EMAIL_USE_SSL', 'False') == 'True',
    }
else:
    _MAILER_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    _MAILER_OPTIONS = {}

MAILERS = {
    'default': {
        'BACKEND': _MAILER_BACKEND,
        'OPTIONS': _MAILER_OPTIONS,
    },
}
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'info@programers.in')
