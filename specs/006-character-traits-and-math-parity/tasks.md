# Tasks: Character Traits and Math Parity

**Input**: Design documents from `/specs/006-character-traits-and-math-parity/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/character-mechanics-contract.md ✅, quickstart.md ✅

**Tests**: Included and required by spec (FR-017, FR-025) and constitution TDD requirements.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Task can run in parallel (independent files, no incomplete dependency)
- **[US#]**: User story label for story-phase tasks only
- Every task includes at least one exact file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create shared scaffolding and fixtures used by all stories.

- [X] T001 Create mechanics service package scaffolding in `backend/apps/characters/services/mechanics/__init__.py`
- [X] T002 [P] Add canonical mechanics response types in `frontend/src/types/characterMechanics.ts`
- [X] T003 [P] Add shared character parity fixture helpers in `backend/apps/characters/tests/factories.py`
- [X] T004 [P] Add subclass/extensibility content fixture seed in `api/content/classes/subclass-extensibility-fixture.json`
- [X] T005 Add feature-usage key conventions and constants in `backend/apps/characters/services/mechanics/constants.py`

**Checkpoint**: Shared mechanics scaffolding and fixtures exist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build canonical mechanics contract surfaces that all user stories depend on.

**CRITICAL**: No user-story implementation starts before this phase is complete.

- [X] T006 [P] Add contract approval matrix in `specs/006-character-traits-and-math-parity/contracts/character-mechanics-contract.md` and character detail executable contract tests in `backend/apps/characters/tests/test_character_mechanics_contract.py`
- [X] T007 [P] Add subclass save/change contract tests in `backend/apps/characters/tests/test_subclass_selection_contract.py`
- [X] T008 [P] Add rest/resource spend contract tests in `backend/apps/characters/tests/test_feature_usage_contract.py`
- [X] T009 Implement normalized mechanics persistence models in `backend/apps/characters/models.py`
- [X] T010 Create foundational migration for mechanics state tables in `backend/apps/characters/migrations/0007_character_mechanics_foundation.py`
- [X] T011 Implement canonical mechanics serializers for detail payloads in `backend/apps/characters/serializers.py`
- [X] T012 Implement foundational mechanics endpoints in `backend/apps/characters/views.py`
- [X] T013 Register subclass/resource endpoints in `backend/apps/characters/urls.py`

**Checkpoint**: Backend exposes stable canonical mechanics payload and endpoints required by all stories.

---

## Phase 3: User Story 1 - Character Creation Applies Species/Class Choices Correctly (Priority: P1) 🎯 MVP

**Goal**: Ensure creation selections persist canonically and immediately produce correct mechanics.

**Independent Test**: Create representative species/class characters and verify persisted selections and mechanics in character detail payload.

### Tests for User Story 1

- [X] T014 [P] [US1] Extend species/class option persistence tests in `backend/apps/characters/tests/test_character_create_species_options.py`
- [X] T015 [P] [US1] Add lineage spell auto-grant and idempotency tests in `backend/apps/characters/tests/test_lineage_spell_grants.py`

### Implementation for User Story 1

- [X] T016 [US1] Implement canonical build-option persistence mapping in `backend/apps/characters/serializers.py`
- [X] T017 [US1] Implement idempotent lineage grant pipeline for create and load-time backfill in `backend/apps/characters/services/mechanics/grants.py`
- [X] T018 [US1] Apply origin feat mechanics without duplicate stacking in `backend/apps/characters/services/mechanics/features.py`
- [X] T019 [US1] Expose normalized granted spells metadata on detail responses in `backend/apps/characters/serializers.py`

**Checkpoint**: Creation-to-detail parity for species/class/origin choices is testable and stable.

---

## Phase 4: User Story 2 - Character Page Shows Complete Traits and Features by Source (Priority: P1)

**Goal**: Feature panel displays complete, deduplicated, source-labeled traits and features.

**Independent Test**: Load a character with mixed class/species/feat/background features and verify complete deduplicated rendering with correct source tags.

### Tests for User Story 2

- [X] T020 [P] [US2] Add backend feature-source normalization tests in `backend/apps/characters/tests/test_feature_source_normalization.py`
- [X] T021 [P] [US2] Add frontend feature merge/dedupe tests in `frontend/src/utils/__tests__/featureNormalization.test.ts`

### Implementation for User Story 2

- [X] T022 [US2] Emit stable class feature structures for all consumers in `backend/apps/characters/serializers.py`
- [X] T023 [US2] Implement frontend feature normalization/deduplication utility in `frontend/src/utils/featureNormalization.ts`
- [X] T024 [US2] Refactor character feature panel to consume normalized feature view model in `frontend/src/components/Character/CharacterSheet.tsx`
- [X] T025 [US2] Add source label and uniqueness key typing in `frontend/src/types/characterMechanics.ts`

**Checkpoint**: Character page feature list is complete, deduplicated, and source-accurate.

---

## Phase 5: User Story 3 - Derived Math Is Consistent Across Sheet Panels (Priority: P1)

**Goal**: Use one canonical derived-stat model for stats, attacks, spells, AC, and HP.

**Independent Test**: Validate displayed values against deterministic fixtures for martial, caster, monk/barbarian, natural armor, and lineage-granted spell builds.

### Tests for User Story 3

- [X] T026 [P] [US3] Add backend derived-stat parity tests in `backend/apps/characters/tests/test_derived_stats_parity.py`
- [X] T027 [P] [US3] Add frontend cross-panel math parity tests in `frontend/src/utils/__tests__/characterMathParity.test.ts`

### Implementation for User Story 3

- [X] T028 [US3] Implement canonical derived stat snapshot builder in `backend/apps/characters/services/mechanics/derived_stats.py`
- [X] T029 [US3] Implement normalized weapon proficiency matching for simple/martial categories in `backend/apps/characters/services/mechanics/attacks.py`
- [X] T030 [US3] Implement natural armor precedence with DM override resolution in `backend/apps/characters/services/mechanics/armor.py`
- [X] T031 [US3] Implement natural weapon attack row generation in `backend/apps/characters/services/mechanics/attacks.py`
- [X] T032 [US3] Wire canonical derived stats into combat/stat/spell panels in `frontend/src/components/Character/AttackRolls.tsx`
- [X] T033 [US3] Ensure lineage-only non-casters get a Spells tab in `frontend/src/components/Character/CharacterSheet.tsx`

**Checkpoint**: All displayed character math is canonical and panel-consistent.

---

## Phase 6: User Story 4 - Trait Counters and Recharge Rules Are Trackable (Priority: P1)

**Goal**: Make limited-use resources trackable with rules-accurate decrement/reset behavior.

**Independent Test**: Use mixed-cadence fixture characters and verify counter decrement, floor-at-zero rules, PB scaling, and short/long-rest reset behavior.

### Tests for User Story 4

- [X] T034 [P] [US4] Add backend feature usage decrement/reset tests including PB-scaling breath weapon, character-level override behavior, and per-resource override audit metadata in `backend/apps/characters/tests/test_feature_usage_counters.py`
- [X] T035 [P] [US4] Add frontend pooled-resource and override-control tests for quick +/- numeric spend and both override scopes in `frontend/src/components/Character/__tests__/ResourceCounterControls.test.tsx`

### Implementation for User Story 4

- [X] T036 [US4] Implement hybrid max-use computation/current-use validation plus character-level and per-resource override resolution in `backend/apps/characters/services/mechanics/resources.py`
- [X] T037 [US4] Implement rules-accurate rest reset handling with scoped exceptions in `backend/apps/characters/views.py`
- [X] T038 [US4] Implement resource spend and override endpoint guards against overspend/negative state, invalid override payloads, and unauthorized override writes in `backend/apps/characters/views.py`
- [X] T039 [US4] Add explicit free-cast consume controls in Spells tab in `frontend/src/components/Character/SpellsTab.tsx`
- [X] T040 [US4] Add pooled-resource controls component for quick +/- and numeric spend plus character-level and per-resource override controls with audit context in `frontend/src/components/Character/ResourceCounterControls.tsx`

**Checkpoint**: Counters and resets are rules-accurate and directly usable in the UI.

---

## Phase 7: User Story 6 - Modular Subclass Framework with Baseline Coverage (Priority: P1)

**Goal**: Deliver data-driven subclass selection/persistence/mechanics with baseline coverage for each class.

**Independent Test**: For each class, select subclass at valid level and verify mechanics; add synthetic subclass content and confirm no core code changes are required.

### Tests for User Story 6

- [X] T041 [P] [US6] Add subclass timing and cross-class validation tests in `backend/apps/characters/tests/test_subclass_validation.py`
- [X] T042 [P] [US6] Add per-class baseline subclass and extensibility fixture tests in `backend/apps/characters/tests/test_subclass_extensibility.py`
- [X] T043 [P] [US6] Add frontend subclass warning/confirmation flow tests in `frontend/src/components/Character/__tests__/SubclassSelector.test.tsx`

### Implementation for User Story 6

- [X] T044 [US6] Add subclass state and change-audit models in `backend/apps/characters/models.py` (delivered previously via migration 0007 — `CharacterSubclassState`/`SubclassChangeAuditEvent` already present)
- [X] T045 [US6] Add migration for subclass state/version metadata and audit records (delivered previously as `backend/apps/characters/migrations/0007_character_mechanics_foundation.py`; no separate 0008 migration was needed since the models already existed)
- [X] T046 [US6] Implement subclass content validation and version-pinned resolution in `backend/apps/characters/services/mechanics/subclass.py`
- [X] T047 [US6] Implement subclass save/change endpoint with DM audit event emission in `backend/apps/characters/views.py`
- [X] T048 [US6] Implement subclass backfill through current level plus immediate deterministic grants in `backend/apps/characters/services/mechanics/subclass.py`
- [X] T049 [US6] Implement legacy subclass inference migration command in `backend/apps/characters/management/commands/migrate_subclass_state.py`
- [X] T050 [US6] Implement subclass selection/change warning UX in `frontend/src/components/Character/LevelUp.tsx`

**Checkpoint**: Subclass system is modular, validated, audited, and extensible.

---

## Phase 8: User Story 5 - Regression Coverage for Creation-to-Sheet Pipeline (Priority: P2)

**Goal**: Lock behavior with cross-layer regression tests for persistence, normalization, and math parity.

**Independent Test**: Run backend and frontend regression suites and verify deterministic parity outputs against fixtures.

### Tests for User Story 5

- [X] T051 [P] [US5] Add backend creation-to-sheet regression suite in `backend/apps/characters/tests/test_creation_to_sheet_regression.py`
- [X] T052 [P] [US5] Add frontend character parity regression suite in `frontend/src/components/Character/__tests__/CharacterParityRegression.test.tsx`

### Implementation for User Story 5

- [X] T053 [US5] Add shared backend parity fixture loader in `backend/apps/characters/tests/parity_fixtures.py`
- [X] T054 [US5] Add frontend parity fixture payloads in `frontend/src/utils/fixtures/characterParityFixtures.ts` (moved out of `__tests__` to avoid Jest picking it up as a test suite)
- [X] T055 [US5] Document regression matrix, contract-approval checklist, and performance check expectations in `specs/006-character-traits-and-math-parity/quickstart.md`

**Checkpoint**: Regression coverage protects the full creation-to-sheet pipeline.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, docs sync, and release-readiness checks.

- [X] T056 [P] Update finalized mechanics payload examples in `specs/006-character-traits-and-math-parity/contracts/character-mechanics-contract.md`
- [X] T057 Add endpoint performance verification test coverage with p95 threshold assertions in `backend/apps/characters/tests/test_performance_character_endpoints.py`
- [X] T058 Run frontend parity/counter test target from `frontend/src/components/Character/` and backend mechanics/performance test targets from `backend/apps/characters/tests/`
- [X] T059 [P] Record quickstart smoke-check and p95 performance outcomes in `specs/006-character-traits-and-math-parity/quickstart.md`
- [X] T060 Update implementation decisions and onboarding notes in `specs/006-character-traits-and-math-parity/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1, P1)**: Depends on Phase 2.
- **Phase 4 (US2, P1)**: Depends on Phase 2; integrates cleanly after US1 serializer outputs stabilize.
- **Phase 5 (US3, P1)**: Depends on Phase 2.
- **Phase 6 (US4, P1)**: Depends on Phase 2.
- **Phase 7 (US6, P1)**: Depends on Phase 2.
- **Phase 8 (US5, P2)**: Depends on completion of US1/US2/US3/US4/US6 behavior.
- **Phase 9 (Polish)**: Depends on all implemented stories.

