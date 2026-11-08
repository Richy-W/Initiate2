# Manual Test Plan: Character Traits and Math Parity (Feature 006)

Pre-merge verification checklist for the `006-character-traits-and-math-parity` branch before opening the PR.

## 0. Servers (already running)

| Service | URL | How it was started |
| --- | --- | --- |
| Postgres + Redis | `localhost:5432` / `localhost:6379` | `docker compose up -d db redis` (from `docker/`) |
| Backend (Django) | http://127.0.0.1:8000 | `.venv\Scripts\python.exe manage.py runserver` (from `backend/`) |
| Frontend (React) | http://localhost:3000 | `npm start` (from `frontend/`) |

If a server needs restarting:
```powershell
# Backend
cd backend; e:/Projects/web/TavernKeeper/.venv/Scripts/python.exe manage.py runserver

# Frontend (PowerShell blocks npm.ps1 by default)
cd frontend; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; npm start
```

Database is a fresh Postgres container — you'll need to **register a new account** in the UI (no seeded users).

---

## 1. Run automated suites first (fast regression gate)

```powershell
# Backend (from backend/)
e:/Projects/web/TavernKeeper/.venv/Scripts/python.exe manage.py test apps.characters

# Frontend (from frontend/)
npx cross-env CI=true react-scripts test --watchAll=false src/components/Character src/utils
```

Expected (per quickstart.md sign-off notes): backend 58 tests passing, frontend 11 tests passing (3 suites). Stop and investigate before doing manual testing if anything fails here — manual testing assumes these pass.

---

## 2. Test characters to create

Create these via the normal UI character-creation flow (Dashboard → New Character). They cover every user story below.

| # | Species | Class | Level | Why |
| --- | --- | --- | --- | --- |
| A | Dragonborn | Fighter | 1, then level to 5 | Natural armor (draconic scales), natural attack (breath weapon, PB-scaling), subclass at level 3 (Champion), HP scaling |
| B | Elf | Wizard or Sorcerer | 1, then level to 5 | Lineage spell auto-grants at 1/3/5, free-cast controls, non-caster-with-lineage path if you pick a non-caster class instead |
| C | Monk or Barbarian | — | 1 | Unarmored defense AC consistency |
| D | Any | Paladin or Cleric | 5+ | Point-pool resource (Lay on Hands / Channel Divinity) quick +/- and numeric spend |

---

## 3. User Story 1 — Creation applies species/class choices correctly

Using character **A** (Dragonborn Fighter):
1. During creation, select species variant/skill/feat options where offered.
2. Pick an origin feat (e.g. Magic Initiate or Skilled) if available for the background.
3. After creation, open the character detail page and confirm:
   - [ ] Selected skills/tools appear exactly once (no duplicates).
   - [ ] Origin feat shows as a feature with correct source label.
   - [ ] No proficiency is double-counted in the Stats tab.

Using character **B** (Elf):
4. Confirm lineage spell appears on the Spells tab immediately at level 1 with correct source attribution (e.g. "Species: Elf").

---

## 4. User Story 2 — Complete, deduplicated, source-labeled features

