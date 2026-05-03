# Quickstart: Spells Integration

**Branch**: `004-spells-integration`  
**Date**: 2026-04-22

---

## Prerequisites

- Docker is running: `docker compose up -d db`
- Backend venv active: `d:\projects\web\initiat2.0\backend\.venv\Scripts\Activate.ps1`
- Frontend dependencies installed: `cd frontend ; npm install`

---

## Backend Setup

### 1. Run the new migration

```powershell
cd d:\projects\web\initiat2.0\backend
python manage.py migrate
```

This applies `0004_characterspell_source_spellslotstate` which:
- Adds `source` field (default `'class'`) to all existing `CharacterSpell` rows
- Creates the `SpellSlotState` table

### 2. Verify the migration

```powershell
python manage.py showmigrations characters
```

Expected output includes `[X] 0004_characterspell_source_spellslotstate`.

### 3. Run backend tests

```powershell
python manage.py test apps.characters
```

All existing tests should pass. New contract tests for spell slots will be in `apps/characters/tests/`.

---

## Frontend Setup

No new package installations required.

### Run the dev server

```powershell
cd d:\projects\web\initiat2.0\frontend
npm start
```

---

## Verifying the Feature

### Smoke test: SPELLS tab appears for a spellcasting character

1. Log in and open a character whose class is Wizard, Cleric, Bard, Sorcerer, or Druid.
2. Go to the character management page.
3. Confirm a **SPELLS** tab appears in the actions pane alongside Stats, Combat, Equipment.
4. Click SPELLS and verify the spellcasting stat block renders (ability, modifier, save DC, attack bonus).

### Smoke test: No SPELLS tab for a Fighter (no spellcasting, no Magic Initiate)

1. Open a Fighter character with no Magic Initiate feat.
2. Confirm no SPELLS tab is present.

### Smoke test: Add a spell via MANAGE SPELLS

1. Open a Wizard character.
2. Click **SPELLS** → **MANAGE SPELLS**.
3. Search "Fire Bolt", select it, confirm.
4. Verify Fire Bolt appears in the SPELLS tab cantrip section.
5. Verify Fire Bolt also appears in the ACTIONS tab as an attack row.

### Smoke test: Spell slot toggle persists

1. On the SPELLS tab, click a Level 1 spell slot to mark it as spent.
2. Refresh the page.
3. Confirm the slot is still marked as spent.

### Smoke test: Long Rest restores slots

1. Mark two Level 1 slots as spent.
2. Click **Long Rest** in the character management area.
3. Confirm both Level 1 slots are now restored.

### Smoke test: Magic Initiate spell picker in creation wizard

1. Start creating a new character (any non-spellcasting class, e.g., Fighter).
2. At the species/origin step, select a background that grants an origin feat.
3. Choose **Magic Initiate** as the feat.
4. Confirm a spell picker appears listing cantrips and 1st-level spells from the chosen class.
5. Select 2 cantrips and 1 first-level spell; complete character creation.
6. On the character's SPELLS tab, verify all 3 spells appear with Magic Initiate attribution.

### Smoke test: Print second page

1. Open a spellcasting character with spells added.
2. Trigger print (Ctrl+P or Print button).
3. Confirm the print preview shows two pages — Page 1 is the character sheet, Page 2 is the spell sheet.

---

## Key File Locations

| What | Where |
|------|-------|
| New migration | `backend/apps/characters/migrations/0004_characterspell_source_spellslotstate.py` |
| Updated models | `backend/apps/characters/models.py` |
| Updated serializers | `backend/apps/characters/serializers.py` |
| Updated views | `backend/apps/characters/views.py` |
| Updated URLs | `backend/apps/characters/urls.py` |
| Backend contract tests | `backend/apps/characters/tests/test_spell_slots.py` |
| Frontend types | `frontend/src/types/index.ts` |
| Frontend API methods | `frontend/src/services/apiClient.ts` |
| CharacterSheet (tab added) | `frontend/src/components/Character/CharacterSheet.tsx` |
| SpellsTab component | `frontend/src/components/Character/SpellsTab.tsx` |
| SpellBrowser component | `frontend/src/components/Character/SpellBrowser.tsx` |
| SpellSlotTracker component | `frontend/src/components/Character/SpellSlotTracker.tsx` |
| SpellcastingStatBlock component | `frontend/src/components/Character/SpellcastingStatBlock.tsx` |
| SpellPrintPage component | `frontend/src/components/Character/SpellPrintPage.tsx` |
| MagicInitiateSpellPicker component | `frontend/src/components/CharacterCreation/MagicInitiateSpellPicker.tsx` |
| Print CSS | `frontend/src/App.css` (second page rules) |
