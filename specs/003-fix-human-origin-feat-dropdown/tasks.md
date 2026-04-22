# Tasks: Fix Human Origin Feat Dropdown

**Input**: Design documents from `specs/003-fix-human-origin-feat-dropdown/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or no dependency on incomplete tasks)
- **[Story]**: User story label — US1, US2, US3, US4 (maps to spec.md user stories)
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: Establish static data constants and API data loading that all UI controls depend on.

- [X] T001 Import `feat-index.json` and define `ORIGIN_FEATS` constant at file top of `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T002 [P] Define `DND_TOOLS: string[]` constant (33 tool names from `api/content/equipment/tools.json`) inline in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T003 [P] Add `skillList` local state and `useEffect` calling `contentAPI.skills.list()` with error fallback to empty array in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Interface extensions and backend test contracts that MUST be in place before any user story implementation.

**⚠️ CRITICAL**: T006 (backend tests) MUST be written and observed to FAIL before T017–T019 (serializer implementation) can begin.

- [X] T004 [P] Extend `SpeciesOptions` interface in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx` to add `skillfulChoice?: string`, `skilledSkillChoices?: string[]`, `skilledToolChoices?: string[]`
- [X] T005 [P] Extend `CharacterData.selectedSpeciesOptions` type in `frontend/src/components/CharacterCreation/CharacterWizard.tsx` to add `skillfulChoice?: string`, `skilledSkillChoices?: string[]`, `skilledToolChoices?: string[]`
- [X] T006 Write all 7 failing backend contract tests (TC-001 through TC-007 from `contracts/character-create-species-options.md`) in `backend/apps/characters/tests/test_character_create_species_options.py` — confirm tests FAIL before proceeding to Phase 7
- [X] T007 Clear `skillfulChoice`, `skilledSkillChoices`, and `skilledToolChoices` on species change alongside existing `featChoice: ''` reset in `handleSpeciesSelect` in `frontend/src/components/CharacterCreation/CharacterWizard.tsx`

**Checkpoint**: Interfaces extended, tests written and failing, reset logic in place — user story implementation can begin.

---

## Phase 3: User Story 1 — Select Origin Feat via Dropdown (Priority: P1) 🎯 MVP

**Goal**: Replace the text input with a working `<select>` dropdown that blocks step advancement until a feat is chosen and shows a summary of the selected feat.

**Independent Test**: Navigate to Character Creation → select Human → verify "Origin Feat" dropdown appears (not a text box) showing 5 origin feats; verify "Next" is disabled until a feat is selected; verify feat summary appears below dropdown on selection.

- [X] T008 [US1] Replace `<input type="text" className="form-input">` with `<select className="species-select">` in the `{offersFeatChoice && ...}` block; populate with `ORIGIN_FEATS` options and an empty-value placeholder option in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T009 [US1] Add feat summary `<div aria-live="polite" aria-atomic="true">` below the feat dropdown showing the selected feat's summary from `ORIGIN_FEATS`; hide when no feat selected in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T010 [US1] Extend `isStepComplete(2)` in `frontend/src/components/CharacterCreation/CharacterWizard.tsx`: derive `hasFeatChoice` from `characterData.species.traits`; return `false` when `hasFeatChoice && !opts.featChoice`

**Checkpoint**: User Story 1 is fully functional — Human shows dropdown, no-selection blocks Next, feat summary appears.

---

## Phase 4: User Story 2 — Consistent Visual Styling (Priority: P2)

**Goal**: Guarantee the new feat controls are visually indistinguishable from adjacent species option controls.

**Independent Test**: Compare the origin feat dropdown against the "Skill Proficiency Choice" dropdown on the same step — spacing, height, font, border must match.

- [X] T011 [US2] Confirm the feat `<select>` sits inside a `form-group` wrapper div, uses `className="species-select"`, and the summary panel uses `styles['variant-info-panel']` + `styles['variant-info-panel__desc']` CSS Module classes (matching the variant description panel) in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`

**Checkpoint**: Feat dropdown is visually consistent with all other species option dropdowns.

---

## Phase 5: User Story 4 — Skillful Trait Skill Selection (Priority: P2)

**Goal**: Add the missing required 1-skill dropdown for Human's Skillful trait, blocking advancement until chosen and persisting to the character.

**Independent Test**: Select Human → verify "Skillful — Choose a Skill Proficiency" dropdown appears; verify "Next" blocks until a skill is chosen; create character → verify skill appears proficient on the character sheet.

- [X] T012 [US4] Add `offersSkillfulChoice` derived boolean alongside `offersFeatChoice` — checks if any trait's `name.toLowerCase() === 'skillful'` — in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T013 [US4] Add Skillful skill `<select>` (empty placeholder, `skillList` options, `form-group`/`species-select` styling); `onChange` updates `skillfulChoice` and resets `skilledSkillChoices`/`skilledToolChoices` in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T014 [US4] Extend `isStepComplete(2)` in `frontend/src/components/CharacterCreation/CharacterWizard.tsx`: derive `hasSkillful` from `characterData.species.traits`; return `false` when `hasSkillful && !opts.skillfulChoice` (add after the `hasFeatChoice` check from T010)

**Checkpoint**: User Story 4 is fully functional — Skillful dropdown present for Human, required before advancing.

---

## Phase 6: User Story 3 — Skilled Feat Sub-Selection (Priority: P2)

**Goal**: When the player selects Skilled as their origin feat, show three individual dropdowns for picking any combination of 3 skills/tools with duplicate prevention and Skillful-exclusion.

