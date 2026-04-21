"""
WebSocket consumer for real-time combat and initiative tracking.
"""
import json
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

from apps.common.consumers import BaseAuthenticatedConsumer
from apps.campaigns.services import is_campaign_member

User = get_user_model()


class CombatConsumer(BaseAuthenticatedConsumer):
    """
    Real-time WebSocket consumer for combat encounters.

    Extends BaseAuthenticatedConsumer so that anonymous connections are always
    rejected before on_connect() is reached.  Campaign-membership access is
    verified inside on_connect(); the connection is closed immediately if the
    user has no access to the requested tracker.

    Incoming messages must follow the standard envelope:
        { "type": "<action_name>", ...payload fields }

    Supported types: advance_turn, update_hp, add_effect, remove_effect,
                     toggle_visibility, start_combat
    """

    async def on_connect(self):
        self.tracker_id = self.scope["url_route"]["kwargs"]["tracker_id"]
        self.room_group_name = f"combat_{self.tracker_id}"

        user = self.scope["user"]
        has_access = await self.check_access(user, self.tracker_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Send current state immediately on connect
        state = await self.get_tracker_state(self.tracker_id)
        await self.send(text_data=json.dumps({"type": "state", "data": state}))

    async def on_disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # ------------------------------------------------------------------ #
    # Message handlers — dispatched automatically by BaseAuthenticatedConsumer
    # via the handle_{type} pattern.
    # ------------------------------------------------------------------ #

    async def handle_advance_turn(self, data):
        user = self.scope["user"]
        if not await self.is_dm(user, self.tracker_id):
            return
        await self.advance_turn(self.tracker_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "combat_update", "data": state},
        )

    async def handle_update_hp(self, data):
        user = self.scope["user"]
        if not await self.is_dm(user, self.tracker_id):
            return
        participant_id = data.get("participant_id")
        hp_change = data.get("hp_change", 0)
        await self.update_participant_hp(participant_id, hp_change)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "combat_update", "data": state},
        )

    async def handle_add_effect(self, data):
        user = self.scope["user"]
        if not await self.is_dm(user, self.tracker_id):
            return
        await self.add_spell_effect(self.tracker_id, data)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "combat_update", "data": state},
        )

    async def handle_remove_effect(self, data):
        user = self.scope["user"]
        if not await self.is_dm(user, self.tracker_id):
            return
        effect_id = data.get("effect_id")
        await self.remove_spell_effect(effect_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "combat_update", "data": state},
        )

    async def handle_toggle_visibility(self, data):
        user = self.scope["user"]
        if not await self.is_dm(user, self.tracker_id):
            return
        participant_id = data.get("participant_id")
        await self.toggle_participant_visibility(participant_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "combat_update", "data": state},
        )

    async def handle_start_combat(self, data):
        user = self.scope["user"]
        if not await self.is_dm(user, self.tracker_id):
            return
        await self.start_combat(self.tracker_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "combat_update", "data": state},
        )

    # Group message handler
    async def combat_update(self, event):
        await self.send(text_data=json.dumps({'type': 'state', 'data': event['data']}))

    # ------------------------------------------------------------------ #
    # Database helpers
    # ------------------------------------------------------------------ #

    @database_sync_to_async
    def check_access(self, user, tracker_id):
        """
        Use the campaigns service to verify membership — avoids importing
        CampaignMembership directly from the campaigns app.
        """
        from apps.combat.models import InitiativeTracker

        try:
            tracker = InitiativeTracker.objects.select_related("campaign").get(id=tracker_id)
        except InitiativeTracker.DoesNotExist:
            return False
        return is_campaign_member(user, tracker.campaign)

    @database_sync_to_async
    def is_dm(self, user, tracker_id):
        from apps.combat.models import InitiativeTracker
        try:
            tracker = InitiativeTracker.objects.select_related('campaign').get(id=tracker_id)
            return tracker.campaign.dm == user
        except InitiativeTracker.DoesNotExist:
            return False

    @database_sync_to_async
    def get_tracker_state(self, tracker_id):
        from apps.combat.models import InitiativeTracker
        from apps.combat.serializers import InitiativeTrackerDetailSerializer
        try:
            tracker = InitiativeTracker.objects.prefetch_related(
                'participants', 'spell_effects'
            ).get(id=tracker_id)
            return InitiativeTrackerDetailSerializer(tracker).data
        except InitiativeTracker.DoesNotExist:
            return {}

    @database_sync_to_async
    def advance_turn(self, tracker_id):
        from apps.combat.models import InitiativeTracker
        tracker = InitiativeTracker.objects.get(id=tracker_id)
        return tracker.advance_turn()

    @database_sync_to_async
    def update_participant_hp(self, participant_id, hp_change):
        from apps.combat.models import InitiativeParticipant
        try:
            p = InitiativeParticipant.objects.get(id=participant_id)
            p.hit_points = max(0, p.hit_points + hp_change)
            if p.hit_points == 0:
                p.is_active = False
            p.save()
        except InitiativeParticipant.DoesNotExist:
            pass

    @database_sync_to_async
    def add_spell_effect(self, tracker_id, data):
        from apps.combat.models import InitiativeTracker, SpellEffect, InitiativeParticipant
        try:
            tracker = InitiativeTracker.objects.get(id=tracker_id)
            caster = InitiativeParticipant.objects.get(id=data['caster_id'])
            SpellEffect.objects.create(
                initiative_tracker=tracker,
                caster=caster,
                spell_name=data.get('spell_name', 'Unknown'),
                duration_rounds=data.get('duration_rounds', 1),
                concentration=data.get('concentration', False),
                description=data.get('description', ''),
                is_visible=data.get('is_visible', True),
            )
        except (InitiativeTracker.DoesNotExist, InitiativeParticipant.DoesNotExist, KeyError):
            pass

    @database_sync_to_async
    def remove_spell_effect(self, effect_id):
        from apps.combat.models import SpellEffect
        SpellEffect.objects.filter(id=effect_id).delete()

    @database_sync_to_async
    def toggle_participant_visibility(self, participant_id):
        from apps.combat.models import InitiativeParticipant
        try:
            p = InitiativeParticipant.objects.get(id=participant_id)
            p.is_visible = not p.is_visible
            p.save()
        except InitiativeParticipant.DoesNotExist:
            pass

    @database_sync_to_async
    def start_combat(self, tracker_id):
        from apps.combat.models import InitiativeTracker
        try:
            tracker = InitiativeTracker.objects.get(id=tracker_id)
            tracker.status = InitiativeTracker.CombatStatus.ACTIVE
            tracker.save()
        except InitiativeTracker.DoesNotExist:
            pass
