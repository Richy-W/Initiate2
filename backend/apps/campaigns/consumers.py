"""
WebSocket consumer for campaign session real-time updates.
"""
from channels.db import database_sync_to_async

from apps.common.consumers import BaseAuthenticatedConsumer


class CampaignConsumer(BaseAuthenticatedConsumer):
    """
    WebSocket consumer for campaign-related real-time updates (session presence,
    player joins, etc.).

    Incoming messages must follow the standard envelope:
        { "type": "<action_name>", ...payload fields }

    Supported types: ping, join_session
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.campaign_id = None
        self.campaign_group = None

    async def on_connect(self):
        self.campaign_id = self.scope["url_route"]["kwargs"]["campaign_id"]
        self.campaign_group = f"campaign_{self.campaign_id}"

        if await self.can_access_campaign():
            await self.channel_layer.group_add(self.campaign_group, self.channel_name)
            await self.send_message("connected", {"campaign_id": self.campaign_id})
        else:
            await self.send_error("Access denied to campaign")
            await self.close()

    async def on_disconnect(self, close_code):
        if self.campaign_group:
            await self.channel_layer.group_discard(self.campaign_group, self.channel_name)

    # ------------------------------------------------------------------ #
    # Message handlers
    # ------------------------------------------------------------------ #

    async def handle_ping(self, data):
        await self.send_message("pong", {"timestamp": self.get_timestamp()})

    async def handle_join_session(self, data):
        await self.channel_layer.group_send(
            self.campaign_group,
            {
                "type": "session_update",
                "message": {
                    "action": "user_joined",
                    "user": self.scope["user"].username,
                    "timestamp": self.get_timestamp(),
                },
            },
        )

    # ------------------------------------------------------------------ #
    # Group message handlers
    # ------------------------------------------------------------------ #

    async def session_update(self, event):
        await self.send_message("session_update", event["message"])

    async def campaign_update(self, event):
        await self.send_message("campaign_update", event["message"])

    # ------------------------------------------------------------------ #
    # Database helpers
    # ------------------------------------------------------------------ #

    @database_sync_to_async
    def can_access_campaign(self):
        """Check if user is the DM or an active member of this campaign."""
        from apps.campaigns.models import Campaign, CampaignMembership

        try:
            campaign = Campaign.objects.get(id=self.campaign_id)
        except Campaign.DoesNotExist:
            return False

        user = self.scope["user"]
        if campaign.dm == user:
            return True
        return CampaignMembership.objects.filter(
            campaign=campaign,
            player=user,
            status=CampaignMembership.Status.ACTIVE,
        ).exists()
