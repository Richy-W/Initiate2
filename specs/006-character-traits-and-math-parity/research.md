# Research: Character Traits and Math Parity

## Decision 1: Canonical mechanics resolution runs in backend with normalized payload to frontend
- Decision: Compute canonical grants, counters, and derived mechanics in backend character pipelines, then expose normalized structures consumed by all frontend panels.
- Rationale: Prevents drift between frontend recomputation paths and backend state, improves consistency for AC/HP/spells/attacks/counters.
- Alternatives considered:
  - Frontend-first calculations per panel: rejected due to divergence risk and duplicate logic.
  - Mixed ownership by mechanic type: rejected due to hard-to-test split authority.

## Decision 2: Subclass persistence uses identifier plus version metadata
- Decision: Persist subclass identity with class/subclass content version markers.
- Rationale: Keeps records queryable while supporting deterministic replay and migration targeting after content updates.
- Alternatives considered:
  - Identifier only: rejected because historical rule version becomes ambiguous.
  - Full snapshot: rejected due to duplication and drift risk.

## Decision 3: Subclass change workflow is player-enabled with warnings and DM audit notification
- Decision: Allow subclass changes via UI confirmation; emit DM-facing audit event on successful save.
- Rationale: Supports build experimentation while preserving oversight and traceability.
- Alternatives considered:
  - DM-only edits: rejected as too restrictive for intended UX.
  - No warnings: rejected due to accidental destructive changes.

## Decision 4: Missing subclass at/above selection level is warning state, not hard block
- Decision: Allow play/progression with warning; when subclass is saved, backfill all unlocked subclass mechanics through current level.
- Rationale: Avoids hard lockouts while preserving eventual mechanical correctness.
- Alternatives considered:
  - Hard block load/level-up: rejected due to poor usability for remediation cases.

## Decision 5: Resource counters use hybrid state model
- Decision: Persist current values per resource key; compute max values from canonical rules/content and character level/PB.
- Rationale: Fast mutations with reliable max recomputation and lower desync risk.
- Alternatives considered:
  - Event-sourced only: rejected for complexity overhead in current scope.
  - Fully static persisted max/current: rejected because level/PB scaling becomes brittle.

## Decision 6: Recharge cadence follows RAW per feature with explicit scoped exceptions
- Decision: Enforce short/long rest cadence per feature definition; keep existing scoped override that once-per-day and lineage free-cast reset on Long Rest.
- Rationale: Maintains rules parity while respecting prior product decision.
- Alternatives considered:
  - Normalize all class resources to Long Rest: rejected as rules drift.

## Decision 7: Lineage grant lifecycle is level-up plus load-time idempotent backfill
- Decision: Apply lineage grants during authoritative level-up and rerun idempotent backfill on character load.
- Rationale: Covers both real-time transitions and legacy/missed state healing without duplicates.
- Alternatives considered:
  - Level-up only: rejected due to migration/recovery gaps.
  - Load-time only: rejected due to delayed consistency.

## Decision 8: Free-cast consumption is explicit user action
- Decision: Spells tab must provide explicit free-cast control rather than automatic consumption.
- Rationale: Preserves player intent and reduces accidental resource spend.
- Alternatives considered:
  - Auto-consume free cast first: rejected due to poor user control.
  - Prompt every cast: deferred; explicit control is simpler and deterministic.

## Decision 9: Subclass content validation hard-fails selection
- Decision: Malformed/incomplete subclass definitions are not selectable and return actionable validation errors.
- Rationale: Prevents broken mechanics from entering active characters.
- Alternatives considered:
  - Warning-only selection: rejected because broken runtime behavior leaks into play.
  - Placeholder fallback mechanics: rejected due to rules inaccuracy.

## Decision 10: DM overrides support character-level and feature/resource-level scope
- Decision: Support both override scopes with audit metadata.
- Rationale: Allows precise intervention without campaign-wide policy complexity.
- Alternatives considered:
  - Character-only: rejected as too coarse.
  - Add campaign defaults now: deferred to later story.

## Decision 11: Legacy migration uses deterministic inference with safe fallback
- Decision: Infer subclass from existing class/feature evidence when confidence is deterministic; otherwise leave unset with explicit warning.
- Rationale: Minimizes player disruption and avoids unsafe assumptions.
- Alternatives considered:
  - Force null for all legacy rows: acceptable but less user-friendly.
  - Force pre-release manual migration only: rejected as unnecessary for near-empty dataset.

