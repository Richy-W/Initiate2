# Implementation Plan: Spells Integration

**Branch**: `004-spells-integration` | **Date**: 2026-04-22 | **Spec**: [specs/004-spells-integration/spec.md](spec.md)  
**Input**: Feature specification from `/specs/004-spells-integration/spec.md`

## Summary

Add a full D&D Beyond-style SPELLS tab to the character management page for spellcasting characters. The tab shows the character's spellcasting stat block, spell slot tracker (with persistent spent-slot state), and a grouped spell list. A MANAGE SPELLS inline browser lets players add/remove spells. Attack cantrips and damaging spells appear on both the ACTIONS and SPELLS tabs. The Magic Initiate feat triggers a spell picker in both the character creation wizard and the level-up flow, recording spells via a new `source` field on `CharacterSpell`. The rest endpoint is extended to restore spell slots. A second print page renders the official D&D 5e 2024 spell sheet layout.

## Technical Context

**Language/Version**: Python 3.x (Django 4.x) + TypeScript (React 18)  
**Primary Dependencies**: Django REST Framework, djangorestframework-simplejwt, React, CSS Modules  
**Storage**: PostgreSQL (Docker Compose for local dev)  
**Testing**: pytest / Django test runner (backend); Jest + React Testing Library (frontend)  
**Target Platform**: Web SPA (desktop-first, mobile-responsive)  
**Project Type**: Web application  
**Performance Goals**: SPELLS tab load < 2 seconds after tab selection (SC-001)  
**Constraints**: CSS Modules required for all new components (Constitution §Technology Standards); JWT bearer auth on all new endpoints; no new global CSS files  
**Scale/Scope**: Single-user character management; moderate data volume (20 spells per character typical)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Bounded Module Design** | ✅ PASS | All new backend code lives in `apps/characters/`. Cross-boundary read of `content.Spell` via FK is permitted. No direct imports across app boundaries outside models.py. |
| **II. TDD** | ✅ PASS (plan) | API contract tests for `/api/character-spell-slots/` and the updated `/api/character-spells/` and `/api/characters/{id}/rest/` must be written before implementation begins. Business logic (slot validation, Magic Initiate eligibility check) must follow Red-Green-Refactor. UI components are presentational — TDD not required but encouraged. |
| **III. Technology Stack Compliance** | ✅ PASS | No new technologies. Python/Django/DRF backend, React/TypeScript frontend, PostgreSQL, CSS Modules. |
| **IV. SPA Design** | ✅ PASS | SPELLS tab is a new React component tree using client-side state. MANAGE SPELLS transitions inline — no full-page navigation. |
| **V. Technology Review** | ✅ PASS | No new technology adopted. |
| **VI. Accuracy & Intellectual Honesty** | ✅ PASS (plan) | Warlock pact magic detection uses a hardcoded `PACT_MAGIC_CLASSES` set in `views.py` with a `# TODO: derive from class JSON data` comment marking the approximation explicitly per constitution VI. Spellcasting profile formula (modifier = abilityMod + profBonus, DC = 8 + modifier) is correct per D&D 2024 PHB. |
| **VII. API Integration & Data Consistency** | ✅ PASS | `CharacterSpell` and `SpellSlotState` follow the same schema/validation pattern as other character join models. `source` field ensures MI spells are tracked to the same standard as class spells. |
| **CSS Modules** | ✅ PASS | All new frontend components use `.module.css` files. No new global stylesheets. Print rules added to existing `App.css` (already the designated global print stylesheet). |
| **JWT Auth** | ✅ PASS | `SpellSlotStateViewSet` will use `permission_classes = [IsAuthenticated]` (constitution default). No public endpoints added. |

### Post-Design Re-check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Bounded Module Design** | ✅ PASS | `SpellSlotState` and updated `CharacterSpell` owned by `apps/characters/`. `MagicInitiateSpellPicker` component lives in `components/CharacterCreation/` (owns its domain). `SpellsTab` and sub-components live in `components/Character/`. |
| **II. TDD** | ✅ PASS | Contract tests defined in `contracts/spell-slots.md`. Test file path: `apps/characters/tests/test_spell_slots.py`. |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-spells-integration/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
├── contracts/
│   └── spell-slots.md   ← Phase 1 complete
└── tasks.md             ← Phase 2 (created by /speckit.tasks — not yet)
```

### Source Code

```text
backend/
├── apps/
│   └── characters/
│       ├── models.py            ← add SpellSlotState model; add source to CharacterSpell
│       ├── serializers.py       ← add SpellSlotStateSerializer; update CharacterSpellSerializer
│       ├── views.py             ← add SpellSlotStateViewSet; extend rest action
│       ├── urls.py              ← register character-spell-slots router
│       ├── migrations/
│       │   └── 0004_characterspell_source_spellslotstate.py  ← new
│       └── tests/
│           ├── __init__.py      ← exists
│           ├── test_character_create_species_options.py  ← exists
│           └── test_spell_slots.py   ← new (TDD contract tests)

frontend/
├── src/
│   ├── types/
│   │   └── index.ts             ← add CharacterSpell, SpellSlotState, SpellcastingProfile types
│   ├── services/
│   │   └── apiClient.ts         ← add characterSpells CRUD + spellSlots CRUD methods
│   ├── components/
│   │   ├── Character/
│   │   │   ├── CharacterSheet.tsx          ← add 'spells' tab; add SpellsTab + SpellPrintPage
│   │   │   ├── SpellsTab.tsx               ← new
│   │   │   ├── SpellsTab.module.css        ← new
│   │   │   ├── SpellBrowser.tsx            ← new
│   │   │   ├── SpellBrowser.module.css     ← new
│   │   │   ├── SpellSlotTracker.tsx        ← new
│   │   │   ├── SpellSlotTracker.module.css ← new
│   │   │   ├── SpellcastingStatBlock.tsx   ← new
│   │   │   ├── SpellcastingStatBlock.module.css ← new
│   │   │   ├── SpellPrintPage.tsx          ← new
│   │   │   └── SpellPrintPage.module.css   ← new
│   │   └── CharacterCreation/
│   │       ├── MagicInitiateSpellPicker.tsx        ← new (replaces free-text inputs in SpeciesSelector)
│   │       ├── MagicInitiateSpellPicker.module.css ← new
│   │       └── SpeciesSelector.tsx         ← replace MI text inputs with MagicInitiateSpellPicker
│   └── App.css                  ← add @media print second-page rules
```

**Structure Decision**: Web application (Option 2). Backend additions are all within the existing `apps/characters/` module boundary. Frontend additions follow the established pattern: feature-owned component trees under `components/Character/` and `components/CharacterCreation/`, with CSS Modules per file.

## Complexity Tracking

No constitution violations. No complexity justification required.
