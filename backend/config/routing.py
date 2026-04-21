from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from apps.combat.consumers import CombatConsumer


websocket_urlpatterns = [
    path('ws/combat/<uuid:tracker_id>/', CombatConsumer.as_asgi()),
]

# Configure the protocol router
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})