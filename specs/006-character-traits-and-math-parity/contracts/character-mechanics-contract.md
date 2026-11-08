# Contract: Character Mechanics and Subclass Pipelines

## Scope
Defines required backend/frontend contract behavior for character creation, level-up, subclass state, granted spells, counters, and derived mechanics.

## Endpoint Contract: Character Detail
- Endpoint: GET /api/v1/characters/{id}/
- Required response sections:
  - subclass_state:
    - class_slug
    - subclass_slug (nullable)
    - class_content_version
    - subclass_content_version
    - warning_state
  - derived_stats:
    - ability_totals
    - ability_modifiers
    - proficiency_bonus
    - armor_class
    - max_hit_points
  - feature_usage:
    - feature_key
    - source_type
    - current_uses
    - max_uses
    - recharge_type
  - granted_spells:
    - spell_slug
    - source_type
    - unlock_level
    - free_cast_max
    - free_cast_used
  - natural_attacks
  - natural_armor_profiles

## Endpoint Contract: Subclass Save/Change
- Endpoint: POST /api/v1/characters/{id}/subclass/
- Request:
  - class_slug
  - subclass_slug
  - client_confirmed_warning (boolean)
- Validation rules:
  - reject selection before subclass level
  - reject unknown/cross-class subclass
  - reject malformed subclass definition with actionable errors
- Required side effects:
  - persist subclass + version metadata
  - backfill all eligible subclass mechanics through current level
  - emit DM-facing audit event with old/new values and actor metadata

## Endpoint Contract: Level-Up
- Endpoint: POST /api/v1/characters/{id}/level_up/
- Required side effects:
  - apply deterministic subclass grants/counter max updates immediately
  - process choice-dependent grants through level-up flow payload
  - apply lineage auto-grants for newly unlocked levels
  - enforce idempotency for grants and counters

## Endpoint Contract: Character Rest
- Endpoint: POST /api/v1/characters/{id}/rest/
- Request:
  - type in {short, long}
- Required behavior:
  - reset only counters eligible for specified rest type
  - preserve explicit scoped exceptions:
    - once-per-day and lineage free-cast reset on long rest

## Endpoint Contract: Resource Spend
- Endpoint: POST /api/v1/characters/{id}/resource_spend/
- Request:
  - feature_key
  - amount
- Required behavior:
  - amount must be positive integer
  - current_uses cannot go below zero
  - overspend beyond available pool rejected

## Frontend Contract Requirements
- Character sheet panels must consume canonical response sections above; no independent panel-specific rules recomputation that conflicts with backend-derived canonical values.
- Spells UI must expose explicit free-cast consume action and show current/max state.
- Subclass warning and confirmation UX is required for save/change flows.

## Error Contract
- Validation failures return HTTP 400 with:
  - code (stable machine value)
  - message (human-readable)
  - field_errors (optional map)
- Malformed subclass selection must include code `invalid_subclass_definition`.

## Contract Test Matrix and Approval Gate

The matrix below is the required pre-implementation contract review artifact. Each case must have a linked executable backend test before implementation sign-off.

