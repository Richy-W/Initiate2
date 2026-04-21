import secrets
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import (
    Campaign, CampaignMembership, CampaignInvitation,
    CampaignNotification, CharacterSessionState,
)


class CampaignSerializer(serializers.ModelSerializer):
    """Campaign list/create serializer."""

    dm_username = serializers.CharField(source='dm.username', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'description', 'dm', 'dm_username',
            'is_active', 'join_mode', 'encumbrance_rules', 'rule_validation',
            'settings', 'invite_code', 'created_at', 'updated_at', 'last_session', 'member_count',
        ]
        read_only_fields = ['id', 'dm', 'invite_code', 'created_at', 'updated_at', 'member_count']

    def get_member_count(self, obj):
        return obj.memberships.filter(status=CampaignMembership.Status.ACTIVE).count()

    def validate_name(self, value):
        user = self.context['request'].user
        qs = Campaign.objects.filter(dm=user, name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('You already have a campaign with this name.')
        return value


class CampaignDetailSerializer(CampaignSerializer):
    """Campaign detail serializer with membership info."""

    memberships = serializers.SerializerMethodField()

    class Meta(CampaignSerializer.Meta):
        fields = CampaignSerializer.Meta.fields + ['memberships']

    def get_memberships(self, obj):
        active = obj.memberships.filter(
            status=CampaignMembership.Status.ACTIVE
        ).select_related('player', 'character')
        return CampaignMembershipSerializer(active, many=True).data


class CampaignMembershipSerializer(serializers.ModelSerializer):
    """Serializer for campaign membership."""

    player_username = serializers.CharField(source='player.username', read_only=True)
    character_name = serializers.CharField(source='character.name', read_only=True)

    class Meta:
        model = CampaignMembership
        fields = [
            'id', 'campaign', 'player', 'player_username',
            'character', 'character_name', 'status', 'joined_at', 'updated_at',
        ]
        read_only_fields = ['id', 'joined_at', 'updated_at']


class CampaignInvitationSerializer(serializers.ModelSerializer):
    """Serializer for campaign invitations."""

    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    invited_by_username = serializers.CharField(source='invited_by.username', read_only=True)

    class Meta:
        model = CampaignInvitation
        fields = [
            'id', 'campaign', 'campaign_name', 'invited_by', 'invited_by_username',
            'email', 'invitee', 'token', 'status', 'message', 'created_at', 'expires_at',
        ]
        read_only_fields = ['id', 'campaign', 'invited_by', 'token', 'status', 'created_at']

    def create(self, validated_data):
        validated_data['token'] = secrets.token_urlsafe(32)
        validated_data['expires_at'] = timezone.now() + timedelta(days=7)
        return super().create(validated_data)


class CampaignNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignNotification
        fields = [
            'id', 'campaign', 'recipient', 'notification_type',
            'title', 'message', 'payload', 'is_read', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class CharacterSessionStateSerializer(serializers.ModelSerializer):
    character_name = serializers.CharField(source='character.name', read_only=True)

    class Meta:
        model = CharacterSessionState
        fields = [
            'id', 'campaign', 'character', 'character_name',
            'session_name', 'state_data', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'character_name']
