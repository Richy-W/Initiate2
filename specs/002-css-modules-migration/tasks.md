# Tasks: CSS Module Migration

**Input**: Design documents from `specs/002-css-modules-migration/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅  
**Branch**: `002-css-modules-migration`  
**Tests**: Not requested — CSS migration is purely presentational (constitution II exempts presentational components from implementation-blocking tests)

**Organization**: Tasks grouped by user story (US1 → US2 → US3) to enable independent batched delivery.

---

## Phase 1: Setup

**Purpose**: Establish pre-migration baseline before any files are changed.

- [X] T001 Confirm dev server compiles and note any pre-existing TypeScript warnings; take mental or screenshot baseline of all 14 affected components in `frontend/src/`

**Checkpoint**: Baseline established — migration can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

> **No foundational blocking tasks required.** This feature is a pure file refactor. Each user story migration is fully independent — no shared infrastructure must be built before story work can begin. Proceed directly to Phase 3.

---

## Phase 3: User Story 1 — Character view renders correctly after migration (Priority: P1) 🎯 MVP

**Goal**: Migrate all four character-component CSS files to CSS Modules so the character sheet, encumbrance status, and inventory render identically to the pre-migration baseline.

**Independent Test**: Start the dev server, navigate to the character sheet page, and confirm all layout sections (ability scores, combat stats, skills, equipment, class features) display correctly. Inspect the DOM to confirm class names are hashed (e.g., `CharacterSheet_character-sheet__abc12`).

### Implementation for User Story 1

- [X] T002 [P] [US1] Move `frontend/src/styles/CharacterSheet.css` → `frontend/src/components/Character/CharacterSheet.module.css` (co-locate next to component; no content changes)
- [X] T003 [US1] Update `frontend/src/components/Character/CharacterSheet.tsx`: change import from `'../../styles/CharacterSheet.css'` to `import styles from './CharacterSheet.module.css'`; update all ~80–100 `className="..."` string literals to `className={styles['...']}` (use VS Code Find+Replace in file with regex `className="([^"]+)"` → `className={styles['$1']}`, then manually review all dynamic/template-literal classNames)
- [X] T004 [P] [US1] Migrate `frontend/src/components/Character/EncumbranceStatus.css` → `EncumbranceStatus.module.css` (rename in place); update `EncumbranceStatus.tsx`: change import to `import styles from './EncumbranceStatus.module.css'`; update compound modifier lines: `className={[styles['encumbrance-status'], styles[getEncumbranceColor(encumbranceStatus)], className].filter(Boolean).join(' ')}` and `className={[styles['weight-fill'], styles[getEncumbranceColor(encumbranceStatus)]].join(' ')}`; update all remaining single-class `className="..."` to `{styles['...']}` (reference: `quickstart.md` Step 3)
- [X] T005 [P] [US1] Migrate `frontend/src/components/Character/Inventory.css` → `Inventory.module.css` (rename in place); update `Inventory.tsx`: change import to `import styles from './Inventory.module.css'`; update all `className="..."` to `className={styles['...']}` 
- [X] T006 [P] [US1] Move `frontend/src/styles/OfficialIdentityHeader.css` → `frontend/src/components/Character/OfficialIdentityHeader.module.css` (co-locate); update `OfficialIdentityHeader.tsx`: change import from `'../../styles/OfficialIdentityHeader.css'` to `import styles from './OfficialIdentityHeader.module.css'`; update all classNames
- [X] T007 [US1] Delete the four original plain CSS source files: `frontend/src/styles/CharacterSheet.css`, `frontend/src/components/Character/EncumbranceStatus.css`, `frontend/src/components/Character/Inventory.css`, `frontend/src/styles/OfficialIdentityHeader.css`
- [X] T008 [US1] Smoke-test US1: confirm dev server compiles with zero errors; navigate to character sheet in browser and verify all layout sections, encumbrance bar styling (normal/warning/danger states), and inventory panel match the pre-migration baseline

**Checkpoint**: US1 complete — character sheet, encumbrance, and inventory fully migrated and visually verified ✅

---

## Phase 4: User Story 2 — Equipment browser and item details render correctly after migration (Priority: P2)

**Goal**: Migrate all four equipment-component CSS files to CSS Modules so the equipment browser, item detail panel, equipped items list, and magical properties section render identically to the pre-migration baseline.

