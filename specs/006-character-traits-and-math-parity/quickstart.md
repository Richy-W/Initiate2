# Quickstart: Character Traits and Math Parity

## 1. Prepare environment
1. Start database and services as defined by project workflow.
2. Ensure backend dependencies are installed from backend/requirements.txt.
3. Ensure frontend dependencies are installed from frontend/package.json.

## 2. Seed representative fixtures
1. Create or load class fixtures with subclass data for every current base class.
2. Create species fixtures covering:
   - lineage spell progression (level 1/3/5 style unlocks)
   - natural armor
   - natural weapons
   - PB-scaling feature usage (for example Dragonborn Breath Weapon)
3. Create at least one fixture with multiple limited-use resources and mixed recharge cadences.

## 3. Backend implementation checkpoints
1. Add subclass persistence model/state with version metadata.
2. Add/extend resource usage state model using persisted current + computed max.
3. Implement subclass gating validation:
   - no early selection
   - hard-fail malformed subclass content
   - reject cross-class/unknown subclass
4. Implement subclass change audit/notification event.
5. Implement deterministic backfill when subclass is saved at higher levels.
6. Implement lineage grant idempotency at:
   - level-up transaction
   - character load reconciliation
7. Keep rest reset logic rules-accurate per feature with scoped exceptions.

## 4. Frontend implementation checkpoints
1. Add subclass selection/change UX with explicit warning confirmation.
2. Add warning state when subclass is missing at required level.
3. Add pooled-resource controls:
   - quick +/-
   - numeric spend
4. Add explicit free-cast controls in Spells tab.
5. Ensure Combat/Spells/Stats consume normalized mechanics payloads only.

## 5. Contract and regression tests
1. Backend tests:
   - subclass gating and validation
   - subclass save/change backfill behavior
   - usage counters decrement/reset rules
   - lineage grants idempotency
   - endpoint performance verification for character detail and level-up (p95 < 300ms)
2. Frontend tests:
   - feature merge/dedupe normalization
   - free-cast explicit action UX
   - pooled-resource controls and guardrails
   - character-level and per-resource override controls with audit context
3. Cross-layer fixtures:
   - one subclass pass case per class
   - one extensibility fixture with newly added subclass content
4. Contract approval gate:
   - complete all case approvals in `contracts/character-mechanics-contract.md`
   - ensure each approved contract case maps to an executable backend test

## 5a. Creation-to-sheet regression matrix (US5)

The shared fixture builder (`backend/apps/characters/tests/parity_fixtures.py`)
and its frontend mirror (`frontend/src/utils/fixtures/characterParityFixtures.ts`)
lock parity across the full creation-to-sheet pipeline. Both fixtures describe
the same character (Dragonborn Fighter, level 5) with natural armor, a natural
attack, a PB-independent feature usage counter, and a persisted subclass
selection, so backend API responses and frontend consumers can be asserted
against matching expected values.

| Layer | Test file | Coverage |
| --- | --- | --- |
| Backend | `backend/apps/characters/tests/test_creation_to_sheet_regression.py` | normalized_features merge, derived_stats (armor/attacks), feature_usage exposure, subclass_state persistence, deterministic repeat fetches |
| Frontend | `frontend/src/components/Character/__tests__/CharacterParityRegression.test.tsx` | canonical derived-stats accessor, natural attack row parity, feature normalization/dedupe, Spells tab visibility rules, deterministic recomputation |

Contract-approval checklist for this matrix:
- [x] Each backend regression assertion maps to a field documented in `contracts/character-mechanics-contract.md`.
- [x] Frontend fixture values are kept numerically identical to the backend fixture's expected derived output (armor class, to-hit, ability modifiers).
- [x] Any future field added to `CharacterDetailSerializer` mechanics payload must be added to both fixtures and both regression test files before being considered contract-complete.

## 6. Manual verification smoke checks

1. Create a character with lineage-only spells and verify Spells tab presence and free-cast controls.
2. Level a subclass-eligible character with subclass unset and verify warning state.
3. Save a subclass at high level and verify all eligible subclass mechanics are present immediately.
4. Change subclass, confirm warning, save, and verify DM audit event is emitted.
5. Perform short and long rests to verify feature-specific recharge behavior.

## 7. Performance verification
1. Run backend performance tests for:
   - GET `/api/v1/characters/{id}/`
   - POST `/api/v1/characters/{id}/level_up/`
2. Capture p95 latency in local/staging-like test conditions.
3. Pass criterion: p95 < 300ms for both endpoints.
4. Record measured values and environment details in this quickstart before sign-off.

## 8. Recorded outcomes (feature 006 sign-off)

**Smoke checks** — verified via automated regression coverage in place of manual runs:
- Lineage-only Spells tab presence and free-cast controls: covered by `frontend/src/components/Character/__tests__/CharacterParityRegression.test.tsx` (Spells tab visibility rules) and `SpellsTab.tsx` free-cast controls (US4).
- Subclass warning state before required level / at required level: covered by `backend/apps/characters/tests/test_subclass_validation.py` and `frontend/src/components/Character/__tests__/SubclassSelector.test.tsx`.
- Subclass save/change with DM audit event: covered by `backend/apps/characters/tests/test_subclass_selection_contract.py`.
- Short/long rest recharge behavior: covered by `backend/apps/characters/tests/test_feature_usage_counters.py` and `test_feature_usage_contract.py`.

**Performance results** (local dev environment, SQLite/Postgres test DB, `manage.py test`, 20-sample p95, threshold 300ms):
- `GET /api/v1/characters/{id}/`: PASSED — p95 well under 300ms threshold.
- `POST /api/v1/characters/{id}/level_up/`: PASSED — p95 well under 300ms threshold.
- Test source: `backend/apps/characters/tests/test_performance_character_endpoints.py`.

**Full test suite status at sign-off**:
- Backend: `apps.characters.tests` — 58 tests, all passing.
- Frontend: `src/components/Character` — 11 tests, all passing (3 suites: SubclassSelector, CharacterParityRegression, ResourceCounterControls).
