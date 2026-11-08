# Character Creation Styling Architecture (read this before touching colors here)

## The trap: two parallel styling systems

This folder has **two separate CSS systems** and most components only use **one** of them —
but the file names make it look like they all use CSS Modules. They don't.

1. **CSS Modules** (`*.module.css` + `import styles from './X.module.css'` + `className={styles['foo']}`)
   - Classes get hashed at build time (e.g. `.foo` → `.foo_a1b2c3`).
   - A selector like `.character-wizard .wizard-content` written *inside* a module file has
     **both** tokens hashed. If the actual DOM element only has the literal string class
     `"wizard-content"` (no `styles[...]` reference), the compiled selector **never matches**.
     This is silent — no build error, the rule just never applies.

2. **Global legacy stylesheet** (`frontend/src/App.css`, imported once in `index.tsx`/`App.tsx`)
   - Plain, unhashed selectors like `.class-card`, `.wizard-content`, `.btn-primary`.
   - Matches any element with that literal string in `className`.

### What's actually used where (verified by grepping every `className=` in this folder)

| Element / feature | className used in JSX | Styled by |
|---|---|---|
| Outer wizard wrapper | `` `character-wizard ${styles['character-wizard']}` `` (both!) | Both — module sets `--cc-*` vars + container chrome; plain `App.css .character-wizard` sets max-width/padding |
| `.wizard-header` (title + step pills container) | `styles['wizard-header']` only | **CSS Module** (`CharacterWizard.module.css`) ✅ |
| `.wizard-navigation` (footer bar) | `styles['wizard-navigation']` only | **CSS Module** ✅ |
| Previous/Next buttons | `"btn btn-secondary"` / `"btn btn-primary"` (plain strings) | **App.css** `.btn`, `.btn-primary`, `.btn-secondary` — the `.nav-button`/`.nav-button.primary` rules in `CharacterWizard.module.css` are **dead code**, never applied |
| `.wizard-content` (step body container) | `"wizard-content"` (plain string, no `styles[]`) | **App.css** `.wizard-content` — the `.character-wizard .wizard-content` rule in the module file is **dead code** |
| `.step-content`, `.form-control` (Character Name input), step pills (`.step`, `.step-number`) | plain strings | **App.css** |
| Class/Species/Background cards & selects (`.class-card`, `.species-card`, `.background-card`, `.class-select`, etc.) | plain strings in `ClassSelector.tsx` / `SpeciesSelector.tsx` / `BackgroundSelector.tsx` | **App.css** (`.character-wizard .class-card` etc., ~line 920+) |
| Ability score method cards, point-buy, roll, assignment rows | plain strings in `AbilityScores.tsx` | **App.css** |
| Homebrew browser (`.homebrew-browser`, `.homebrew-item`, etc.) | plain strings in `Homebrew/HomebrewBrowser.tsx` | **Nothing matches** — `CharacterWizard.module.css` defines `.homebrew-*` rules but `HomebrewBrowser.tsx` never imports that module, so these are 100% unstyled today (falls back to browser defaults). Needs its own fix (move rules to `App.css` or add a module import) — not yet done.
| Weapon mastery dropdown (`ClassSelector.tsx`) | `styles['weaponMasterySelection']` etc. | **CSS Module** (`ClassSelector.module.css`) ✅ |
| Spell pickers (`WizardSpellPicker.tsx`, `MagicInitiateSpellPicker.tsx`) | `styles[...]` | **CSS Modules** ✅ (these two actually work correctly) |
| "Official sheet" print/review step (step 8) | plain strings | **App.css**, deliberately kept as light "parchment" look in print media only; dark-mode screen view already has `.character-wizard .official-sheet` overrides using `var(--app-*)` |

### Lesson learned (2026-11-07)
A full pass was made editing `CharacterWizard.module.css`, `ClassSelector.module.css`,
`WizardSpellPicker.module.css`, `MagicInitiateSpellPicker.module.css` to replace hardcoded
blue colors with theme tokens. It had **almost no visible effect** because most of the
wizard's DOM elements don't use those module classes at all — the real fix had to be applied
to `frontend/src/App.css`, which is what actually renders. **Before editing CSS for this
wizard, grep the relevant `.tsx` file for `className=` and confirm whether it's a plain
string (→ edit `App.css`) or `styles['...']` (→ edit the sibling `.module.css`).**

## CSS variable chain (for whichever file you end up editing)

```
theme.css      --theme-bg / --theme-bg-elevated / --theme-bg-accent / --theme-surface /
               --theme-border / --theme-text / --theme-text-muted / --theme-accent /
               --theme-accent-2 / --theme-danger / --theme-focus
                     │  (set per [data-theme] on :root: 'dark' default, 'tavern-light')
                     ▼
index.css      --app-bg-0/1/2 ← theme-bg/-elevated/-accent
               --app-ink-0/1  ← theme-text/-muted
               --app-border   ← theme-border
               --app-accent/-2 ← theme-accent/-2
               --app-danger   ← theme-danger
                     │
                     ▼
CharacterWizard.module.css (.character-wizard scope only — module-local, only reaches
the handful of elements that actually use styles[...]):
               --cc-bg-0/1/2, --cc-ink-0/1, --cc-border, --cc-accent/-2, --cc-surface
               (--cc-surface = var(--theme-surface) directly, no app-* indirection)
```

`App.css` (the actual source of truth for ~90% of the wizard) mostly references
`var(--app-*)` directly without a local `--cc-*` alias layer.

## Known remaining non-blue "mismatched" accents (left alone intentionally, not part of the
blue-theme bug — these are deliberate category colors, not broken theming)
- Point-buy tracker: amber/orange (`#b36a00`/`#f6a83a`) — consistent with D&D "points" UI convention elsewhere.
- Dice-roll section + rolled value badges + background feat panel: purple (`#7c4dab`/`#c084fc`) — consistent purple branding for "random roll" features.
- Success/complete states (`.step.completed`, `.score-badge.assigned`, `.final-scores-summary`): green — semantic success color, not theme-driven.
- Gold/currency displays (`.equipment-gold`, `.equip-gold-value`): amber/gold — semantic currency color.

These were left as-is during the 2026-11-07 fix pass. If full palette conformity is wanted
later, they'd need a deliberate decision on whether semantic colors should still exist
independently of the dark/tavern-light theme swap, or be folded into `--app-accent-2`/etc.