**Independent Test**: Open the equipment browser from the character sheet; select an item to open item detail; equip an item and verify the equipped-items panel; confirm magical properties section renders for magic items. No dependency on US1 completion.

### Implementation for User Story 2

- [X] T009 [P] [US2] Migrate `frontend/src/components/Equipment/EquipmentBrowser.css` → `EquipmentBrowser.module.css` (rename in place); update `EquipmentBrowser.tsx`: change import to `import styles from './EquipmentBrowser.module.css'`; update all `className="..."` to `className={styles['...']}` 
- [X] T010 [P] [US2] Migrate `frontend/src/components/Equipment/EquippedItems.css` → `EquippedItems.module.css` (rename in place); update `EquippedItems.tsx`: change import to `import styles from './EquippedItems.module.css'`; update all classNames
- [X] T011 [P] [US2] Migrate `frontend/src/components/Equipment/ItemDetail.css` → `ItemDetail.module.css` (rename in place); update `ItemDetail.tsx`: change import to `import styles from './ItemDetail.module.css'`; update all classNames
- [X] T012 [P] [US2] Migrate `frontend/src/components/Equipment/MagicalProperties.css` → `MagicalProperties.module.css` (rename in place); update `MagicalProperties.tsx`: change import to `import styles from './MagicalProperties.module.css'`; update all classNames
- [X] T013 [US2] Delete the four original plain CSS source files: `frontend/src/components/Equipment/EquipmentBrowser.css`, `frontend/src/components/Equipment/EquippedItems.css`, `frontend/src/components/Equipment/ItemDetail.css`, `frontend/src/components/Equipment/MagicalProperties.css`
- [X] T014 [US2] Smoke-test US2: confirm dev server compiles with zero errors; open equipment browser, select an item, check detail panel and magical properties, verify equipped item row — all must match baseline

**Checkpoint**: US2 complete — all equipment components migrated independently ✅

---

## Phase 5: User Story 3 — Pages and layout components render correctly after migration (Priority: P3)

**Goal**: Migrate the six remaining component/page CSS files to CSS Modules so CharacterList, CharacterCreation wizard, CharacterEditor, Layout shell, Login/Register pages, and HelpPage all render identically to the pre-migration baseline.

**Independent Test**: Full user journey — navigate to login → register → character list → create a new character (all wizard steps) → edit a character → visit help page. All pages must render correctly with no CSS regression.

### Implementation for User Story 3

- [X] T015 [P] [US3] Move `frontend/src/styles/CharacterCreation.css` → `frontend/src/components/CharacterCreation/CharacterWizard.module.css` (co-locate); update `CharacterWizard.tsx`: change import from `'../../styles/CharacterCreation.css'` to `import styles from './CharacterWizard.module.css'`; update all CharacterCreation-specific `className="..."` to `className={styles['...']}` — **IMPORTANT**: `sheet-preview-toolbar`, `sheet-main`, and `character-sheet-layout` are global classes from `App.css` applied in this component; keep them as plain string literals (`className="sheet-preview-toolbar"`, etc.) — do NOT convert them to `styles.xxx`
- [X] T016 [P] [US3] Move `frontend/src/styles/CharacterEditor.css` → `frontend/src/components/CharacterEditing/CharacterEditor.module.css` (co-locate); update `CharacterEditor.tsx`: change import from `'../../styles/CharacterEditor.css'` to `import styles from './CharacterEditor.module.css'`; update all classNames
- [X] T017 [P] [US3] Move `frontend/src/styles/CharacterList.css` → `frontend/src/pages/CharacterList.module.css` (co-locate); update `CharacterList.tsx`: change import from `'../styles/CharacterList.css'` to `import styles from './CharacterList.module.css'`; update all classNames; for any `pages.css` global utility classes mixed in (e.g. `page-container`), keep them as plain strings: `className={\`${styles['character-list']} page-container\`}`
- [X] T018 [P] [US3] Move `frontend/src/styles/Layout.css` → `frontend/src/components/Layout.module.css` (co-locate); update `Layout.tsx`: change import from `'../styles/Layout.css'` to `import styles from './Layout.module.css'`; update all classNames
- [X] T019 [P] [US3] Move `frontend/src/styles/LoginPage.css` → `frontend/src/pages/auth/LoginPage.module.css` (co-locate in `pages/auth/`); update **both** `LoginPage.tsx` and `RegisterPage.tsx`: change import from `'../../styles/LoginPage.css'` to `import styles from './LoginPage.module.css'` in each file; update all classNames in both — this is one module file, imported identically by two sibling components
- [X] T020 [P] [US3] Migrate `frontend/src/pages/HelpPage.css` → `frontend/src/pages/HelpPage.module.css` (rename in place); update `HelpPage.tsx`: change import from `'./HelpPage.css'` to `import styles from './HelpPage.module.css'`; update all classNames
- [X] T021 [US3] Delete the six original plain CSS source files: `frontend/src/styles/CharacterCreation.css`, `frontend/src/styles/CharacterEditor.css`, `frontend/src/styles/CharacterList.css`, `frontend/src/styles/Layout.css`, `frontend/src/styles/LoginPage.css`, `frontend/src/pages/HelpPage.css`
- [X] T022 [US3] Smoke-test US3: navigate full user journey (log in → character list → create character through all wizard steps → edit character → help page); verify all pages and the layout/nav shell match the pre-migration baseline

