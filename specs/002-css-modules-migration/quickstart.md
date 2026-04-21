# CSS Module Migration — Quickstart Reference

**Feature**: `002-css-modules-migration`

This document walks through the mechanics of one complete migration. Use it as the reference for every file in the 14-file batch.

---

## Prerequisites

- CRA / react-scripts 5.0.1 is already configured to support CSS Modules out of the box — no `webpack.config.js` or `craco` changes needed.
- Rename a file from `Foo.css` to `Foo.module.css`. Done.
- TypeScript: CRA generates module typings automatically. If an editor shows "no exported member", restart the TS server; it self-resolves on TS server restart.

---

## Step-by-Step: EncumbranceStatus (reference example)

`EncumbranceStatus` is ideal as a reference: it uses compound modifier classes, accepts an external `className` prop, and is a self-contained, co-located component.

### 1. Rename the CSS file

```
frontend/src/components/Character/EncumbranceStatus.css
  → frontend/src/components/Character/EncumbranceStatus.module.css
```

No content changes needed yet — class names stay the same.

### 2. Update the TSX import

```tsx
// Before
import './EncumbranceStatus.css';

// After
import styles from './EncumbranceStatus.module.css';
```

### 3. Update all className attributes

Plain string → module lookup. Note the compound modifier pattern:

```tsx
// Before (line 61)
<div className={`encumbrance-status ${getEncumbranceColor(encumbranceStatus)} ${className}`}>

// After
<div className={[
  styles['encumbrance-status'],
  styles[getEncumbranceColor(encumbranceStatus)],  // 'warning' | 'danger' | 'normal' → styles['warning'] etc.
  className,                                         // external prop — kept as plain string
].filter(Boolean).join(' ')}>
```

```tsx
// Before — simple classes
<div className="encumbrance-header">
<span className="encumbrance-icon">
<div className="weight-bar">

// After
<div className={styles['encumbrance-header']}>
<span className={styles['encumbrance-icon']}>
<div className={styles['weight-bar']}>
```

```tsx
// Before — compound class on same element
<div className={`weight-fill ${getEncumbranceColor(encumbranceStatus)}`}

// After
<div className={[styles['weight-fill'], styles[getEncumbranceColor(encumbranceStatus)]].join(' ')}
```

### 4. Verify the CSS file

Compound selectors like `.encumbrance-status.warning .encumbrance-label` work as-is — CSS Modules will hash all local class names in them. No changes needed to selector syntax inside the `.module.css` file.

### 5. Smoke-test

Start the dev server and visually verify:
- Default state: normal bar
- Add 100 kg of items to trigger `warning` style
- Add 200+ kg to trigger `danger` style

---

## Step-by-Step: File in styles/ (needs moving)

For files currently in `src/styles/` (e.g., `styles/CharacterSheet.css`):

### 1. Move + rename

```
frontend/src/styles/CharacterSheet.css
  → frontend/src/components/Character/CharacterSheet.module.css
```

### 2. Update the TSX import

```tsx
// Before (CharacterSheet.tsx line 8)
import '../../styles/CharacterSheet.css';

// After
import styles from './CharacterSheet.module.css';
```

(Path changes from `'../../styles/CharacterSheet.css'` to `'./CharacterSheet.module.css'` because the module is now co-located.)

### 3. Update all className attributes (same as above)

---

## CharacterSheet — special note

`CharacterSheet.css` uses a scoped-parent pattern: all selectors are `.character-sheet .child-class`. In the CSS Module, **every class in the file is locally scoped** — including the child selectors. So the root div AND all child elements need `styles.xxx`:

```tsx
// Before
<div className="character-sheet">
  <header className="character-header">
    <div className="character-basic-info">

// After
<div className={styles['character-sheet']}>
  <header className={styles['character-header']}>
    <div className={styles['character-basic-info']}>
```

CharacterSheet.tsx is ~1100 lines with ~80–100 `className` attributes. A reliable find+replace workflow:

1. Do `Ctrl+D` or a regex replace within the file only — replace `className="` patterns one-by-one
2. Or use VS Code's Find+Replace in the single file with `className="([^"]+)"` → `className={styles['$1']}`
3. Review dynamically-constructed classNames (template literals, ternaries) by hand

---

## Shared module: LoginPage + RegisterPage

`styles/LoginPage.css` is consumed by **both** `pages/auth/LoginPage.tsx` and `pages/auth/RegisterPage.tsx`.

```
frontend/src/styles/LoginPage.css
  → frontend/src/pages/auth/LoginPage.module.css
```

Both TSX files update their import to:

```tsx
import styles from './LoginPage.module.css';
```

Both files live in the same directory (`pages/auth/`), so the relative path is identical.

---

## Mixed module + global class pattern

Some page components also use classes from `styles/pages.css` (shared layout utilities). These remain as plain string class names:

```tsx
// components that use both module classes and pages.css utilities
import styles from './CharacterList.module.css';

// pages.css utility class stays as string; own module class uses styles object
<div className={`page-container ${styles['character-list']}`}>
```

---

## Checklist per file

- [ ] CSS file renamed to `.module.css` (and moved to component directory if originally in `styles/`)
- [ ] TSX `import './Foo.css'` → `import styles from './Foo.module.css'` (path updated if moved)
- [ ] All `className="plain-string"` → `className={styles['plain-string']}`
- [ ] All dynamic template literal classNames updated (compound modifiers, external className prop)
- [ ] Dev server shows no CSS errors
- [ ] Component renders correctly in browser — compare before/after visually

---

## Files NOT to migrate (keep as global CSS)

| File | Reason |
|------|--------|
| `src/index.css` | Design tokens (`--color-*`, `--spacing-*`). Must remain global so all components can consume them. |
| `src/App.css` | App-wide resets, `@media print` character sheet — deliberately global. |
| `src/styles/pages.css` | Shared layout patterns used across 8+ components as utility classes. |
