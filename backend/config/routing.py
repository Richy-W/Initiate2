"""
ASGI routing configuration for Django Channels.
Handles WebSocket connections and HTTP routes.
"""

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
# import apps.campaigns.routing
# import apps.combat.routing


# Define WebSocket URL patterns
websocket_urlpatterns = [
    # Campaign-related WebSockets (TODO: implement)
    # path("ws/campaigns/", include(apps.campaigns.routing.websocket_urlpatterns)),
    
    # Combat-related WebSockets (TODO: implement)
    # path("ws/combat/", include(apps.combat.routing.websocket_urlpatterns)),
    
    # General notifications (future)
    # path("ws/notifications/", apps.common.consumers.NotificationConsumer.as_asgi()),
]

# Configure the protocol router
application = ProtocolTypeRouter({
    # HTTP requests handled by Django
    "http": get_asgi_application(),
    
    # WebSocket requests handled by Channels
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})