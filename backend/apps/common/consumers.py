"""
Base WebSocket consumers for Django Channels.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
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


class CampaignConsumer(BaseAuthenticatedConsumer):
    """
    WebSocket consumer for campaign-related real-time updates.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.campaign_id = None
        self.campaign_group = None
    
    async def on_connect(self):
        """Join campaign group for real-time updates."""
        self.campaign_id = self.scope['url_route']['kwargs']['campaign_id']
        self.campaign_group = f'campaign_{self.campaign_id}'
        
        # Check if user has access to this campaign
        if await self.can_access_campaign():
            await self.channel_layer.group_add(
                self.campaign_group,
                self.channel_name
            )
            await self.send_message('connected', {'campaign_id': self.campaign_id})
        else:
            await self.send_error('Access denied to campaign')
            await self.close()
    
    async def on_disconnect(self, close_code):
        """Leave campaign group."""
        if self.campaign_group:
            await self.channel_layer.group_discard(
                self.campaign_group,
                self.channel_name
            )
    
    @database_sync_to_async
    def can_access_campaign(self):
        """Check if user can access the campaign."""
        from apps.campaigns.models import Campaign
        try:
            campaign = Campaign.objects.get(id=self.campaign_id)
            user = self.scope['user']
            return (campaign.dm == user or 
                   campaign.players.filter(id=user.id).exists())
        except Campaign.DoesNotExist:
            return False
    
    # Campaign-specific message handlers
    async def handle_ping(self, data):
        """Handle ping messages."""
        await self.send_message('pong', {'timestamp': self.get_timestamp()})
    
    async def handle_join_session(self, data):
        """Handle user joining a session."""
        await self.channel_layer.group_send(
            self.campaign_group,
            {
                'type': 'session_update',
                'message': {
                    'action': 'user_joined',
                    'user': self.scope['user'].username,
                    'timestamp': self.get_timestamp()
                }
            }
        )
    
    # Group message handlers
    async def session_update(self, event):
        """Handle session update messages from the group."""
        await self.send_message('session_update', event['message'])
    
    async def campaign_update(self, event):
        """Handle campaign update messages from the group."""
        await self.send_message('campaign_update', event['message'])


class CombatConsumer(BaseAuthenticatedConsumer):
    """
    WebSocket consumer for combat encounter real-time updates.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.encounter_id = None
        self.encounter_group = None
    
    async def on_connect(self):
        """Join encounter group for real-time combat updates."""
        self.encounter_id = self.scope['url_route']['kwargs']['encounter_id']
        self.encounter_group = f'encounter_{self.encounter_id}'
        
        # Check if user has access to this encounter
        if await self.can_access_encounter():
            await self.channel_layer.group_add(
                self.encounter_group,
                self.channel_name
            )
            await self.send_message('connected', {'encounter_id': self.encounter_id})
        else:
            await self.send_error('Access denied to encounter')
            await self.close()
    
    async def on_disconnect(self, close_code):
        """Leave encounter group."""
        if self.encounter_group:
            await self.channel_layer.group_discard(
                self.encounter_group,
                self.channel_name
            )
    
    @database_sync_to_async
    def can_access_encounter(self):
        """Check if user can access the encounter."""
        from apps.combat.models import Encounter
        try:
            encounter = Encounter.objects.get(id=self.encounter_id)
            campaign = encounter.campaign
            user = self.scope['user']
            return (campaign.dm == user or 
                   campaign.players.filter(id=user.id).exists())
        except Encounter.DoesNotExist:
            return False
    
    # Combat-specific message handlers
    async def handle_initiative_update(self, data):
        """Handle initiative order updates."""
        await self.channel_layer.group_send(
            self.encounter_group,
            {
                'type': 'combat_update',
                'message': {
                    'action': 'initiative_update',
                    'data': data,
                    'user': self.scope['user'].username,
                    'timestamp': self.get_timestamp()
                }
            }
        )
    
    async def handle_hp_update(self, data):
        """Handle HP updates."""
        await self.channel_layer.group_send(
            self.encounter_group,
            {
                'type': 'combat_update',
                'message': {
                    'action': 'hp_update',
                    'data': data,
                    'user': self.scope['user'].username,
                    'timestamp': self.get_timestamp()
                }
            }
        )
    
    # Group message handlers
    async def combat_update(self, event):
        """Handle combat update messages from the group."""
        await self.send_message('combat_update', event['message'])