from __future__ import annotations

import json
from pathlib import Path

from apps.characters.models import FeatureUsageState

CONTENT_VERSION = '2024.1'


def _content_root() -> Path:
    return Path(__file__).resolve().parents[5] / 'api' / 'content' / 'classes'


def load_class_content(class_slug: str) -> dict:
    path = _content_root() / f'{class_slug}.json'
    if not path.exists():
        return {}
    try:
        with path.open('r', encoding='utf-8') as fp:
            return json.load(fp)
    except Exception:
        return {}


def find_subclass_definition(class_json: dict, subclass_slug: str) -> dict | None:
    for entry in class_json.get('subclasses') or []:
        if not isinstance(entry, dict):
            continue
        slug = str(entry.get('name', '')).strip().lower().replace(' ', '-')
        if slug == subclass_slug:
            return entry
    return None


def validate_subclass_timing(character, class_json: dict) -> tuple[bool, str | None]:
    required_level = int(class_json.get('subclass_level') or getattr(character.character_class, 'subclass_level', 3) or 3)
    if character.level < required_level:
        return False, f'Subclass cannot be selected before level {required_level}.'
    return True, None


def backfill_subclass_resources(character, subclass_definition: dict) -> None:
    resources = ((subclass_definition or {}).get('mechanics') or {}).get('resources') or []

    recharge_map = {
        'short_rest': FeatureUsageState.RECHARGE_SHORT_REST,
        'long_rest': FeatureUsageState.RECHARGE_LONG_REST,
        'day': FeatureUsageState.RECHARGE_DAY,
    }

    for resource in resources:
        if not isinstance(resource, dict):
            continue

        key = str(resource.get('key') or '').strip()
        if not key:
            continue

        max_uses = int(resource.get('maxUses') or 0)
        recharge_type = recharge_map.get(str(resource.get('recharge') or '').strip(), FeatureUsageState.RECHARGE_CUSTOM)
        feature_key = f'subclass:{key}'

        FeatureUsageState.objects.get_or_create(
            character=character,
            feature_key=feature_key,
            defaults={
                'source_type': FeatureUsageState.SOURCE_SUBCLASS,
                'current_uses': max_uses,
                'recharge_type': recharge_type,
                'override_payload': {'max_uses': max_uses},
            },
        )
