# Implementation Plan: CSS Module Migration

**Branch**: `002-css-modules-migration` | **Date**: 2026-04-20 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/002-css-modules-migration/spec.md`

## Summary

Migrate 14 component-level plain global CSS files to CSS Modules (`.module.css`) to comply with the constitution's Styling standard. Each file is renamed and co-located with its owning component. All consuming TSX files are updated to use named `import styles from './Foo.module.css'` imports and `styles.xxx` class references. Three global files (`index.css`, `App.css`, `styles/pages.css`) are **not** migrated. No backend changes. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 4.9.5 / JavaScript (ES6+)  
**Primary Dependencies**: React 19.2.5, react-scripts 5.0.1 (Create React App with built-in CSS Modules support)  
**Storage**: N/A — frontend CSS refactor only  
**Testing**: Jest + React Testing Library (component tests encouraged but not blocking per constitution II)  
**Target Platform**: Browser (SPA, desktop-first responsive)  
**Project Type**: Web application — frontend-only change  
**Performance Goals**: No regression in render or layout performance; Lighthouse score maintained  
**Constraints**: No new npm dependencies permitted (constitution V); existing global files `index.css`, `App.css`, `styles/pages.css` must not change  
**Scale/Scope**: 14 CSS files, 14 TSX files updated, 2 additional TSX files (RegisterPage shares LoginPage module)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Styling: CSS Modules for all component-level styles | ✅ PASS | This feature directly implements this requirement |
| No new global stylesheets for component-specific styles | ✅ PASS | Existing global files unchanged; component CSS becoming modules |
| No new technology without documented justification | ✅ PASS | CSS Modules are already mandated by constitution; zero new deps |
| Bounded Module Design: no cross-app imports | ✅ PASS | Frontend-only refactor; no new coupling introduced |
| Single-Page Application Design: responsive, component-based | ✅ PASS | No architectural change, only scope of CSS classes |
| TDD enforcement | ✅ PASS (scoped) | Constitution II exempts presentational components from implementation-blocking tests; CSS migration is purely presentational |

**Post-design re-check**: All gates confirmed. The print block concern identified in the clarify session was resolved by research — `.sheet-main`, `.sheet-preview-toolbar`, `.core-stats-bar` are global classes defined in `App.css` and consumed directly in `CharacterWizard.tsx`; they are not in any of the 14 files being migrated. No risk to print layout.

## Project Structure

### Documentation (this feature)

```text
specs/002-css-modules-migration/
├── plan.md              # This file
├── research.md          # Phase 0 — all unknowns resolved
├── quickstart.md        # Phase 1 — migration reference guide
├── contracts/           # N/A — no API surface changes
└── tasks.md             # Phase 2 output (via /speckit.tasks — not yet created)
```

### Source Code — Affected Files

This feature touches only `frontend/src/`. No backend changes.

```text
frontend/src/
│
│  ── GLOBAL FILES (DO NOT MIGRATE) ──
├── index.css                                    # design tokens — global, keep as-is
├── App.css                                      # app-wide resets + @media print — global, keep as-is
├── styles/
│   └── pages.css                               # shared layout utilities — global, keep as-is
│
│  ── CHARACTER COMPONENTS (P1 batch) ──
├── components/Character/
│   ├── CharacterSheet.tsx  ──imports──►  CharacterSheet.module.css  (move from styles/)
│   ├── CharacterSheet.module.css           (was styles/CharacterSheet.css)
│   ├── EncumbranceStatus.tsx  ────────►  EncumbranceStatus.module.css  (rename in place)
│   ├── EncumbranceStatus.module.css        (was EncumbranceStatus.css)
│   ├── Inventory.tsx  ────────────────►  Inventory.module.css  (rename in place)
│   ├── Inventory.module.css               (was Inventory.css)
│   ├── OfficialIdentityHeader.tsx  ───►  OfficialIdentityHeader.module.css  (move from styles/)
│   └── OfficialIdentityHeader.module.css   (was styles/OfficialIdentityHeader.css)
│
│  ── EQUIPMENT COMPONENTS (P2 batch) ──
├── components/Equipment/
│   ├── EquipmentBrowser.tsx  ─────────►  EquipmentBrowser.module.css  (rename in place)
│   ├── EquipmentBrowser.module.css        (was EquipmentBrowser.css)
│   ├── EquippedItems.tsx  ────────────►  EquippedItems.module.css  (rename in place)
│   ├── EquippedItems.module.css           (was EquippedItems.css)
│   ├── ItemDetail.tsx  ───────────────►  ItemDetail.module.css  (rename in place)
│   ├── ItemDetail.module.css              (was ItemDetail.css)
│   ├── MagicalProperties.tsx  ────────►  MagicalProperties.module.css  (rename in place)
│   └── MagicalProperties.module.css       (was MagicalProperties.css)
│
│  ── CREATION / EDITING (P2 batch) ──
├── components/CharacterCreation/
│   ├── CharacterWizard.tsx  ──────────►  CharacterWizard.module.css  (move from styles/CharacterCreation.css)
│   └── CharacterWizard.module.css         (was styles/CharacterCreation.css)
│
├── components/CharacterEditing/
│   ├── CharacterEditor.tsx  ──────────►  CharacterEditor.module.css  (move from styles/CharacterEditor.css)
│   └── CharacterEditor.module.css         (was styles/CharacterEditor.css)
│
│  ── PAGES (P3 batch) ──
├── pages/
│   ├── CharacterList.tsx  ────────────►  CharacterList.module.css  (move from styles/)
│   ├── CharacterList.module.css           (was styles/CharacterList.css)
│   ├── HelpPage.tsx  ─────────────────►  HelpPage.module.css  (rename in place)
│   └── HelpPage.module.css               (was HelpPage.css)
│
└── pages/auth/
    ├── LoginPage.tsx  ────────────────►  LoginPage.module.css  (move from styles/)
    ├── RegisterPage.tsx  ─────────────►  (same LoginPage.module.css — shared)
    └── LoginPage.module.css              (was styles/LoginPage.css — shared by both pages)