On character **A** at level 5:
- [ ] All class features unlocked through level 5 appear exactly once (check Second Wind, Action Surge if Fighter level ≥2, subclass features from level 3).
- [ ] Species traits (Draconic Ancestry, Breath Weapon, Damage Resistance) appear with "Species" source label.
- [ ] Background feature (e.g. Soldier's Military Rank) appears with "Background" label.
- [ ] No feature is hidden or miscategorized due to name-based filtering (scan the full list — nothing should silently disappear).

---

## 5. User Story 3 — Derived math is consistent across panels

On character **A**:
- [ ] Ability modifiers match between Stats tab and Combat tab (spot check STR/DEX/CON).
- [ ] AC reflects **natural armor** (draconic scales formula) while unarmored.
- [ ] Equip a worn armor item → AC switches to worn-armor formula and natural armor is suppressed (confirm via any override/precedence indicator if shown in UI).
- [ ] Unequip armor → natural armor AC re-applies.
- [ ] Breath Weapon appears as an attack row in Combat with correct ability (CON), damage dice, and damage type.

On character **C** (Monk/Barbarian, no armor):
- [ ] AC uses unarmored defense formula (not standard 10 + Dex).
- [ ] Attack bonus and skills relying on the same ability remain consistent with displayed AC ability.

On character **B** (Elf) if a caster:
- [ ] Spell save DC / spell attack bonus use effective ability totals (verify math: 8 + PB + ability mod for DC).

Non-caster-with-lineage check (create a quick throwaway Fighter/Elf with no class spellcasting):
- [ ] Spells tab is still visible, showing only lineage spell(s) and free-cast tracking.

---

## 6. User Story 4 — Trait counters and recharge rules

On character **A** (Dragonborn Fighter, level 5, PB = +3):
1. Open the Breath Weapon counter.
   - [ ] Max uses = Proficiency Bonus (3 at level 5).
   - [ ] Use it until 0; confirm it cannot go negative and the UI blocks further use at 0.
2. Take a **Short Rest**.
   - [ ] Breath Weapon (long-rest only) stays at 0 — does NOT reset.
3. Take a **Long Rest**.
   - [ ] Breath Weapon resets to max.
4. Level up from 5 → 6 (if PB increases at this threshold in your build, otherwise pick a level crossing a PB breakpoint like 5→9 is out of scope; at minimum re-verify at level 9 if time allows):
   - [ ] Max uses recomputes correctly and current-use state remains valid (not clamped incorrectly).

On character **D** (Paladin/Cleric) — pooled resource:
5. Open the resource counter (Lay on Hands or Channel Divinity).
   - [ ] Quick `+`/`-` buttons adjust current value by 1.
   - [ ] Numeric spend input accepts an exact amount and rejects overspend (try spending more than current pool — should be blocked, not go negative).
6. As the character owner, try a **DM/character-level override** and a **per-feature override** if exposed in UI (per FR-018a / resource override controls) — confirm overrides are visually distinguished/audited.

---

## 7. User Story 6 — Subclass framework

On character **A** (Fighter, subclass level = 3):
1. At character level 1–2 (before subclass level), confirm **no subclass selection UI** is offered.
2. Level up to 3:
   - [ ] Subclass selection step appears in Level Up flow.
   - [ ] Only Fighter subclasses are selectable (no cross-class leakage).
3. Select **Champion** (or whichever subclass is available), save.
   - [ ] Subclass features for levels ≤3 appear immediately on the character page.
4. Skip subclass selection on a **second** test character that reaches level 3+ without saving a subclass:
   - [ ] Character remains playable.
   - [ ] A visible warning state is shown (e.g. banner/badge indicating missing subclass).
5. On the subclass-selected character, change the subclass to a different valid option (if more than one exists) or re-save the same one via the change flow:
   - [ ] A warning/confirmation prompt appears before the change is saved.
   - [ ] After saving, check backend for a DM audit event (`SubclassChangeAuditEvent`) — can verify via Django admin at http://127.0.0.1:8000/admin/ or a quick shell query.
6. Level a character directly to level 5+ and then save a subclass for the first time:
   - [ ] All subclass mechanics up through the current level are backfilled immediately (not just the level-3 ones).
7. Attempt an invalid subclass value via direct API call (optional, for thoroughness):
   ```
   POST /api/v1/characters/{id}/subclass/  { "subclass_slug": "not-a-real-subclass" }
   ```
   - [ ] Request is rejected with a validation error.

---

## 8. Cross-cutting / regression sanity

- [ ] Existing (pre-feature) characters, if any remain in the DB, still load without error (migration 0007 shouldn't break legacy rows). Since this is a fresh DB, skip if none exist.
- [ ] Character list page and dashboard still load normally.
- [ ] No console errors in the browser dev tools while navigating Stats/Combat/Spells/Features tabs.
- [ ] No Django server errors/tracebacks in the backend terminal while performing the above steps.

---

## 9. Sign-off

Once all checkboxes above are confirmed:
1. Stop dev servers (optional) or leave running.
2. Commit the staged changeset on `006-character-traits-and-math-parity`.
3. Push the branch and open the PR against `main`.
