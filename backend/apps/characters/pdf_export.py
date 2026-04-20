from __future__ import annotations

from typing import Any

from django.template.loader import render_to_string

from .models import Character


def _signed(value: int) -> str:
    return f"{value:+d}"


def _ability_rows(character: Character) -> list[dict[str, Any]]:
    return [
        {
            "label": "STR",
            "score": character.total_strength,
            "modifier": _signed(character.strength_modifier),
        },
        {
            "label": "DEX",
            "score": character.total_dexterity,
            "modifier": _signed(character.dexterity_modifier),
        },
        {
            "label": "CON",
            "score": character.total_constitution,
            "modifier": _signed(character.constitution_modifier),
        },
        {
            "label": "INT",
            "score": character.total_intelligence,
            "modifier": _signed(character.intelligence_modifier),
        },
        {
            "label": "WIS",
            "score": character.total_wisdom,
            "modifier": _signed(character.wisdom_modifier),
        },
        {
            "label": "CHA",
            "score": character.total_charisma,
            "modifier": _signed(character.charisma_modifier),
        },
    ]


def render_character_sheet_pdf(character: Character, base_url: str) -> bytes:
    try:
        from weasyprint import HTML
    except Exception as exc:
        raise RuntimeError(
            'PDF export dependencies are not available on this environment.'
        ) from exc

    context = {
        "character": character,
        "ability_rows": _ability_rows(character),
        "proficiency_bonus": _signed(character.proficiency_bonus),
        "initiative": _signed(character.initiative),
    }

    html_string = render_to_string("characters/character_sheet.html", context)
    return HTML(string=html_string, base_url=base_url).write_pdf()
