# Contract: Character Create — Species Options Proficiency Assignment

**Feature**: `003-fix-human-origin-feat-dropdown`
**Layer**: Backend — `CharacterCreateSerializer._create_character`
**Endpoint**: `POST /api/v1/characters/`
**Relevant payload field**: `selected_species_options` (JSON object)

---

## Overview

The `selected_species_options.skillfulChoice`, `skilledSkillChoices`, and `skilledToolChoices` keys must be correctly persisted as character proficiencies during character creation. This contract defines the expected behaviour through unit tests to be written **before** implementation (per constitution Principle II).

---

## Test File

**Path**: `backend/apps/characters/tests/test_character_create_species_options.py`

---

## Setup

All tests require a fully valid character creation payload. Use a `TestCase` with a fixture or factory that provides:
- A seeded `Species` (human variant), `CharacterClass`, `Background`, and `User`
- The standard 18 `Skill` objects created via management command or fixture
- The `Character` model with `tool_proficiencies = JSONField(default=list)`

The tests call `CharacterCreateSerializer.create()` directly (not through the HTTP endpoint) with a `selected_species_options` override to isolate the proficiency assignment logic.

---

## Test Cases

### TC-001: `test_skillful_choice_adds_skill_proficiency`

**Input** `selected_species_options`:
```json
{ "skillfulChoice": "Acrobatics" }
```

**Expected outcome**:
- Character is created successfully (no exception).
- `character.skill_proficiencies.filter(name="Acrobatics").exists()` → `True`.

---

### TC-002: `test_skilled_skill_choices_add_skill_proficiencies`

**Input** `selected_species_options`:
```json
{
  "featChoice": "Skilled",
  "skilledSkillChoices": ["Arcana", "History", "Perception"],
  "skilledToolChoices": []
}
```

**Expected outcome**:
- `character.skill_proficiencies` contains Arcana, History, and Perception.
- `character.tool_proficiencies` is empty (or unchanged from default `[]`).

---

### TC-003: `test_skilled_tool_choices_add_tool_proficiencies`

**Input** `selected_species_options`:
```json
{
  "featChoice": "Skilled",
  "skilledSkillChoices": [],
  "skilledToolChoices": ["Smith's Tools", "Thieves' Tools", "Herbalism Kit"]
}
```

**Expected outcome**:
- `character.tool_proficiencies` contains `"Smith's Tools"`, `"Thieves' Tools"`, `"Herbalism Kit"`.
- `character.skill_proficiencies` does not contain any of those strings (they are not skills).

---

### TC-004: `test_skilled_mixed_skills_and_tools`

**Input** `selected_species_options`:
```json
{
  "featChoice": "Skilled",
  "skillfulChoice": "Perception",
  "skilledSkillChoices": ["Arcana", "Athletics"],
  "skilledToolChoices": ["Smith's Tools"]
}
```

**Expected outcome**:
- `character.skill_proficiencies` contains Perception (Skillful), Arcana, and Athletics (Skilled skills).
- `character.tool_proficiencies` contains `"Smith's Tools"`.
- `character.skill_proficiencies` does not contain `"Smith's Tools"`.

---

### TC-005: `test_skillful_and_skilled_skill_deduplication`

**Input** `selected_species_options` (intentionally overlapping — frontend normally prevents this, but backend must be safe):
```json
{
  "skillfulChoice": "Perception",
  "skilledSkillChoices": ["Perception", "Arcana", "History"],
  "skilledToolChoices": []
}
```

**Expected outcome**:
- `character.skill_proficiencies` contains Perception, Arcana, and History.
- Perception appears **exactly once** (deduplication via `not in selected_skills` guard).
- No exception raised.

---

### TC-006: `test_missing_new_keys_does_not_error`

**Input** `selected_species_options` (Elf — no new keys present):
```json
{
  "variant": "High Elf",
  "skillChoice": "",
  "spellcastingAbility": "Intelligence",
  "sizeCategory": "Medium",
  "featChoice": ""
}
```

**Expected outcome**:
- Character created successfully.
- `character.tool_proficiencies` equals `[]`.
- No `KeyError` or `TypeError` raised.
- Existing behaviour for other species unchanged.

---

### TC-007: `test_empty_skilled_choices_no_proficiencies_added`

**Input** `selected_species_options`:
```json
{
  "featChoice": "Skilled",
  "skilledSkillChoices": [],
  "skilledToolChoices": []
}
```

**Expected outcome**:
- No skill proficiencies added beyond what background/class selection provides.
- `character.tool_proficiencies` equals `[]`.
- Character created successfully (blank Skilled choices are not a backend validation error — frontend prevents this from reaching the API, but backend must be robust).

---

## Non-Functional Contracts

- **No new HTTP endpoint** — all changes are to the existing `POST /api/v1/characters/` contract. The `selected_species_options` key is already accepted as `JSONField(required=False)`.
- **No migration** — `Character.tool_proficiencies` (`JSONField(default=list)`) already exists. `Character.skill_proficiencies` (M2M to `Skill`) already exists.
- **Input sanitisation** — each entry in `skilledSkillChoices` and `skilledToolChoices` is stripped of whitespace and empty strings are ignored. Values that do not match any known `Skill` are silently skipped (consistent with how `selected_skill_choice` already works via `Skill.objects.filter(name__iexact=...).first()` with a no-op if `None`).
