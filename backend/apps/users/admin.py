from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Company, Profile

admin.site.register(Profile)
admin.site.register(Company)