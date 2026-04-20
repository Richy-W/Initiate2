"""
Base WebSocket consumers for Django Channels.

Only base classes belong here. Domain-specific consumers live in their
respective app packages per the constitution (§ Real-Time Communication):
  - campaign session updates → apps.campaigns.consumers.CampaignConsumer
  - combat/initiative tracking → apps.combat.consumers.CombatConsumer
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class BaseAuthenticatedConsumer(AsyncWebsocketConsumer):
    """
    Base consumer that requires authentication and provides common functionality.
    """
    
    async def connect(self):
        """Accept connection only for authenticated users."""
        if self.scope['user'] == AnonymousUser():
            await self.close()
            return
        
        await self.accept()
        await self.on_connect()
    
    async def disconnect(self, close_code):
        """Handle disconnect."""
        await self.on_disconnect(close_code)
    
    async def receive(self, text_data):
        """Handle received WebSocket data."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type:
                handler = getattr(self, f'handle_{message_type}', None)
                if handler:
                    await handler(data)
                else:
                    await self.send_error(f'Unknown message type: {message_type}')
            else:
                await self.send_error('Message type is required')
                
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON data')
        except Exception as e:
            await self.send_error(f'Error processing message: {str(e)}')
    
    async def send_message(self, message_type, data=None):
        """Send a message to the WebSocket."""
        message = {
            'type': message_type,
            'data': data or {},
            'timestamp': self.get_timestamp()
        }
        await self.send(text_data=json.dumps(message))
    
    async def send_error(self, error_message):
        """Send an error message to the WebSocket."""
        await self.send_message('error', {'message': error_message})
    
    def get_timestamp(self):
        """Get current timestamp."""
        from datetime import datetime
        return datetime.utcnow().isoformat()
    
    # Override these methods in subclasses
    async def on_connect(self):
        """Called after successful connection."""
        pass

    async def on_disconnect(self, close_code):
        """Called when connection is closed."""
        pass
