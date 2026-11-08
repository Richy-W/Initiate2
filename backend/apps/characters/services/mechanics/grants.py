"""Grant/backfill helpers for lineage and subclass spell mechanics."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from apps.characters.models import Character, GrantedSpellState


def _slugify(value: str) -> str:
    return str(value or '').strip().lower().replace("'", '').replace(' ', '-')


def _iter_unlock_spells(spell_progression: dict, character_level: int) -> Iterable[tuple[int, str]]:
    mapping = {
        1: spell_progression.get('level1') or [],
        3: spell_progression.get('level3') or [],
        5: spell_progression.get('level5') or [],
    }
    for unlock_level, raw_spells in mapping.items():
        if character_level < unlock_level:
            continue
        if isinstance(raw_spells, str):
            spells = [raw_spells]
        else:
            spells = list(raw_spells or [])
        for spell_name in spells:
            normalized = str(spell_name).strip()
            if normalized:
                yield unlock_level, normalized


def apply_lineage_spell_grants(character: Character, selected_species_options: dict | None = None) -> int:
    """Apply lineage spell grants for current level and return number of new grants.

    Idempotency is enforced by unique(character, spell_slug, source_key).
    """
    selected_species_options = selected_species_options or {}
    species_slug = _slugify(character.species.name)
    species_json_path = Path(__file__).resolve().parents[5] / 'api' / 'content' / 'species' / f'{species_slug}.json'
    if not species_json_path.exists():
        return 0

    try:
        with species_json_path.open('r', encoding='utf-8') as fp:
            species_payload = json.load(fp)
    except Exception:
        return 0

    selected_variant = str(selected_species_options.get('variant') or '').strip().lower()
    created_count = 0

    for variant in species_payload.get('variants') or []:
        if not isinstance(variant, dict):
            continue
        variant_name = str(variant.get('name') or '').strip().lower()
        if selected_variant and variant_name != selected_variant:
            continue

        progression = variant.get('spellProgression') or {}
        source_key = f"lineage:{_slugify(variant.get('name') or 'base')}"

        for unlock_level, spell_name in _iter_unlock_spells(progression, character.level):
            spell_slug = _slugify(spell_name)
            _, created = GrantedSpellState.objects.get_or_create(
                character=character,
                spell_slug=spell_slug,
                source_key=source_key,
                defaults={
                    'source_type': GrantedSpellState.SOURCE_LINEAGE,
                    'unlock_level': unlock_level,
                    'grant_version': '2024.1',
                    'free_cast_max': 1,
                    'free_cast_used': 0,
                    'uses_slots_when_free_cast_empty': True,
                },
            )
            if created:
                created_count += 1

        # Only one selected variant should apply lineage spell grants.
        if selected_variant:
            break

    return created_count
