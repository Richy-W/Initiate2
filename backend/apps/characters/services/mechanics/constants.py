"""Canonical mechanics constants and key helpers."""

SOURCE_SPECIES = "species"
SOURCE_CLASS = "class"
SOURCE_SUBCLASS = "subclass"
SOURCE_FEAT = "feat"
SOURCE_LINEAGE_SPELL = "lineage_spell"

RECHARGE_SHORT_REST = "short_rest"
RECHARGE_LONG_REST = "long_rest"
RECHARGE_DAY = "day"


def build_feature_key(source_type: str, source_key: str, feature_name: str) -> str:
    """Return a stable feature key used for persisted usage state rows."""
    normalized_name = feature_name.strip().lower().replace(" ", "_")
    return f"{source_type}:{source_key}:{normalized_name}"
