from __future__ import annotations

from dataclasses import dataclass

from django.utils import timezone

from apps.characters.models import FeatureUsageState


@dataclass
class ResourceComputation:
    max_uses: int
    override_meta: dict


def _to_int(value, fallback=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def compute_max_uses(character, state: FeatureUsageState) -> ResourceComputation:
    payload = state.override_payload or {}

    # Base defaults to persisted max_uses override when present, otherwise current uses.
    max_uses = _to_int(payload.get('max_uses'), state.current_uses)

    scales_with = str(payload.get('scales_with') or '').strip().lower()
    if scales_with == 'proficiency_bonus':
        multiplier = _to_int(payload.get('multiplier'), 1)
        min_uses = _to_int(payload.get('min_uses'), 0)
        max_uses = max(min_uses, int(character.proficiency_bonus) * max(multiplier, 1))

    level_overrides = payload.get('character_level_overrides') or {}
    if isinstance(level_overrides, dict):
        level_key = str(character.level)
        if level_key in level_overrides:
            max_uses = _to_int(level_overrides[level_key], max_uses)

    resource_override = payload.get('resource_override_max_uses')
    if resource_override is not None:
        max_uses = _to_int(resource_override, max_uses)

    max_uses = max(0, max_uses)

    override_meta = {
        'scales_with': scales_with or None,
        'character_level': character.level,
        'has_level_override': isinstance(level_overrides, dict) and str(character.level) in level_overrides,
        'has_resource_override': resource_override is not None,
    }

    return ResourceComputation(max_uses=max_uses, override_meta=override_meta)


def validate_override_payload(payload: dict) -> tuple[bool, str | None]:
    if not isinstance(payload, dict):
        return False, 'override_payload must be an object.'

    if 'max_uses' in payload and _to_int(payload.get('max_uses'), -1) < 0:
        return False, 'override_payload.max_uses must be >= 0.'

    if 'resource_override_max_uses' in payload and _to_int(payload.get('resource_override_max_uses'), -1) < 0:
        return False, 'override_payload.resource_override_max_uses must be >= 0.'

    level_overrides = payload.get('character_level_overrides')
    if level_overrides is not None and not isinstance(level_overrides, dict):
        return False, 'override_payload.character_level_overrides must be an object.'

    return True, None


def spend_feature_resource(character, state: FeatureUsageState, amount: int) -> dict:
    if amount <= 0:
        raise ValueError('amount must be greater than zero')

    computed = compute_max_uses(character, state)
    if state.current_uses > computed.max_uses:
        state.current_uses = computed.max_uses

    if state.current_uses < amount:
        raise RuntimeError('overspend')

    state.current_uses -= amount
    state.save(update_fields=['current_uses'])

    return {
        'feature_key': state.feature_key,
        'current_uses': state.current_uses,
        'max_uses': computed.max_uses,
        'spent': amount,
        'override_meta': computed.override_meta,
    }


def apply_rest_reset(character, rest_type: str) -> None:
    if rest_type == 'short':
        query = FeatureUsageState.objects.filter(
            character=character,
            recharge_type=FeatureUsageState.RECHARGE_SHORT_REST,
        )
    elif rest_type == 'long':
        query = FeatureUsageState.objects.filter(
            character=character,
            recharge_type__in=[FeatureUsageState.RECHARGE_LONG_REST, FeatureUsageState.RECHARGE_DAY],
        )
    else:
        return

    now = timezone.now()
    for usage_state in query:
        computed = compute_max_uses(character, usage_state)
        usage_state.current_uses = computed.max_uses
        usage_state.last_reset_at = now
        usage_state.save(update_fields=['current_uses', 'last_reset_at'])
