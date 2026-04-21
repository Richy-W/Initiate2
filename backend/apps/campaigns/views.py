from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from .models import (
    Campaign,
    CampaignMembership,
    CampaignInvitation,
    CampaignNotification,
    CharacterSessionState,
)
from .serializers import (
    CampaignSerializer,
    CampaignDetailSerializer,
    CampaignMembershipSerializer,
    CampaignInvitationSerializer,
    CampaignNotificationSerializer,
    CharacterSessionStateSerializer,
)


@extend_schema(tags=['campaigns'])
class CampaignViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for campaigns."""

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'last_session']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        # DM campaigns + campaigns where user is an active member
        return Campaign.objects.filter(
            Q(dm=user) | Q(memberships__player=user, memberships__status=CampaignMembership.Status.ACTIVE)
        ).distinct().select_related('dm').prefetch_related('memberships__player', 'memberships__character')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CampaignDetailSerializer
        return CampaignSerializer

    def perform_create(self, serializer):
        serializer.save(dm=self.request.user)

    @action(detail=True, methods=['post'], url_path='invite')
    def invite(self, request, pk=None):
        """Create an invitation for a campaign."""
        campaign = self.get_object()
        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can send invitations.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CampaignInvitationSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(campaign=campaign, invited_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='invitations')
    def invitations(self, request, pk=None):
        """List pending invitations for a campaign."""
        campaign = self.get_object()
        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can view invitations.'}, status=status.HTTP_403_FORBIDDEN)
        qs = campaign.invitations.filter(status=CampaignInvitation.Status.PENDING)
        serializer = CampaignInvitationSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='regenerate-invite-code')
    def regenerate_invite_code(self, request, pk=None):
        """DM regenerates the campaign's shareable invite code."""
        campaign = self.get_object()
        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can regenerate the invite code.'}, status=status.HTTP_403_FORBIDDEN)
        from apps.campaigns.models import _generate_campaign_code
        new_code = _generate_campaign_code()
        while Campaign.objects.filter(invite_code=new_code).exclude(pk=campaign.pk).exists():
            new_code = _generate_campaign_code()
        campaign.invite_code = new_code
        campaign.save(update_fields=['invite_code'])
        return Response({'invite_code': new_code})

    @action(detail=False, methods=['post'], url_path='join-by-code')
    def join_by_code(self, request):
        """Player joins a campaign using the campaign's invite code."""
        code = request.data.get('code', '').strip().upper()
        if not code:
            return Response({'detail': 'Invite code required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            campaign = Campaign.objects.get(invite_code=code)
        except Campaign.DoesNotExist:
            return Response({'detail': 'Invalid invite code.'}, status=status.HTTP_404_NOT_FOUND)

        if not campaign.is_active:
            return Response({'detail': 'This campaign is no longer active.'}, status=status.HTTP_400_BAD_REQUEST)

        # Don't re-add DMs
        if campaign.dm == request.user:
            return Response({'detail': 'You are the DM of this campaign.'}, status=status.HTTP_400_BAD_REQUEST)

        membership, created = CampaignMembership.objects.get_or_create(
            campaign=campaign,
            player=request.user,
            defaults={'status': CampaignMembership.Status.ACTIVE},
        )
        if not created:
            if membership.status == CampaignMembership.Status.ACTIVE:
                return Response({'detail': 'You are already a member.', 'campaign_id': str(campaign.id), 'campaign_name': campaign.name})
            membership.status = CampaignMembership.Status.ACTIVE
            membership.save()

        return Response({
            'detail': 'Joined campaign successfully.',
            'campaign_id': str(campaign.id),
            'campaign_name': campaign.name,
        })

    @action(detail=True, methods=['post'], url_path='accept-invitation')
    def accept_invitation(self, request, pk=None):
        """Accept an invitation by token."""
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            invitation = CampaignInvitation.objects.get(
                campaign_id=pk, token=token, status=CampaignInvitation.Status.PENDING
            )
        except CampaignInvitation.DoesNotExist:
            return Response({'detail': 'Invalid or expired invitation.'}, status=status.HTTP_404_NOT_FOUND)

        invitation.status = CampaignInvitation.Status.ACCEPTED
        invitation.invitee = request.user
        invitation.save()

        membership, _ = CampaignMembership.objects.get_or_create(
            campaign=invitation.campaign,
            player=request.user,
            defaults={'status': CampaignMembership.Status.ACTIVE},
        )
        membership.status = CampaignMembership.Status.ACTIVE
        membership.save()
        return Response({'detail': 'Invitation accepted.'})

    @action(detail=True, methods=['post'], url_path='decline-invitation')
    def decline_invitation(self, request, pk=None):
        """Decline an invitation by token."""
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'Token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            invitation = CampaignInvitation.objects.get(
                campaign_id=pk, token=token, status=CampaignInvitation.Status.PENDING
            )
        except CampaignInvitation.DoesNotExist:
            return Response({'detail': 'Invalid or expired invitation.'}, status=status.HTTP_404_NOT_FOUND)

        invitation.status = CampaignInvitation.Status.DECLINED
        invitation.invitee = request.user
        invitation.save()
        return Response({'detail': 'Invitation declined.'})

    @action(detail=False, methods=['get'], url_path='my-invitations')
    def my_invitations(self, request):
        """List all pending invitations for the current user (across all campaigns)."""
        from django.utils import timezone
        qs = CampaignInvitation.objects.filter(
            status=CampaignInvitation.Status.PENDING,
        ).filter(
            Q(invitee=request.user) | Q(email=request.user.email)
        ).select_related('campaign', 'invited_by')
        # Filter out expired invitations
        qs = qs.filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        )
        serializer = CampaignInvitationSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='use-invite-code')
    def use_invite_code(self, request):
        """Accept or decline an invitation using only the token (no campaign ID needed)."""
        from django.utils import timezone
        token = request.data.get('token', '').strip()
        action_choice = request.data.get('action', 'accept')  # 'accept' or 'decline'
        if not token:
            return Response({'detail': 'Token required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            invitation = CampaignInvitation.objects.select_related('campaign').get(
                token=token, status=CampaignInvitation.Status.PENDING
            )
        except CampaignInvitation.DoesNotExist:
            return Response({'detail': 'Invalid or expired invite code.'}, status=status.HTTP_404_NOT_FOUND)

        # Check expiry
        if invitation.expires_at and invitation.expires_at < timezone.now():
            invitation.status = CampaignInvitation.Status.EXPIRED
            invitation.save(update_fields=['status'])
            return Response({'detail': 'This invite code has expired.'}, status=status.HTTP_410_GONE)

        invitation.invitee = request.user

        if action_choice == 'decline':
            invitation.status = CampaignInvitation.Status.DECLINED
            invitation.save()
            return Response({'detail': 'Invitation declined.'})

        invitation.status = CampaignInvitation.Status.ACCEPTED
        invitation.save()

        membership, _ = CampaignMembership.objects.get_or_create(
            campaign=invitation.campaign,
            player=request.user,
            defaults={'status': CampaignMembership.Status.ACTIVE},
        )
        membership.status = CampaignMembership.Status.ACTIVE
        membership.save()
        return Response({
            'detail': 'Invitation accepted.',
            'campaign_id': str(invitation.campaign.id),
            'campaign_name': invitation.campaign.name,
        })

    @action(detail=True, methods=['post'], url_path='request-join')
    def request_join(self, request, pk=None):
        """Request to join a campaign (approval required mode)."""
        campaign = self.get_object()
        if campaign.join_mode != Campaign.JoinMode.APPROVAL_REQUIRED:
            return Response({'detail': 'This campaign requires an invitation.'}, status=status.HTTP_400_BAD_REQUEST)
        membership, created = CampaignMembership.objects.get_or_create(
            campaign=campaign,
            player=request.user,
            defaults={'status': CampaignMembership.Status.PENDING},
        )
        if not created and membership.status != CampaignMembership.Status.LEFT:
            return Response({'detail': 'Already a member or request pending.'}, status=status.HTTP_400_BAD_REQUEST)
        if not created:
            membership.status = CampaignMembership.Status.PENDING
            membership.save()
        return Response({'detail': 'Join request submitted.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='approve-member')
    def approve_member(self, request, pk=None):
        """DM approves a pending join request."""
        campaign = self.get_object()
        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can approve members.'}, status=status.HTTP_403_FORBIDDEN)
        player_id = request.data.get('player_id')
        try:
            membership = CampaignMembership.objects.get(
                campaign=campaign, player_id=player_id, status=CampaignMembership.Status.PENDING
            )
        except CampaignMembership.DoesNotExist:
            return Response({'detail': 'No pending request found.'}, status=status.HTTP_404_NOT_FOUND)
        membership.status = CampaignMembership.Status.ACTIVE
        membership.save()
        return Response(CampaignMembershipSerializer(membership).data)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        """Player leaves a campaign."""
        campaign = self.get_object()
        try:
            membership = CampaignMembership.objects.get(
                campaign=campaign, player=request.user, status=CampaignMembership.Status.ACTIVE
            )
        except CampaignMembership.DoesNotExist:
            return Response({'detail': 'Not a member of this campaign.'}, status=status.HTTP_404_NOT_FOUND)
        membership.status = CampaignMembership.Status.LEFT
        membership.save()
        return Response({'detail': 'You have left the campaign.'})

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        """DM removes a member."""
        campaign = self.get_object()
        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can remove members.'}, status=status.HTTP_403_FORBIDDEN)
        player_id = request.data.get('player_id')
        updated = CampaignMembership.objects.filter(
            campaign=campaign, player_id=player_id
        ).update(status=CampaignMembership.Status.REMOVED)
        if not updated:
            return Response({'detail': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'detail': 'Member removed.'})

    @action(detail=True, methods=['get'], url_path='party')
    def party(self, request, pk=None):
        """Get the party overview with all active members."""
        campaign = self.get_object()
        memberships = campaign.memberships.filter(
            status=CampaignMembership.Status.ACTIVE
        ).select_related('player', 'character')
        serializer = CampaignMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='assign-character')
    def assign_character(self, request, pk=None):
        """Assign a character to this campaign."""
        campaign = self.get_object()
        character_id = request.data.get('character_id')
        try:
            membership = CampaignMembership.objects.get(
                campaign=campaign, player=request.user, status=CampaignMembership.Status.ACTIVE
            )
        except CampaignMembership.DoesNotExist:
            return Response({'detail': 'Not a member of this campaign.'}, status=status.HTTP_403_FORBIDDEN)
        from apps.characters.models import Character
        try:
            character = Character.objects.get(id=character_id, user=request.user)
        except Character.DoesNotExist:
            return Response({'detail': 'Character not found.'}, status=status.HTTP_404_NOT_FOUND)
        membership.character = character
        membership.save()
        return Response(CampaignMembershipSerializer(membership).data)

    @action(detail=True, methods=['post'], url_path='convert-character-to-npc')
    def convert_character_to_npc(self, request, pk=None):
        """Convert an existing character into an NPC template payload for combat."""
        campaign = self.get_object()
        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can convert characters to NPCs.'}, status=status.HTTP_403_FORBIDDEN)

        character_id = request.data.get('character_id')
        from apps.characters.models import Character
        try:
            character = Character.objects.get(id=character_id)
        except Character.DoesNotExist:
            return Response({'detail': 'Character not found.'}, status=status.HTTP_404_NOT_FOUND)

        npc_payload = {
            'npc_name': character.name,
            'initiative_value': 10 + (character.dexterity_modifier or 0),
            'hit_points': character.current_hit_points,
            'max_hit_points': character.max_hit_points,
            'is_visible': True,
            'notes': f'Converted from character {character.id}',
        }
        return Response(npc_payload)

    @action(detail=True, methods=['get', 'post'], url_path='notifications')
    def notifications(self, request, pk=None):
        """List notifications for current user in campaign or create notifications (DM only)."""
        campaign = self.get_object()
        if request.method.lower() == 'get':
            qs = CampaignNotification.objects.filter(campaign=campaign, recipient=request.user)
            return Response(CampaignNotificationSerializer(qs, many=True).data)

        if campaign.dm != request.user:
            return Response({'detail': 'Only the DM can create notifications.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CampaignNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(campaign=campaign)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='notifications-mark-read')
    def notifications_mark_read(self, request, pk=None):
        """Mark a notification as read for current user."""
        notification_id = request.data.get('notification_id')
        updated = CampaignNotification.objects.filter(
            id=notification_id,
            campaign_id=pk,
            recipient=request.user,
        ).update(is_read=True)
        if not updated:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'detail': 'Notification marked as read.'})

    @action(detail=True, methods=['get', 'post'], url_path='session-state')
    def session_state(self, request, pk=None):
        """Read or write session-specific character state snapshots."""
        campaign = self.get_object()
        if request.method.lower() == 'get':
            character_id = request.query_params.get('character_id')
            qs = CharacterSessionState.objects.filter(campaign=campaign)
            if character_id:
                qs = qs.filter(character_id=character_id)
            return Response(CharacterSessionStateSerializer(qs, many=True).data)

        serializer = CharacterSessionStateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(campaign=campaign, created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
