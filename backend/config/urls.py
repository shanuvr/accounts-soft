from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import LoginTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include([
        path('token/', LoginTokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
    path('api/users/', include('users.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/masters/', include('masters.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/services/', include('services.urls')),
    path('api/ptda/', include('ptda.urls')),
    path('api/assignments/', include('assignments.urls')),
    path('api/deliveries/', include('deliveries.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/activity/', include('activity.urls')),
    path('api/reports/', include('reports.urls')),
]