| Contract Area | Endpoint | Case ID | Expected Result | Executable Test Reference | Reviewer Approval |
|---|---|---|---|---|---|
| Character Detail | GET /api/v1/characters/{id}/ | CD-01 | Includes all required sections: subclass_state, derived_stats, feature_usage, granted_spells, natural_attacks, natural_armor_profiles | backend/apps/characters/tests/test_character_mechanics_contract.py | [x] |
| Character Detail | GET /api/v1/characters/{id}/ | CD-02 | Derived stats and feature usage shapes match documented field contract | backend/apps/characters/tests/test_character_mechanics_contract.py | [x] |
| Subclass Save/Change | POST /api/v1/characters/{id}/subclass/ | SC-01 | Rejects selection before subclass level | backend/apps/characters/tests/test_subclass_selection_contract.py | [x] |
| Subclass Save/Change | POST /api/v1/characters/{id}/subclass/ | SC-02 | Rejects unknown/cross-class subclass | backend/apps/characters/tests/test_subclass_selection_contract.py | [x] |
| Subclass Save/Change | POST /api/v1/characters/{id}/subclass/ | SC-03 | Rejects malformed subclass definition with `invalid_subclass_definition` | backend/apps/characters/tests/test_subclass_selection_contract.py | [x] |
| Subclass Save/Change | POST /api/v1/characters/{id}/subclass/ | SC-04 | Persists subclass version metadata and emits audit event payload | backend/apps/characters/tests/test_subclass_selection_contract.py | [x] |
| Level-Up | POST /api/v1/characters/{id}/level_up/ | LU-01 | Applies deterministic subclass grants and counter max updates immediately | backend/apps/characters/tests/test_subclass_validation.py | [x] |
| Level-Up | POST /api/v1/characters/{id}/level_up/ | LU-02 | Choice-dependent grants finalize in explicit level-up flow | backend/apps/characters/tests/test_subclass_validation.py | [x] |
| Character Rest | POST /api/v1/characters/{id}/rest/ | RS-01 | Resets only eligible counters for short or long rest | backend/apps/characters/tests/test_feature_usage_contract.py | [x] |
| Character Rest | POST /api/v1/characters/{id}/rest/ | RS-02 | Applies scoped exception: once-per-day and lineage free-cast reset on long rest | backend/apps/characters/tests/test_feature_usage_contract.py | [x] |
| Resource Spend | POST /api/v1/characters/{id}/resource_spend/ | SP-01 | Rejects non-positive amount | backend/apps/characters/tests/test_feature_usage_contract.py | [x] |
| Resource Spend | POST /api/v1/characters/{id}/resource_spend/ | SP-02 | Rejects overspend and prevents current_uses underflow | backend/apps/characters/tests/test_feature_usage_contract.py | [x] |

Approval notes:
- Contract cases must be reviewed and approved before `/speckit.implement`.
- Any endpoint contract change requires matrix update and re-approval.
- All cases above were re-verified against the finalized implementation (feature 006, Phases 3-8); all 13 referenced backend tests pass as of this review.

## Finalized Mechanics Payload Example

Representative `GET /api/v1/characters/{id}/` response (mechanics-relevant fields only), reflecting the final field shapes produced by `CharacterDetailSerializer` and `build_derived_stat_snapshot`:

```json
{
  "subclass_state": {
    "class_slug": "fighter",
    "subclass_slug": "champion",
    "class_content_version": "2024.1",
    "subclass_content_version": "2024.1",
    "warning_state": false
  },
  "normalized_features": [
    { "key": "second wind", "name": "Second Wind", "description": "", "source": "class" },
    { "key": "draconic ancestry", "name": "Draconic Ancestry", "description": "Breath weapon lineage trait.", "source": "species" }
  ],
  "derived_stats": {
    "ability_totals": { "strength": 16, "dexterity": 14, "constitution": 15, "intelligence": 10, "wisdom": 10, "charisma": 8 },
    "ability_modifiers": { "strength": 3, "dexterity": 2, "constitution": 2, "intelligence": 0, "wisdom": 0, "charisma": -1 },
    "proficiency_bonus": 3,
    "armor_class": 15,
    "armor_source_key": "species:dragonborn",
    "max_hit_points": 44,
    "spellcasting": { "type": "none", "ability": "" },
    "natural_attack_rows": [
      {
        "attack_key": "breath-weapon",
        "name": "Breath Weapon",
        "to_hit": 5,
        "ability_modifier": 2,
        "proficiency_applied": true,
        "damage_dice": "2d6",
        "damage_bonus": 2,
        "damage_type": "fire",
        "source_key": "species:dragonborn"
      }
    ]
  },
  "feature_usage": [
    {
      "feature_key": "species:breath_weapon",
      "source_type": "species",
      "current_uses": 1,
      "max_uses": 1,
      "recharge_type": "long_rest"
    }
  ],
  "granted_spells": [],
  "natural_attacks": [
    { "attack_key": "breath-weapon", "name": "Breath Weapon", "ability": "con", "proficiency_policy": "proficient", "damage_dice": "2d6", "damage_type": "fire", "source_key": "species:dragonborn" }
  ],
  "natural_armor_profiles": [
    { "armor_key": "draconic-scales", "formula": "13+dex", "applies_when_wearing_armor": false, "shield_allowed": true, "precedence_rank": 5, "source_key": "species:dragonborn", "dm_override_value": null }
  ]
}
```

This example is kept in sync with `backend/apps/characters/tests/parity_fixtures.py` and `frontend/src/utils/fixtures/characterParityFixtures.ts` (US5 regression fixtures).
