"""Helpers for normalizing and deduplicating feature payloads."""

from __future__ import annotations


def append_unique_feature(features: list[dict], feature: dict) -> None:
    """Append feature if name+source pair is not already present."""
    name = str(feature.get('name') or '').strip().lower()
    source = str(feature.get('source') or '').strip().lower()
    if not name:
        return

    for existing in features:
        if not isinstance(existing, dict):
            continue
        existing_name = str(existing.get('name') or '').strip().lower()
        existing_source = str(existing.get('source') or '').strip().lower()
        if existing_name == name and existing_source == source:
            return

    features.append(feature)
