# Research: CSS Module Migration

**Feature**: `002-css-modules-migration`  
**Branch**: `002-css-modules-migration`  
**Date**: 2026-04-20

---

## Resolved: CSS Module tooling support in this project

**Decision**: No build configuration changes are required.  
**Rationale**: The project uses `react-scripts` 5.0.1 (Create React App), which has built-in webpack CSS Modules support for any file ending in `.module.css`. TypeScript type-safety is handled automatically by CRA's type declarations. Renaming a file from `Foo.css` to `Foo.module.css` and updating the import from `import './Foo.css'` to `import styles from './Foo.module.css'` is sufficient.  
**Alternatives considered**: None needed — CRA makes this zero-config.

---

## Resolved: Print block classes and the @media print concern

**Decision**: No `:global()` workarounds are needed. The `App.css` `@media print` block is safe from this migration.  
**Rationale**: The spec edge-case identified `.sheet-main`, `.sheet-preview-toolbar`, `.core-stats-bar`, and `.character-sheet-layout` as print-targeted classes that could break if hashed by a CSS Module. Investigation confirms all four classes are **defined globally in `App.css`** (lines 2480, 2806, 3323) and **used in `CharacterWizard.tsx`** (which imports `CharacterCreation.css`). None of these classes appear in `CharacterSheet.css`. Migrating `CharacterSheet.css` or `CharacterCreation.css` to modules leaves these globals untouched — they will remain unscoped string class names in the JSX and in `App.css` exactly as today.  
**Alternatives considered**: `:global()` declarations inside a module (Option A from clarify session) — confirmed unnecessary.

---

## Resolved: CharacterSheet.css scoped-parent pattern

**Decision**: The entire `CharacterSheet.css` is under the `.character-sheet` parent scope — ALL selectors use the pattern `.character-sheet .child-class`. When migrated, both `.character-sheet` (the root) and every `.child-class` name will be locally hashed by CSS Modules. Every `className="xxx"` in `CharacterSheet.tsx` must be updated to `styles.xxx`.  
**Rationale**: CSS Modules locally scopes every top-level class selector in the file. In the compiled output, `.character-sheet .character-header` becomes `._character-sheet_abc123 ._character-header_def456`. The `character-header` class IS independently emitted by the module and must be looked up via `styles.characterHeader` in JSX. The migration of this one component involves updating approximately 80–100 `className` attribute occurrences in `CharacterSheet.tsx` (~1100 lines).  
**Alternatives considered**: N/A — this is how CSS Modules work.

---

## Resolved: External className passthrough pattern

**Decision**: Components that accept an external `className` prop (e.g., `EncumbranceStatus`, any component with `className?: string` in props) must preserve the external class alongside their own module classes.  
**Rationale**: `EncumbranceStatus.tsx` uses: `className={\`encumbrance-status ${getEncumbranceColor()} ${className}\`}`. After migration this becomes: `className={[styles.encumbranceStatus, styles[getEncumbranceColor()], className].filter(Boolean).join(' ')}`. The key change is: external string class passes through unchanged; internal classes are looked up from the `styles` object.  
**Alternatives considered**: `classnames` / `clsx` library — rejected because the project does not yet use it and the native array+join pattern is sufficient for all cases here.

---

## Resolved: Compound modifier classes

**Decision**: Compound class selectors like `.encumbrance-status.warning` where two classes on the same element gate a style must be handled by applying both module classes in JSX.  
**Rationale**: CSS Modules turns `.encumbrance-status.warning` into `._encumbranceStatus_abc ._warning_def` (both hashed). The JSX must apply both: `className={[styles.encumbranceStatus, styles.warning].join(' ')}`. For the EncumbranceStatus component `getEncumbranceColor()` currently returns a bare string (`'warning'` | `'danger'` | `'normal'`). After migration it must return the module class: `styles[getEncumbranceColor()]` — or the helper is refactored to use `styles` directly.  
**Alternatives considered**: none.

---

## Resolved: LoginPage.css dual-consumer placement

**Decision**: `LoginPage.module.css` is co-located in `frontend/src/pages/auth/`. Both `LoginPage.tsx` and `RegisterPage.tsx` import from `'./LoginPage.module.css'` (same relative path since they share the same directory).  
**Rationale**: The two files live in the same directory (`pages/auth/`). CRA CSS Modules do not prevent two sibling files from importing the same module file. No style duplication — there is exactly one `.module.css` file.  
**Alternatives considered**: A separate `auth.module.css` shared by both — rejected as unnecessary; the existing name is clear and co-location is already satisfied.

---

## Resolved: Migration scope boundary for styles/pages.css consumers

**Decision**: Components importing `styles/pages.css` that also use component-specific styles will use a mixed pattern: module `styles.xxx` for component-specific classes and plain string class names for `pages.css` utility classes (e.g., `page-container`, `hero-section`). No changes to `pages.css`.  
**Rationale**: Component CSS files being migrated (e.g., `Layout.css`, `CharacterCreation.css`) may contain classes that overlap with or supplement `pages.css` utilities. After migration, JSX will mix `className={styles.myClass}` (for module classes) with `className="page-container"` (for global `pages.css` classes). This is idiomatic React — combining CSS Module objects with global class strings.  
**Alternatives considered**: Migrating `pages.css` to a module — explicitly out of scope per spec and constitution.

---

## Summary table

| # | Question | Decision |
|---|----------|----------|
| 1 | Build tooling changes needed? | No — CRA 5 supports `.module.css` zero-config |
| 2 | Print block at risk from CharacterSheet migration? | No — print-targeted classes are global in `App.css` |
| 3 | CharacterSheet CSS pattern impact? | All child classes also need `styles.xxx` in JSX |
| 4 | External className prop components? | Use `[styles.root, externalClass].filter(Boolean).join(' ')` |
| 5 | Compound modifier classes? | Apply both module classes in JSX |
| 6 | LoginPage.module.css location? | Co-located in `pages/auth/`; both pages import it |
| 7 | pages.css consumers mix pattern? | Mix `styles.xxx` + global string class names in JSX |