```

**Structure Decision**: Frontend only. CSS files are co-located with their owning component/page. The 8 files currently in `styles/` (CharacterSheet, OfficialIdentityHeader, CharacterCreation, CharacterEditor, CharacterList, Layout, LoginPage, pages.css) are moved to their component's directory on migration. The 6 files already co-located (EquipmentBrowser, EquippedItems, ItemDetail, MagicalProperties, Inventory, EncumbranceStatus, HelpPage) are renamed in place.

### Layout component note

`components/Layout.tsx` imports `styles/Layout.css`. After migration:
- `styles/Layout.css` → `components/Layout.module.css` (moved, renamed)

| Batch | Priority | Files | TSX Files Touched |
|-------|----------|-------|-------------------|
| P1 — Character core | High | CharacterSheet, EncumbranceStatus, Inventory, OfficialIdentityHeader | 4 |
| P2 — Equipment + Creation | Medium | EquipmentBrowser, EquippedItems, ItemDetail, MagicalProperties, CharacterWizard, CharacterEditor | 6 |
| P3 — Pages + Layout | Lower | CharacterList, Layout, LoginPage, HelpPage | 4 (LoginPage covers 2 TSX files) |

## Key Implementation Patterns

### 1. Standard migration (simple component)
```tsx
// Before
import './Inventory.css';
<div className="inventory-container">

// After
import styles from './Inventory.module.css';
<div className={styles['inventory-container']}>
// or with camelCase (if class names are camelCase):
<div className={styles.inventoryContainer}>
```

### 2. CharacterSheet scoped-parent pattern
All classes in `CharacterSheet.css` are under `.character-sheet .child-class`. Both the root and all child classes are locally scoped when converted to a module. Every `className="xxx"` in `CharacterSheet.tsx` needs `styles.xxx` — this includes root and all descendants.
```tsx
// Before
<div className="character-sheet">
  <header className="character-header">

// After
import styles from './CharacterSheet.module.css';
<div className={styles['character-sheet']}>
  <header className={styles['character-header']}>
```

### 3. External className passthrough (EncumbranceStatus)
```tsx
// Before
<div className={`encumbrance-status ${getEncumbranceColor()} ${className}`}>

// After
import styles from './EncumbranceStatus.module.css';
<div className={[styles['encumbrance-status'], styles[getEncumbranceColor()], className].filter(Boolean).join(' ')}>
```
> `getEncumbranceColor()` returns `'warning' | 'danger' | 'normal'`. These are also top-level classes in the module, so `styles[getEncumbranceColor()]` resolves them correctly.

### 4. Shared module (LoginPage + RegisterPage)
```tsx
// LoginPage.tsx
import styles from './LoginPage.module.css';

// RegisterPage.tsx — same file, same relative path (both in pages/auth/)
import styles from './LoginPage.module.css';
```

### 5. Mixed module + global classes (pages.css utilities)
```tsx
// Components that use both module classes and pages.css utilities
// pages.css global classes stay as string literals; only component-specific classes use styles.xxx
<div className={`page-container ${styles.characterList}`}>
```

## Complexity Tracking

No constitution violations. This feature resolves an existing technical debt item noted in the constitution's Styling section ("Story 001 used plain global CSS files...These must be migrated to CSS Modules before story 001 is considered complete."). No new complexity introduced.