**Checkpoint**: US3 complete — all page and layout components migrated ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification that all success criteria from the spec are met.

- [X] T023 [P] Verify SC-002 — run the following in a terminal and confirm zero results (no remaining plain `.css` imports outside the three permitted globals): `grep -rn "import '\." frontend/src --include="*.tsx" | Select-String "\.css'" | Where-Object { $_ -notmatch "App\.css|index\.css|pages\.css" }`
- [X] T024 [P] Verify SC-001 — confirm 14 `.module.css` files exist in `frontend/src/` and zero plain `.css` files remain under `frontend/src/components/` or `frontend/src/pages/`: `Get-ChildItem frontend/src -Recurse -Filter "*.module.css" | Measure-Object` (expect 14); `Get-ChildItem frontend/src/components, frontend/src/pages -Recurse -Filter "*.css" | Where-Object { $_.Name -notmatch "\.module\." }` (expect 0)
- [X] T025 Verify SC-005 — open the character sheet page in the browser, then use File → Print (Ctrl+P) and confirm the print preview shows the expected A4 portrait three-column layout matching the pre-migration baseline
- [X] T026 Verify SC-003 — run `cd frontend; npm run build` and confirm the production build completes with zero TypeScript or webpack errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Skipped — no blocking prerequisites for this refactor
- **User Stories (Phase 3–5)**: All depend only on Phase 1 (baseline check)
  - US1, US2, US3 are fully independent and can proceed in parallel with different team members
  - Or sequentially in priority order: P1 → P2 → P3
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on US2 or US3
- **US2 (P2)**: No dependency on US1 or US3
- **US3 (P3)**: No dependency on US1 or US2

### Within Each User Story

- T002 must complete before T003 (CSS file must exist before TSX is updated)
- T003–T006 can all run in parallel once T002 is ready
- T007 (delete) must complete after T002–T006
- T008 (smoke-test) must complete last within US1

---

## Parallel Execution Examples

### Example: US1 with parallel execution

```
T001 ──► T002 ──► T003 ─────────────────────► T007 ──► T008
                  T004 ─────────────────────►
                  T005 ─────────────────────►
                  T006 ─────────────────────►
```

### Example: All three stories in parallel (2–3 developers)

```
Dev A: T002 → T003 → T004 → T005 → T006 → T007 → T008   (US1)
Dev B: T009 → T010 → T011 → T012 → T013 → T014            (US2)
Dev C: T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022  (US3)
       ↓ all complete
T023 + T024 (parallel) → T025 → T026                       (Polish)
```

---

## Implementation Strategy

**MVP = US1 only**. The character sheet, encumbrance status, and inventory are the three files explicitly named as technical debt in the constitution. Completing US1 satisfies the most critical part of the migration and unblocks story 001 completion criteria.

**Incremental delivery**:
1. Complete US1 → merge or demonstrate to verify approach
2. Complete US2 → equipment batch (all four files are structurally simple — no compound modifiers, no shared modules)
3. Complete US3 → pages batch (largest by file count; LoginPage shared-module case is the only unusual pattern)
4. Polish phase → run final verification checks

**Largest task**: T003 (`CharacterSheet.tsx` className update, ~80–100 occurrences). Use the regex find+replace workflow from `quickstart.md` to handle the bulk; review all dynamic/template-literal classNames manually afterward.
