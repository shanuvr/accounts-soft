import os
import pymysql
pymysql.install_as_MySQLdb()
if pymysql.version_info < (2, 2, 1):
    pymysql.version_info = (2, 2, 1, 'final', 0)
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

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
    'documents',
    'activity',
    'reports',
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
# Account Soft uses a single database of its own. Shared/Core data (Customers,
# Employees, Products, etc.) is accessed through the Lead Soft / SystemSoft API,
# not through a second database.
# Default: SQLite (works immediately). When MySQL credentials are provided in
# .env, the MySQL database is used.
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

# --- Shared Database (SystemSoft / Lead Soft) ---
# Shared core masters (Customers, Employees, Departments) are owned by the
# SystemSoft suite (its MySQL `leadsdb`). Account Soft reads/writes them there.
# When SHARED_DB_NAME is provided, MySQL is used; otherwise a local
# shared.sqlite3 (seeded by `manage.py seed_masters`) is the fallback.
if os.getenv('SHARED_DB_NAME'):
    DATABASES['shared'] = {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('SHARED_DB_NAME'),
        'USER': os.getenv('SHARED_DB_USER', 'root'),
        'PASSWORD': os.getenv('SHARED_DB_PASSWORD', ''),
        'HOST': os.getenv('SHARED_DB_HOST', 'localhost'),
        'PORT': os.getenv('SHARED_DB_PORT', '3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
else:
    DATABASES['shared'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'shared.sqlite3',
    }

DATABASE_ROUTERS = ['config.database_router.AccountSoftRouter']

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

MAILERS = {
    'default': {'BACKEND': 'django.core.mail.backends.console.EmailBackend'},
}
