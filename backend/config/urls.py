from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import LoginTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include([
        path('token/', LoginTokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/customers/', include('customers.urls')),
    path('api/v1/masters/', include('masters.urls')),
    path('api/v1/orders/', include('orders.urls')),
    path('api/v1/services/', include('services.urls')),
    path('api/v1/ptda/', include('ptda.urls')),
    path('api/v1/assignments/', include('assignments.urls')),
    path('api/v1/deliveries/', include('deliveries.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/documents/', include('documents.urls')),
    path('api/v1/activity/', include('activity.urls')),
    path('api/v1/reports/', include('reports.urls')),
]
