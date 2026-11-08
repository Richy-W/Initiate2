from __future__ import annotations

from apps.characters.services.mechanics.attacks import build_natural_weapon_attack_rows
from apps.characters.services.mechanics.armor import resolve_natural_armor


def build_derived_stat_snapshot(character) -> dict:
    equipped_items = character.get_equipped_items_details() or {}
    has_armor_equipped = any(
        (slot or {}).get('equipment', {}).get('equipment_type') == 'armor'
        for slot in equipped_items.values()
    )
    has_shield_equipped = any(
        (slot or {}).get('equipment', {}).get('equipment_type') == 'shield'
        for slot in equipped_items.values()
    )

    armor_resolution = resolve_natural_armor(
        character,
        base_armor_class=character.calculated_armor_class,
        wearing_armor=has_armor_equipped,
        has_shield=has_shield_equipped,
    )

    spellcasting = (character.character_class.spellcasting or {}) if character.character_class else {}

    return {
        'ability_totals': {
            'strength': character.total_strength,
            'dexterity': character.total_dexterity,
            'constitution': character.total_constitution,
            'intelligence': character.total_intelligence,
            'wisdom': character.total_wisdom,
            'charisma': character.total_charisma,
        },
        'ability_modifiers': {
            'strength': character.strength_modifier,
            'dexterity': character.dexterity_modifier,
            'constitution': character.constitution_modifier,
            'intelligence': character.intelligence_modifier,
            'wisdom': character.wisdom_modifier,
            'charisma': character.charisma_modifier,
        },
        'proficiency_bonus': character.proficiency_bonus,
        'armor_class': armor_resolution['armor_class'],
        'armor_source_key': armor_resolution['source_key'],
        'max_hit_points': character.max_hit_points,
        'spellcasting': {
            'type': str(spellcasting.get('type') or 'none').lower(),
            'ability': str(spellcasting.get('ability') or '').lower(),
        },
        'natural_attack_rows': build_natural_weapon_attack_rows(character),
    }
