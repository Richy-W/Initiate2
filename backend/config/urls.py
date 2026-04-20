"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.common.health_views import health_live, health_ready, app_metrics

def debug_view(request):
    print(f"\n=== DEBUG REQUEST ===")
    print(f"Path: {request.path}")
    print(f"Method: {request.method}")
    print(f"User: {request.user}")
    print(f"Headers: {dict(request.headers)}")
    print(f"Body: {request.body}")
    print("===================\n")
    return None

urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI docs
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/v1/docs/swagger/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-swagger-ui"),
    path("api/v1/docs/redoc/", SpectacularRedocView.as_view(url_name="api-schema"), name="api-redoc"),
    # Health / monitoring
    path("api/v1/health/", health_live, name="health-live"),
    path("api/v1/health/ready/", health_ready, name="health-ready"),
    path("api/v1/metrics/", app_metrics, name="app-metrics"),
    # App endpoints
    path("api/v1/users/", include('apps.users.urls')),
    path("api/v1/content/", include('apps.content.urls')),
    path("api/v1/", include('apps.characters.urls')),
    path("api/v1/", include('apps.campaigns.urls')),
    path("api/v1/", include('apps.combat.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
