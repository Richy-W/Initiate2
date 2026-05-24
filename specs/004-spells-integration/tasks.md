# Tasks: Spells Integration

**Input**: Design documents from `/specs/004-spells-integration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/spell-slots.md ✅, quickstart.md ✅

**TDD Note**: Backend contract tests (T004) MUST be written and confirmed FAILING before T005–T007 are implemented (Red-Green-Refactor per constitution §II).

**Organization**: Tasks grouped by user story — each story can be implemented, tested, and delivered independently.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no block dependencies)
- **[US#]**: Which user story this task belongs to
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Backend model changes and frontend type additions that all later work depends on.

- [X] T001 Add `SpellSlotState` model and `source` field to `CharacterSpell`
- [X] T002 Run `python manage.py makemigrations characters` to generate `backend/apps/characters/migrations/0004_characterspell_source_spellslotstate.py`
- [X] T003 [P] Add `CharacterSpell`, `SpellSlotState`, and `SpellcastingProfile` TypeScript interfaces to `frontend/src/types/index.ts`

**Checkpoint**: Model changes and types exist — foundational phase can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend API and frontend service layer — must be complete before ANY user story UI can function.

**⚠️ CRITICAL**: Write T004 tests FIRST and verify they FAIL before implementing T005–T007.

- [X] T004 [P] Write TDD contract tests in `backend/apps/characters/tests/test_spell_slots.py` — confirmed FAILING (red) then PASSING (green)
- [X] T005 Add `SpellSlotStateSerializer` and update `CharacterSpellSerializer` in `backend/apps/characters/serializers.py`
- [X] T006 Add `SpellSlotStateViewSet` and extend `CharacterViewSet.rest()` with `slots_restored` in `backend/apps/characters/views.py`
- [X] T007 Register `SpellSlotStateViewSet` on the `character-spell-slots` router prefix in `backend/apps/characters/urls.py`
- [X] T008 [P] Add `characterSpells` and `spellSlots` API sections, `rest()` method to characters in `frontend/src/services/apiClient.ts`

**Checkpoint**: `python manage.py test apps.characters` passes all T004 contract tests — user story UI work can begin

---

## Phase 3: User Story 1 — View and Track Spells (Priority: P1) 🎯 MVP

**Goal**: Spellcasting characters see a functional SPELLS tab with stat block, spell slot tracker, and grouped spell list. Non-casters see no tab.

**Independent Test**: Seed a Level 5 Wizard with pre-existing `CharacterSpell` and `SpellSlotState` rows, navigate to Character Detail → SPELLS tab, and verify the stat block (ability, modifier, save DC, attack bonus), slot tracker (L1–L3 slots showing used/total), and spell list (grouped CANTRIP / 1ST LEVEL / 2ND LEVEL with C/R/M indicators) all render correctly. Confirm no SPELLS tab appears on a plain Fighter character.

- [X] T009 [P] [US1] Add `computeSpellcastingProfile(character, classJson): SpellcastingProfile` utility function (formula: modifier = abilityMod + profBonus; saveDC = 8 + modifier; attackBonus = modifier; detect pact magic via `classJson.spellcasting.type === 'pact'`) in `frontend/src/utils/spellUtils.ts`
- [X] T010 [P] [US1] Create `SpellcastingStatBlock` component displaying spellcasting ability name, spell modifier, spell save DC, and spell attack bonus in `frontend/src/components/Character/SpellcastingStatBlock.tsx` and `SpellcastingStatBlock.module.css`
- [X] T011 [P] [US1] Create `SpellSlotTracker` component rendering the slot grid with per-level used/total counters, individual slot toggle (click to mark spent/restore), and a Warlock Pact Magic variant (single-level row with "Short Rest restores Pact Magic" label) in `frontend/src/components/Character/SpellSlotTracker.tsx` and `SpellSlotTracker.module.css`
- [X] T012 [US1] Create `SpellsTab` component assembling `SpellcastingStatBlock`, `SpellSlotTracker`, and grouped spell list (CANTRIP first, then 1ST LEVEL through highest level; columns: Name, Casting Time, Range, Hit/DC, Effect, Notes; C/R/M badge indicators per row; empty-state message "No spells added yet" with MANAGE SPELLS placeholder CTA when `character_spells` is empty) in `frontend/src/components/Character/SpellsTab.tsx` and `SpellsTab.module.css`
- [X] T013 [US1] Update `CharacterSheet.tsx` to add SPELLS tab to actions pane navigation and conditionally render `SpellsTab` — tab is visible only when the character's class grants spellcasting OR the character has the Magic Initiate feat (`source: 'magic_initiate'` spell exists) in `frontend/src/components/Character/CharacterSheet.tsx`

**Checkpoint**: US1 fully functional — navigate to a Wizard's character page and verify the complete SPELLS tab renders end-to-end. A Fighter shows no SPELLS tab.

---

## Phase 4: User Story 2 — Manage Spells (Priority: P2)

**Goal**: Players can open an inline spell browser from the SPELLS tab, search/filter by class spell list, and add or remove spells. Prepared-spell classes show a toggle and prepared count.

**Independent Test**: Click MANAGE SPELLS on a Level 2 Wizard, search "Burning Hands", add it, close the browser, and confirm "Burning Hands" appears in the 1ST LEVEL group on the SPELLS tab. Remove it and confirm it disappears from both SPELLS and ACTIONS tabs.

- [X] T014 [P] [US2] Create `SpellBrowser` component with class-filtered spell list (query `/api/content/spells/?classes__name={className}&level__lte={maxLevel}`), name search input, level filter dropdown, school filter dropdown, add spell button (POST `/api/character-spells/`), and remove spell button (DELETE `/api/character-spells/{id}/`) in `frontend/src/components/Character/SpellBrowser.tsx` and `SpellBrowser.module.css`
- [X] T015 [US2] Add MANAGE SPELLS button to `SpellsTab` and implement inline panel state toggle that renders `SpellBrowser` within the actions pane (no modal/overlay) and returns to spell list on close in `frontend/src/components/Character/SpellsTab.tsx`
- [X] T016 [US2] Add prepared-spell toggle to each spell row in `SpellsTab` (PATCH `is_prepared` via `/api/character-spells/{id}/`) and display prepared count vs computed prepared max for Wizard/Cleric/Druid/Paladin characters in `frontend/src/components/Character/SpellsTab.tsx`

**Checkpoint**: US2 fully functional — complete the add → verify → remove → verify loop on a Wizard character.

---

## Phase 5: User Story 3 — Magic Initiate Spell Selection in Character Builder (Priority: P3)

**Goal**: Characters gaining Magic Initiate in the creation wizard or level-up flow are prompted to choose 2 cantrips + 1 first-level spell from a source class. Selections are saved with `source='magic_initiate'` and appear on the SPELLS tab.

**Independent Test**: Create a Fighter, select Magic Initiate (Wizard) at the origin step, pick Fire Bolt + Minor Illusion (cantrips) and Burning Hands (1st-level), complete creation, and verify all 3 spells appear on the SPELLS tab with Magic Initiate attribution.

- [X] T017 [P] [US3] Create `MagicInitiateSpellPicker` component with source class dropdown, filterable cantrip list (select exactly 2), filterable 1st-level spell list (select exactly 1), and a confirm button that is disabled until all 3 selections are made — queries `/api/content/spells/?classes__name={cls}&level__in=0,1` in `frontend/src/components/CharacterCreation/MagicInitiateSpellPicker.tsx` and `MagicInitiateSpellPicker.module.css`
- [X] T018 [US3] Replace Magic Initiate free-text cantrip/spell inputs in `SpeciesSelector.tsx` with `MagicInitiateSpellPicker`; on wizard completion wire the 3 selected spells to POST `/api/character-spells/` with `source: 'magic_initiate'` for each in `frontend/src/components/CharacterCreation/SpeciesSelector.tsx`
- [X] T019 [US3] Update `LevelUp.tsx` to detect when Magic Initiate feat is newly selected (feat not already on character) and render `MagicInitiateSpellPicker` inline before the level-up is finalized; skip the sub-step if MI spells with `source='magic_initiate'` already exist on the character in `frontend/src/components/Character/LevelUp.tsx`

**Checkpoint**: US3 fully functional — test MI spell picker in both creation wizard and level-up flows, then verify SPELLS tab shows all 3 spells attributed to Magic Initiate.

---

## Phase 6: User Story 4 — Print Spell Sheet as Second Page (Priority: P4)

**Goal**: Printing a character with spells produces two pages — Page 1 the character sheet, Page 2 the official D&D 5e 2024 spell sheet layout.

**Independent Test**: Open a spellcasting character with at least one spell. Trigger print (Ctrl+P). Confirm two-page preview: Page 1 = existing character sheet, Page 2 = spell sheet with stat block, L1–9 slot grid (Total/Expanded), and cantrips & prepared spells table. Confirm a character with no spells produces only Page 1.

- [X] T020 [P] [US4] Add `@media print` second-page rules to `frontend/src/App.css`: `.spell-print-page { page-break-before: always; }` plus D&D 5e 2024 spell sheet layout styles (two-column format, slot grid, table columns matching FR-015)
- [X] T021 [P] [US4] Create `SpellPrintPage` component rendering: spellcasting ability block (ability name, modifier, save DC, attack bonus), spell slot grid (levels 1–9, Total column, Expanded/used column), and Cantrips & Prepared Spells table (columns: Level, Name, Casting Time, Range, C, R, M, Notes) in `frontend/src/components/Character/SpellPrintPage.tsx` and `SpellPrintPage.module.css`
- [X] T022 [US4] Update `CharacterSheet.tsx` to conditionally render `SpellPrintPage` only when the character has at least one `character_spells` entry or holds the Magic Initiate feat; print component is hidden from screen display via CSS `@media print` show/hide in `frontend/src/components/Character/CharacterSheet.tsx`

**Checkpoint**: US4 fully functional — print preview shows exactly 2 pages for a caster with spells and exactly 1 page for a non-caster.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Attack sync, edge cases, and final validation across all stories.

- [X] T023 [P] Add `getSpellAttacks(character): AttackRow[]` utility function to `frontend/src/utils/spellUtils.ts` that filters `character.character_spells` for spells with a non-empty `damage` field and maps them to the `AttackRow` shape used by the attacks list (hit bonus = spellAttackBonus from SpellcastingProfile, damage from spell data)
- [X] T024 Update `AttackRolls.tsx` to call `getSpellAttacks(character)` and merge the returned attack rows into the existing weapon attack list so that adding or removing a damaging spell via MANAGE SPELLS immediately updates the ACTIONS tab in `frontend/src/components/Character/AttackRolls.tsx`
- [X] T025 Run all quickstart.md smoke tests end-to-end and confirm every acceptance scenario in spec.md US1–US4 passes; confirm `python manage.py test apps.characters` is green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete — **blocks all user story phases**
- **User Stories (Phases 3–6)**: All require Foundational complete; can then proceed in parallel or sequentially P1 → P2 → P3 → P4
- **Polish (Phase 7)**: Requires US1 (T013) and US2 (T014) complete for spell attacks sync

### User Story Dependencies

| Story | Depends On | Independent Test |
|-------|-----------|-----------------|
| US1 (P1) | Foundational complete | Level 5 Wizard SPELLS tab renders with seeded data |
| US2 (P2) | US1 complete (SpellsTab exists) | MANAGE SPELLS inline browser add/remove loop |
| US3 (P3) | Foundational complete | MI picker in creation wizard; MI picker in level-up |
| US4 (P4) | US1 complete (spells data available) | Two-page print preview |

### Within Each Phase

- **TDD**: T004 must be FAILING before T005–T007 are written
- **Models before serializers before views**: T001 → T005 → T006 → T007
- **Types before API methods**: T003 → T008
- **Utility before components**: T009 → T010/T011 → T012 → T013
- **New component before wiring**: T014 → T015/T016; T017 → T018/T019; T021 → T022

### Parallel Opportunities

```
Phase 1:     T001 ─ T002 ─ T003(P)
Phase 2:     T004(P) ─ T005 ─ T006 ─ T007 │ T008(P)
Phase 3:     T009(P) T010(P) T011(P) ─ T012 ─ T013
Phase 4:     T014(P) ─ T015 ─ T016
Phase 5:     T017(P) ─ T018 │ T017(P) ─ T019
Phase 6:     T020(P) │ T021(P) ─ T022
Phase 7:     T023(P) ─ T024 │ T025
```

---

## Implementation Strategy

### MVP Scope (Deliver First)

**Phase 3 (US1)** is the MVP. A spellcasting character with pre-seeded data can view their SPELLS tab with spellcasting stats, slot tracker, and spell list. This is independently deployable and provides immediate value.

**Suggested delivery order**: Phase 1 → Phase 2 → Phase 3 (MVP) → Phase 4 → Phase 5 → Phase 6 → Phase 7

### Incremental Delivery Checkpoints

1. **After Phase 2**: Backend API live — `curl /api/character-spell-slots/` returns data; `curl /api/characters/{id}/rest/` includes `slots_restored`
2. **After Phase 3**: SPELLS tab visible and functional for any seeded spellcasting character
3. **After Phase 4**: Full spell management loop complete — add, prepare, and remove spells
4. **After Phase 5**: Magic Initiate flow complete in both wizard and level-up
5. **After Phase 6**: Print output matches D&D 5e 2024 two-page layout
6. **After Phase 7**: ACTIONS tab dynamically reflects spell attacks; full smoke test suite green

---

## Format Validation

All 25 tasks follow the required checklist format:
- ✅ Each task starts with `- [ ]`
- ✅ Each task has a sequential ID (T001–T025)
- ✅ `[P]` marker present where tasks operate on independent files with no blocking deps
- ✅ `[US1]`–`[US4]` labels on all user story phase tasks; absent on Setup/Foundational/Polish
- ✅ Every task includes an exact file path
