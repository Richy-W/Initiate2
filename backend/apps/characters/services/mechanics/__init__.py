"""Shared mechanics helpers for character canonical calculations."""

from .constants import (
    RECHARGE_DAY,
    RECHARGE_LONG_REST,
    RECHARGE_SHORT_REST,
    SOURCE_CLASS,
    SOURCE_FEAT,
    SOURCE_LINEAGE_SPELL,
    SOURCE_SPECIES,
    SOURCE_SUBCLASS,
)
from .derived_stats import build_derived_stat_snapshot
from .attacks import normalize_weapon_proficiency_match, build_natural_weapon_attack_rows
from .armor import resolve_natural_armor

__all__ = [
    "RECHARGE_DAY",
    "RECHARGE_LONG_REST",
    "RECHARGE_SHORT_REST",
    "SOURCE_CLASS",
    "SOURCE_FEAT",
    "SOURCE_LINEAGE_SPELL",
    "SOURCE_SPECIES",
    "SOURCE_SUBCLASS",
    "build_derived_stat_snapshot",
    "normalize_weapon_proficiency_match",
    "build_natural_weapon_attack_rows",
    "resolve_natural_armor",
]
