from rest_framework import serializers
from .models import InitiativeTracker, InitiativeParticipant, SpellEffect


class SpellEffectSerializer(serializers.ModelSerializer):
    caster_name = serializers.CharField(source='caster.name', read_only=True)

    class Meta:
        model = SpellEffect
        fields = [
            'id', 'caster', 'caster_name', 'spell_name', 'duration_rounds',
            'concentration', 'description', 'is_visible', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class InitiativeParticipantSerializer(serializers.ModelSerializer):
    character_name = serializers.CharField(source='character.name', read_only=True)
    display = serializers.CharField(source='name', read_only=True)

    class Meta:
        model = InitiativeParticipant
        fields = [
            'id', 'character', 'character_name', 'npc_name', 'display_name', 'display',
            'initiative_value', 'hit_points', 'max_hit_points',
            'is_visible', 'is_active', 'turn_order', 'notes',
        ]
        read_only_fields = ['id']


class InitiativeTrackerSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = InitiativeTracker
        fields = [
            'id', 'campaign', 'name', 'round_number', 'active_participant',
            'status', 'is_active', 'created_at', 'updated_at', 'participant_count',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_participant_count(self, obj):
        return obj.participants.filter(is_active=True).count()


class InitiativeTrackerDetailSerializer(InitiativeTrackerSerializer):
    participants = InitiativeParticipantSerializer(many=True, read_only=True)
    spell_effects = SpellEffectSerializer(many=True, read_only=True)

    class Meta(InitiativeTrackerSerializer.Meta):
        fields = InitiativeTrackerSerializer.Meta.fields + ['participants', 'spell_effects']
