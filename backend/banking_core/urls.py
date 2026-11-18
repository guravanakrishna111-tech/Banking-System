from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "Online Banking System API",
        "version": "1.0.0",
        "endpoints": {
            "admin": "/django-admin/",
            "accounts": "/api/accounts/",
            "transactions": "/api/transactions/",
            "analytics": "/api/analytics/"
        }
    })

urlpatterns = [
    path('', health_check, name='root-health'),
    path('api/', health_check, name='api-health'),
    path('django-admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
