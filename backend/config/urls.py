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
    path("api/v1/users/", include('apps.users.urls')),
    path("api/v1/content/", include('apps.content.urls')),
    path("api/v1/", include('apps.characters.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