**Independent Test**: Select Human → select Skilled → verify three "Pick 1/2/3" dropdowns appear; verify picking the same option in two dropdowns is prevented; verify the Skillful-chosen skill is greyed out in all three; verify "Next" blocks until all three are filled; create character → verify the 3 proficiencies appear on the sheet.

- [X] T015 [US3] Implement three Skilled feat proficiency dropdowns in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx` — rendered when `offersFeatChoice && speciesOptions?.featChoice === 'Skilled'`; combined sorted `[...skillList.map(s => s.name), ...DND_TOOLS]` options; `disabled` on options already chosen in other picks and on Skillful pick; `onChange` re-derives `skilledSkillChoices` (entries in `skillList`) and `skilledToolChoices` (entries in `DND_TOOLS`)
- [X] T016 [US3] Extend `isStepComplete(2)` in `frontend/src/components/CharacterCreation/CharacterWizard.tsx`: return `false` when `opts.featChoice === 'Skilled'` and `(skilledSkillChoices.length + skilledToolChoices.length) < 3` (add after the Skillful check from T014)

**Checkpoint**: User Story 3 is fully functional — Skilled sub-selection works, all validation gates enforced.

---

## Phase 7: Backend — Proficiency Persistence (US3 + US4)

**Purpose**: Persist Skillful and Skilled choices as `skill_proficiencies` and `tool_proficiencies` on the created character.

**⚠️ GATE**: T006 tests must be written and FAILING before starting this phase. Run them first: `python manage.py test apps.characters.tests.test_character_create_species_options`

- [X] T017 Unpack `skillfulChoice` (str), `skilledSkillChoices` (list), and `skilledToolChoices` (list) from `selected_species_options` with empty defaults and whitespace-stripping in `backend/apps/characters/serializers.py` (after existing `selected_feat` unpack on line ~385)
- [X] T018 Append `skillfulChoice` and each non-empty `skilledSkillChoices` item to `selected_skills` list with `if not in selected_skills` deduplication in `backend/apps/characters/serializers.py`
- [X] T019 Append each non-empty `skilledToolChoices` item to `character.tool_proficiencies` JSONField with deduplication in `backend/apps/characters/serializers.py`

**Checkpoint**: Run `python manage.py test apps.characters.tests.test_character_create_species_options` — all 7 tests must now PASS.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T020 Run `python manage.py test apps.characters.tests.test_character_create_species_options` and confirm all 7 tests pass in `backend/`
- [ ] T021 [P] Manually verify non-Human species (Elf, Dwarf, any other) show no extra dropdowns and all existing variant/skill/size/spellcasting dropdowns still work correctly
- [ ] T022 [P] Manually verify isStepComplete gates: confirm "Next" is blocked for each missing required selection independently (no feat, no Skillful, incomplete Skilled picks)
- [ ] T023 [P] Create a Human character with Skilled (2 skills + 1 tool) and a Skillful skill; verify the character sheet shows all 4 proficiencies with correct modifiers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: No dependencies — start immediately; T002/T003 parallel to T001; T004/T005 parallel to each other
- **Phases 3–6 (User Stories)**: All depend on Phase 1 + Phase 2 completion
- **Phase 7 (Backend)**: T006 tests must FAIL first; T017 before T018/T019; T018/T019 parallel
- **Phase 8 (Polish)**: All implementation phases complete

### User Story Dependencies

| Story | Can start after | Notes |
|---|---|---|
| US1 (P1) | Phase 2 | No inter-story deps |
| US2 (P2) | US1 complete | Styling verified on top of US1 implementation |
| US4 (P2) | Phase 2 | Independent of US1 |
| US3 (P2) | US4 complete | Skilled dropdowns exclude the Skillful choice |

### `isStepComplete(2)` Edit Order

T010 → T014 → T016 must be applied **sequentially** — each extends the same `case 2` block:
1. T010 adds `hasFeatChoice` guard
2. T014 adds `hasSkillful` guard (appends after T010 change)
3. T016 adds `Skilled` total-picks guard (appends after T014 change)

### Parallel Opportunities

- T001, T002, T003: All setup constants/state in SpeciesSelector — different additions, can proceed simultaneously with multiple devs
- T004, T005: Different files — truly parallel
- T018, T019: Different fields in same method — can be written together in one pass
- T020, T021, T022, T023: All polish verification tasks — fully parallel

---

## Parallel Example: User Story 1 (MVP Sprint)

```
Developer A                    Developer B
──────────────────────────     ──────────────────────────
T001 ORIGIN_FEATS constant     T005 CharacterWizard types
T002 DND_TOOLS constant        T007 Species change reset
T003 skills API fetch          
T004 SpeciesOptions interface  
  ↓                              ↓
T008 [US1] feat dropdown       T006 Backend tests (write failing)
T009 [US1] summary panel
T010 [US1] isStepComplete
  ↓                              ↓
T011 [US2] CSS classes check   (Backend tests running/failing)
  ↓
MVP COMPLETE: Human origin feat dropdown works end-to-end
```

---

## Implementation Strategy

**Suggested MVP Scope (Phase 3 only)**: Implement US1 (T001–T010) first to deliver the core defect fix. This can be shipped independently — the dropdown works, feat is recorded, step advancement is gated. US2/US3/US4 are additive improvements.

**Full delivery order**: US1 → US2 (styling verification) → US4 (Skillful, simpler) → US3 (Skilled, depends on US4) → Backend (T017–T019) → Polish.

**Format validation**: All tasks follow `- [ ] [ID] [P?] [Story] description with file path` format. ✅
