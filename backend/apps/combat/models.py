import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class InitiativeTracker(models.Model):
    """Real-time combat tracker for a campaign encounter."""

    class CombatStatus(models.TextChoices):
        ROLLING = 'rolling', 'Collecting Initiative Rolls'
        ACTIVE = 'active', 'Active Combat'
        PAUSED = 'paused', 'Paused'
        CONCLUDED = 'concluded', 'Concluded'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(
        'campaigns.Campaign', on_delete=models.CASCADE, related_name='initiative_trackers'
    )
    name = models.CharField(max_length=200, default='Encounter')
    round_number = models.PositiveIntegerField(default=1)
    active_participant = models.ForeignKey(
        'InitiativeParticipant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    status = models.CharField(max_length=20, choices=CombatStatus.choices, default=CombatStatus.ROLLING)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'initiative_trackers'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} (Round {self.round_number})'

    def advance_turn(self):
        """Move to next participant in initiative order."""
        participants = list(
            self.participants.filter(is_active=True).order_by('turn_order', '-initiative_value', 'id')
        )
        if not participants:
            return None
        if self.active_participant is None:
            next_participant = participants[0]
        else:
            current_index = next(
                (i for i, p in enumerate(participants) if p.id == self.active_participant_id), -1
            )
            if current_index == len(participants) - 1:
                # End of round
                self.round_number += 1
                next_participant = participants[0]
                # Decrement spell effect durations
                self.spell_effects.filter(duration_rounds__gt=0).update(
                    duration_rounds=models.F('duration_rounds') - 1
                )
                self.spell_effects.filter(duration_rounds=0).delete()
            else:
                next_participant = participants[current_index + 1]
        self.active_participant = next_participant
        self.status = self.CombatStatus.ACTIVE
        self.save()
        return next_participant


class InitiativeParticipant(models.Model):
    """A combatant in initiative order."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    initiative_tracker = models.ForeignKey(
        InitiativeTracker, on_delete=models.CASCADE, related_name='participants'
    )
    character = models.ForeignKey(
        'characters.Character',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='initiative_entries',
    )
    npc_name = models.CharField(max_length=200, blank=True, help_text='Name for NPCs/monsters')
    display_name = models.CharField(max_length=200, blank=True, help_text='Override name shown to players')
    initiative_value = models.IntegerField(default=0)
    hit_points = models.IntegerField(default=0)
    max_hit_points = models.IntegerField(default=0)
    is_visible = models.BooleanField(default=True, help_text='Visible to players')
    is_active = models.BooleanField(default=True, help_text='Still in combat')
    turn_order = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'initiative_participants'
        ordering = ['turn_order', '-initiative_value']

    @property
    def name(self):
        if self.display_name:
            return self.display_name
        if self.character:
            return self.character.name
        return self.npc_name or 'Unknown'

    def __str__(self):
        return f'{self.name} (init {self.initiative_value})'


class SpellEffect(models.Model):
    """Timed magical effect tracked during combat."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    initiative_tracker = models.ForeignKey(
        InitiativeTracker, on_delete=models.CASCADE, related_name='spell_effects'
    )
    caster = models.ForeignKey(
        InitiativeParticipant,
        on_delete=models.CASCADE,
        related_name='cast_effects',
    )
    spell_name = models.CharField(max_length=200)
    duration_rounds = models.PositiveIntegerField(default=1)
    concentration = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'spell_effects'
        ordering = ['duration_rounds']

    def __str__(self):
        return f'{self.spell_name} ({self.duration_rounds} rounds remaining)'