### User Story Dependencies

- **US1 (P1)**: Starts immediately after foundational completion.
- **US2 (P1)**: Starts after foundational completion; benefits from US1-normalized payload paths.
- **US3 (P1)**: Starts after foundational completion; independent of US2 UI work.
- **US4 (P1)**: Starts after foundational completion; independent of US2 UI work.
- **US6 (P1)**: Starts after foundational completion; feeds regression scope in US5.
- **US5 (P2)**: Runs after P1 stories to lock full pipeline behavior.

### Parallel Opportunities

- Setup parallel tasks: T002, T003, T004
- Foundational parallel tests: T006, T007, T008
- US1 parallel tests: T014, T015
- US2 parallel tests: T020, T021
- US3 parallel tests: T026, T027
- US4 parallel tests: T034, T035
- US6 parallel tests: T041, T042, T043
- US5 parallel regression suites: T051, T052
- Polish parallel docs/checklist tasks: T056, T059

---

## Parallel Example: User Story 1

```bash
# Run in parallel after Phase 2:
Task T014: backend/apps/characters/tests/test_character_create_species_options.py
Task T015: backend/apps/characters/tests/test_lineage_spell_grants.py
```

## Parallel Example: User Story 2

```bash
# Run in parallel:
Task T020: backend/apps/characters/tests/test_feature_source_normalization.py
Task T021: frontend/src/utils/__tests__/featureNormalization.test.ts
```

