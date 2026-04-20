from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.campaigns.models import Campaign
from apps.campaigns.services import get_accessible_campaigns
from .models import InitiativeTracker, InitiativeParticipant, SpellEffect
from .serializers import (
    InitiativeTrackerSerializer,
    InitiativeTrackerDetailSerializer,
    InitiativeParticipantSerializer,
    SpellEffectSerializer,
)


@extend_schema(tags=['combat'])
class InitiativeTrackerViewSet(viewsets.ModelViewSet):
    """API endpoints for initiative trackers."""

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'round_number']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        accessible_campaigns = get_accessible_campaigns(user)
        return InitiativeTracker.objects.filter(
            campaign__in=accessible_campaigns
        ).select_related('campaign', 'active_participant').prefetch_related('participants__character', 'spell_effects')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return InitiativeTrackerDetailSerializer
        return InitiativeTrackerSerializer

    def perform_create(self, serializer):
        """Only DMs can create initiative trackers."""
        campaign_id = self.request.data.get('campaign')
        if not campaign_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('campaign is required.')
        try:
            campaign = Campaign.objects.get(id=campaign_id, dm=self.request.user)
        except Campaign.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the DM can create encounters.')
        serializer.save(campaign=campaign)

    @action(detail=True, methods=['post'], url_path='add-participant')
    def add_participant(self, request, pk=None):
        """Add a participant to an initiative tracker."""
        tracker = self.get_object()
        self._require_dm(tracker)
        serializer = InitiativeParticipantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Auto-assign turn_order
        max_order = tracker.participants.count()
        serializer.save(initiative_tracker=tracker, turn_order=max_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='submit-initiative')
    def submit_initiative(self, request, pk=None):
        """Player submits their initiative roll."""
        tracker = self.get_object()
        participant_id = request.data.get('participant_id')
        initiative_value = request.data.get('initiative_value')
        if initiative_value is None:
            return Response({'detail': 'initiative_value required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            participant = tracker.participants.get(
                id=participant_id, character__user=request.user
            )
        except InitiativeParticipant.DoesNotExist:
            return Response({'detail': 'Participant not found.'}, status=status.HTTP_404_NOT_FOUND)
        participant.initiative_value = initiative_value
        participant.save()
        return Response(InitiativeParticipantSerializer(participant).data)

    @action(detail=True, methods=['post'], url_path='advance-turn')
    def advance_turn(self, request, pk=None):
        """DM advances to next turn."""
        tracker = self.get_object()
        self._require_dm(tracker)
        next_participant = tracker.advance_turn()
        return Response(InitiativeTrackerDetailSerializer(tracker).data)

    @action(detail=True, methods=['post'], url_path='start')
    def start_combat(self, request, pk=None):
        """DM starts combat (moves from rolling to active)."""
        tracker = self.get_object()
        self._require_dm(tracker)
        tracker.status = InitiativeTracker.CombatStatus.ACTIVE
        # Sort participants by initiative after rolling phase
        participants = list(tracker.participants.all())
        participants.sort(key=lambda p: -p.initiative_value)
        for i, p in enumerate(participants):
            p.turn_order = i
            p.save(update_fields=['turn_order'])
        if participants:
            tracker.active_participant = participants[0]
        tracker.save()
        return Response(InitiativeTrackerDetailSerializer(tracker).data)

    @action(detail=True, methods=['post'], url_path='end')
    def end_combat(self, request, pk=None):
        """DM ends combat."""
        tracker = self.get_object()
        self._require_dm(tracker)
        tracker.status = InitiativeTracker.CombatStatus.CONCLUDED
        tracker.is_active = False
        tracker.save()
        return Response(InitiativeTrackerDetailSerializer(tracker).data)

    def _require_dm(self, tracker):
        if tracker.campaign.dm != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only the DM can perform this action.')
