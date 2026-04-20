import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.content.models import JSONField


def _generate_campaign_code():
    """Generate a short uppercase alphanumeric invite code, e.g. A3F9KQ2B."""
    import random, string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

User = get_user_model()


class Campaign(models.Model):
    """D&D Campaign managed by a Dungeon Master."""

    class JoinMode(models.TextChoices):
        INVITATION_ONLY = 'invitation_only', 'Invitation Only'
        APPROVAL_REQUIRED = 'approval_required', 'Approval Required'

    class EncumbranceRules(models.TextChoices):
        DISABLED = 'disabled', 'Disabled'
        SIMPLE = 'simple', 'Simple'
        VARIANT = 'variant', 'Variant'

    class RuleValidation(models.TextChoices):
        STRICT = 'strict', 'Strict'
        WARNINGS = 'warnings', 'Warnings'
        PERMISSIVE = 'permissive', 'Permissive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    dm = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dm_campaigns')
    is_active = models.BooleanField(default=True)
    join_mode = models.CharField(max_length=20, choices=JoinMode.choices, default=JoinMode.INVITATION_ONLY)
    encumbrance_rules = models.CharField(max_length=20, choices=EncumbranceRules.choices, default=EncumbranceRules.SIMPLE)
    rule_validation = models.CharField(max_length=20, choices=RuleValidation.choices, default=RuleValidation.WARNINGS)
    settings = JSONField(default=dict, help_text='Custom house rules and settings')
    invite_code = models.CharField(
        max_length=16, unique=True, default=_generate_campaign_code,
        help_text='Short code players can use to join this campaign'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_session = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'campaigns'
        unique_together = [('dm', 'name')]
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class CampaignMembership(models.Model):
    """Player membership in a campaign."""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INVITED = 'invited', 'Invited'
        PENDING = 'pending', 'Pending Approval'
        LEFT = 'left', 'Left'
        REMOVED = 'removed', 'Removed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='memberships')
    player = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_memberships')
    character = models.ForeignKey(
        'characters.Character',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campaign_membership'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INVITED)
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaign_memberships'
        unique_together = [('campaign', 'player')]

    def __str__(self):
        return f'{self.player} in {self.campaign} ({self.status})'


class CampaignInvitation(models.Model):
    """Invitation token for joining a campaign."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        DECLINED = 'declined', 'Declined'
        EXPIRED = 'expired', 'Expired'
        REVOKED = 'revoked', 'Revoked'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='invitations')
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    email = models.EmailField(blank=True, help_text='Email if inviting by email')
    invitee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_invitations'
    )
    token = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'campaign_invitations'
        ordering = ['-created_at']

    def __str__(self):
        return f'Invitation to {self.campaign} ({self.status})'


class CampaignNotification(models.Model):
    """Notification events for campaign participants."""

    class NotificationType(models.TextChoices):
        INFO = 'info', 'Info'
        INVITE = 'invite', 'Invite'
        JOIN_REQUEST = 'join_request', 'Join Request'
        COMBAT = 'combat', 'Combat'
        SESSION = 'session', 'Session'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='campaign_notifications')
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.INFO)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    payload = JSONField(default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'campaign_notifications'
        ordering = ['-created_at']


class CharacterSessionState(models.Model):
    """Snapshot of a character's state for a specific campaign session."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='character_session_states')
    character = models.ForeignKey('characters.Character', on_delete=models.CASCADE, related_name='session_states')
    session_name = models.CharField(max_length=200)
    state_data = JSONField(default=dict)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'character_session_states'
        ordering = ['-updated_at']
