from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any

from django.http import QueryDict
from django.utils.html import strip_tags

_SCRIPT_BLOCK_RE = re.compile(r"<\s*(script|style)[^>]*>.*?<\s*/\s*\1\s*>", re.IGNORECASE | re.DOTALL)
_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")


def sanitize_string(value: str) -> str:
    """Normalize potentially unsafe user input while preserving readable content."""
    without_blocks = _SCRIPT_BLOCK_RE.sub("", value)
    without_tags = strip_tags(without_blocks)
    without_controls = _CONTROL_CHAR_RE.sub("", without_tags)
    return without_controls.strip()


def sanitize_payload(value: Any) -> Any:
    """Recursively sanitize request payload values used by API endpoints."""
    if isinstance(value, str):
        return sanitize_string(value)

    if isinstance(value, list):
        return [sanitize_payload(item) for item in value]

    if isinstance(value, Mapping):
        return {key: sanitize_payload(item) for key, item in value.items()}

    return value


def sanitize_querydict(querydict: QueryDict) -> QueryDict:
    """Return a sanitized mutable QueryDict copy."""
    cleaned = querydict.copy()

    for key, values in cleaned.lists():
        cleaned.setlist(key, [sanitize_string(value) if isinstance(value, str) else value for value in values])

    return cleaned
