"""
WebSocket consumer for real-time combat and initiative tracking.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class CombatConsumer(AsyncWebsocketConsumer):
    """Real-time WebSocket consumer for combat encounters."""

    async def connect(self):
        self.tracker_id = self.scope['url_route']['kwargs']['tracker_id']
        self.room_group_name = f'combat_{self.tracker_id}'

        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        # Verify user has access to this encounter
        has_access = await self.check_access(user, self.tracker_id)
        if not has_access:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Send current state on connect
        state = await self.get_tracker_state(self.tracker_id)
        await self.send(text_data=json.dumps({'type': 'state', 'data': state}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = data.get('action')
        user = self.scope.get('user')

        if action == 'advance_turn':
            await self.handle_advance_turn(user)
        elif action == 'update_hp':
            await self.handle_update_hp(user, data)
        elif action == 'add_effect':
            await self.handle_add_effect(user, data)
        elif action == 'remove_effect':
            await self.handle_remove_effect(user, data)
        elif action == 'toggle_visibility':
            await self.handle_toggle_visibility(user, data)
        elif action == 'start_combat':
            await self.handle_start_combat(user)

    async def handle_advance_turn(self, user):
        is_dm = await self.is_dm(user, self.tracker_id)
        if not is_dm:
            return
        next_participant = await self.advance_turn(self.tracker_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'combat_update', 'data': state},
        )

    async def handle_update_hp(self, user, data):
        is_dm = await self.is_dm(user, self.tracker_id)
        if not is_dm:
            return
        participant_id = data.get('participant_id')
        hp_change = data.get('hp_change', 0)
        await self.update_participant_hp(participant_id, hp_change)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'combat_update', 'data': state},
        )

    async def handle_add_effect(self, user, data):
        is_dm = await self.is_dm(user, self.tracker_id)
        if not is_dm:
            return
        await self.add_spell_effect(self.tracker_id, data)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'combat_update', 'data': state},
        )

    async def handle_remove_effect(self, user, data):
        is_dm = await self.is_dm(user, self.tracker_id)
        if not is_dm:
            return
        effect_id = data.get('effect_id')
        await self.remove_spell_effect(effect_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'combat_update', 'data': state},
        )

    async def handle_toggle_visibility(self, user, data):
        is_dm = await self.is_dm(user, self.tracker_id)
        if not is_dm:
            return
        participant_id = data.get('participant_id')
        await self.toggle_participant_visibility(participant_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'combat_update', 'data': state},
        )

    async def handle_start_combat(self, user):
        is_dm = await self.is_dm(user, self.tracker_id)
        if not is_dm:
            return
        await self.start_combat(self.tracker_id)
        state = await self.get_tracker_state(self.tracker_id)
        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'combat_update', 'data': state},
        )

    # Group message handler
    async def combat_update(self, event):
        await self.send(text_data=json.dumps({'type': 'state', 'data': event['data']}))

    # Database helpers
    @database_sync_to_async
    def check_access(self, user, tracker_id):
        from apps.combat.models import InitiativeTracker
        from apps.campaigns.models import CampaignMembership
        try:
            tracker = InitiativeTracker.objects.select_related('campaign').get(id=tracker_id)
            if tracker.campaign.dm == user:
                return True
            return CampaignMembership.objects.filter(
                campaign=tracker.campaign, player=user, status=CampaignMembership.Status.ACTIVE
            ).exists()
        except InitiativeTracker.DoesNotExist:
            return False

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