## Parallel Example: User Story 3

```bash
# Run in parallel:
Task T026: backend/apps/characters/tests/test_derived_stats_parity.py
Task T027: frontend/src/utils/__tests__/characterMathParity.test.ts
```

## Parallel Example: User Story 4

```bash
# Run in parallel:
Task T034: backend/apps/characters/tests/test_feature_usage_counters.py
Task T035: frontend/src/components/Character/__tests__/ResourceCounterControls.test.tsx
```

## Parallel Example: User Story 6

```bash
# Run in parallel:
Task T041: backend/apps/characters/tests/test_subclass_validation.py
Task T042: backend/apps/characters/tests/test_subclass_extensibility.py
Task T043: frontend/src/components/Character/__tests__/SubclassSelector.test.tsx
```

## Parallel Example: User Story 5

```bash
# Run in parallel:
Task T051: backend/apps/characters/tests/test_creation_to_sheet_regression.py
Task T052: frontend/src/components/Character/__tests__/CharacterParityRegression.test.tsx
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. Validate US1 independently before expanding scope.

### Incremental Delivery

1. Setup + Foundational for contract stability.
2. Deliver P1 stories in this order for fastest value: US1 -> US2 -> US3 -> US4 -> US6.
3. Lock behavior with US5 regression suite.
4. Finish with Polish and quickstart validation.

### Suggested MVP Scope

- **MVP**: Through Phase 3 (US1 only), because creation correctness is prerequisite for all downstream parity.

---

## Format Validation

- All tasks use checkbox format `- [ ]`.
- Task IDs are sequential from T001 to T060.
- `[P]` appears only on parallelizable tasks.
- `[US#]` labels appear on user-story tasks only.
- Every task description includes at least one explicit file or folder path.
