"""Shared parity fixture helpers for character mechanics tests."""

from __future__ import annotations


def make_subclass_state(*, class_slug: str, subclass_slug: str | None, warning_state: bool = False) -> dict:
    return {
        "class_slug": class_slug,
        "subclass_slug": subclass_slug,
        "class_content_version": "2024.1",
        "subclass_content_version": "2024.1" if subclass_slug else "",
        "warning_state": warning_state,
    }


def make_feature_usage(*, feature_key: str, source_type: str, current_uses: int, max_uses: int, recharge_type: str) -> dict:
    return {
        "feature_key": feature_key,
        "source_type": source_type,
        "current_uses": current_uses,
        "max_uses": max_uses,
        "recharge_type": recharge_type,
    }


def make_derived_stats(*, proficiency_bonus: int = 2, armor_class: int = 15, max_hit_points: int = 12) -> dict:
    return {
        "ability_totals": {
            "strength": 10,
            "dexterity": 14,
            "constitution": 12,
            "intelligence": 10,
            "wisdom": 10,
            "charisma": 10,
        },
        "ability_modifiers": {
            "strength": 0,
            "dexterity": 2,
            "constitution": 1,
            "intelligence": 0,
            "wisdom": 0,
            "charisma": 0,
        },
        "proficiency_bonus": proficiency_bonus,
        "armor_class": armor_class,
        "max_hit_points": max_hit_points,
    }
