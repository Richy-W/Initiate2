from __future__ import annotations

import re


def _ability_modifier(score: int) -> int:
    return (int(score) - 10) // 2


def _evaluate_formula(formula: str, dexterity_score: int) -> int:
    cleaned = str(formula or '').lower().replace(' ', '')
    if not cleaned:
        return 10 + _ability_modifier(dexterity_score)

    dex_mod = _ability_modifier(dexterity_score)

    if cleaned in {'dex', '10+dex'}:
        return 10 + dex_mod

    if cleaned.isdigit():
        return int(cleaned)

    if 'dex' in cleaned:
        replaced = cleaned.replace('dex', str(dex_mod))
        if re.fullmatch(r'[0-9+\-]+', replaced):
            parts = re.split(r'(?=[+\-])', replaced)
            total = 0
            for part in parts:
                if part:
                    total += int(part)
            return total

    return 10 + dex_mod


def resolve_natural_armor(
    character,
    base_armor_class: int,
    wearing_armor: bool,
    has_shield: bool,
) -> dict:
    selected = {
        'armor_class': int(base_armor_class),
        'source_key': 'base',
        'used_dm_override': False,
    }

    for profile in character.natural_armor_profiles.all().order_by('precedence_rank', 'armor_key'):
        if wearing_armor and not profile.applies_when_wearing_armor:
            continue

        if has_shield and not profile.shield_allowed:
            continue

        if profile.dm_override_value is not None:
            selected = {
                'armor_class': int(profile.dm_override_value),
                'source_key': profile.source_key,
                'used_dm_override': True,
            }
            break

        computed = _evaluate_formula(profile.formula, character.total_dexterity)
        if computed > selected['armor_class']:
            selected = {
                'armor_class': computed,
                'source_key': profile.source_key,
                'used_dm_override': False,
            }

    return selected
