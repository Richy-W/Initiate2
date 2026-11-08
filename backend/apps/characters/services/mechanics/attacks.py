from __future__ import annotations

from typing import Iterable


ABILITY_TO_ATTR = {
    'str': 'strength_modifier',
    'dex': 'dexterity_modifier',
    'con': 'constitution_modifier',
    'int': 'intelligence_modifier',
    'wis': 'wisdom_modifier',
    'cha': 'charisma_modifier',
}


def normalize_weapon_proficiency_match(
    weapon_name: str,
    weapon_category: str,
    weapon_proficiencies: Iterable[str] | None,
) -> bool:
    name = str(weapon_name or '').strip().lower()
    category = str(weapon_category or '').strip().lower()
    profs = [str(p or '').strip().lower() for p in (weapon_proficiencies or []) if str(p or '').strip()]

    if not profs:
        return False

    if 'all' in profs or 'all weapons' in profs:
        return True

    for prof in profs:
        if prof in name:
            return True

    if 'simple' in category and any(p in {'simple', 'simple weapons'} for p in profs):
        return True

    if 'martial' in category and any(p in {'martial', 'martial weapons'} for p in profs):
        return True

    if 'ranged' in category and any(p in {'ranged', 'ranged weapons'} for p in profs):
        return True

    if 'melee' in category and any(p in {'melee', 'melee weapons'} for p in profs):
        return True

    return False


def build_natural_weapon_attack_rows(character) -> list[dict]:
    rows: list[dict] = []
    for profile in character.natural_attack_profiles.all().order_by('name'):
        ability_attr = ABILITY_TO_ATTR.get((profile.ability or '').lower(), 'strength_modifier')
        ability_mod = int(getattr(character, ability_attr, 0))

        if profile.proficiency_policy == 'proficient':
            prof_bonus = int(character.proficiency_bonus)
        elif profile.proficiency_policy == 'conditional':
            prof_bonus = int(character.proficiency_bonus)
        else:
            prof_bonus = 0

        rows.append(
            {
                'attack_key': profile.attack_key,
                'name': profile.name,
                'to_hit': ability_mod + prof_bonus,
                'ability_modifier': ability_mod,
                'proficiency_applied': prof_bonus > 0,
                'damage_dice': profile.damage_dice,
                'damage_bonus': ability_mod,
                'damage_type': profile.damage_type,
                'source_key': profile.source_key,
            }
        )

    return rows
