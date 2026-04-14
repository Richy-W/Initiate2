"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import get_default_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Import Django first
django_asgi_app = get_asgi_application()

# Now import the routing which may use Django models
from .routing import application

# Use the custom routing application instead of the default Django ASGI app