## Decision 12: Contract-first implementation and regression fixtures are mandatory
- Decision: Introduce explicit mechanics contracts and class-by-class/subclass fixtures before implementation completion.
- Rationale: Required by constitution TDD and needed to prevent future parity regressions.
- Alternatives considered:
  - Ad-hoc manual testing only: rejected for long-term maintainability.

## Implementation Notes and Onboarding (post-implementation)

These notes capture how the decisions above were actually realized, for engineers onboarding to this feature area.

- **Mechanics services module**: All canonical mechanics logic lives under `backend/apps/characters/services/mechanics/` as small, single-purpose modules (`derived_stats.py`, `attacks.py`, `armor.py`, `resources.py`, `subclass.py`, `grants.py`), re-exported through `services/mechanics/__init__.py`. New mechanics should follow this pattern rather than growing `views.py` or `serializers.py` further.
- **Derived stats snapshot**: `build_derived_stat_snapshot(character)` is the single source of truth for ability totals/modifiers, proficiency bonus, armor class (natural armor precedence + DM override), max HP, spellcasting metadata, and natural attack rows. It is exposed via `CharacterDetailSerializer.derived_stats` and must be consumed as-is by frontend panels (`getCanonicalDerivedStats()` in `frontend/src/utils/characterMathParity.ts`) rather than recomputed independently.
- **Natural armor precedence**: `resolve_natural_armor()` iterates `NaturalArmorProfile` rows ordered by `precedence_rank`, honors `dm_override_value` first, then evaluates simple formula strings (`"dex"`, `"N+dex"`, numeric literals) and keeps the highest computed AC.
- **Resource counters**: `compute_max_uses()` in `resources.py` supports PB-scaling (`scales_with='proficiency_bonus'`), per-character-level overrides (`character_level_overrides`), and an explicit `resource_override_max_uses` — all validated via `validate_override_payload()` before persistence. Override writes require `request.user.is_staff` (enforced in `views.resource_spend`); there is no separate DM/staff bypass in `CharacterViewSet.get_queryset()`, so staff-only test scenarios must grant `is_staff=True` to the character's own owning user.
- **Subclass framework**: `services/mechanics/subclass.py` centralizes class-content loading, subclass definition lookup, timing validation (`character.level >= class.subclass_level`), and resource backfill (`backfill_subclass_resources()` creates `FeatureUsageState` rows from a subclass's `mechanics.resources` content array). The `subclass` action in `views.py` delegates to these functions rather than inlining validation. `CharacterSubclassState`/`SubclassChangeAuditEvent` models were already introduced under migration `0007_character_mechanics_foundation.py` in earlier work — no separate `0008` migration was needed.
- **Legacy backfill**: `management/commands/migrate_subclass_state.py` infers `subclass_slug` for characters missing `CharacterSubclassState` rows from `character.features` entries tagged `source: "subclass"`; ambiguous/legacy characters are left with `subclass_slug=None` rather than guessed.
- **Frontend subclass UX**: `LevelUp.tsx` conditionally inserts a "Subclass" step when the character reaches `character_class.subclass_level` with no existing `subclass_state.subclass_slug`. Changing an existing subclass requires an explicit warning-confirmation checkbox before the Next/Confirm button is enabled. Selection is submitted via `characterAPI.setSubclass()` alongside the level-up call.
- **Regression fixtures**: `backend/apps/characters/tests/parity_fixtures.py` and `frontend/src/utils/fixtures/characterParityFixtures.ts` describe the same representative character (Dragonborn Fighter, level 5, with natural armor/attack, one PB-scaled-independent resource counter, and a persisted subclass) and must be kept numerically in sync — any new mechanics field added to `CharacterDetailSerializer` should be added to both fixtures and their respective regression test files (`test_creation_to_sheet_regression.py`, `CharacterParityRegression.test.tsx`).
- **Performance baseline**: `test_performance_character_endpoints.py` asserts p95 latency < 300ms for `GET /characters/{id}/` and `POST /characters/{id}/level_up/` over 20 samples in the local Django test client; both passed comfortably at feature sign-off.

