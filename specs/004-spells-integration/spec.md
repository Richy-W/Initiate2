# Feature Specification: Spells Integration

**Feature Branch**: `004-spells-integration`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "I want to implement spells into the character sheet and character builder design process. this should take into account the magic initiate feat as well as any spell casting classes. The PDF version of the spell sheet should be a second printed page following this format. we should implement it into our existing character management page in a similar way to dndbeyond creating a new tab on the actions pane. and should include a manage spells button"

## Clarifications

### Session 2026-04-21

- Q: How should spell slot recovery work — rest buttons on the SPELLS tab, shared rest buttons in the character management area, or manual per-slot recovery? → A: Long Rest and Short Rest buttons live in the shared character management area, not on the SPELLS tab itself; they reset spell slots along with all other per-rest trackers (death saves, limited-use features, Magic Initiate 1st-level spell use).
- Q: What UX pattern should MANAGE SPELLS use — slide-over panel, full-screen modal, or inline within the actions pane? → A: Inline within the actions pane (no overlay or modal). Additionally, attack cantrips and damaging spells must appear on both the ACTIONS tab (as attack rows) and the SPELLS tab (as spell rows).
- Q: Should the Magic Initiate spell picker appear only in character creation, or also in the level-up flow when the feat is first gained? → A: Both — the spell picker must trigger in both the character creation wizard and the level-up flow whenever Magic Initiate is newly acquired.
- Q: What should the SPELLS tab show when a spellcasting character has no spells added yet? → A: A clear empty-state message (e.g. "No spells added yet") with a prominent MANAGE SPELLS call-to-action button; this applies both when no spells have ever been added and when all spells have been removed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Track Spells on Character Sheet (Priority: P1)

A player with a spellcasting character (Wizard, Cleric, Bard, etc.) opens their character's management page and navigates to a new "SPELLS" tab. They see their spellcasting stat block (modifier, spell save DC, spell attack bonus), their current spell slot usage across all levels, and a grouped list of their cantrips and prepared/known spells. The player can mark spell slots as used (expanding/collapsing spent slots) and see which spells are concentration, ritual, or require material components — matching the D&D Beyond spells tab layout.

**Why this priority**: The spells tab is the core deliverable. A character sheet without visible spell tracking is incomplete for any spellcaster. All other stories depend on this view being in place.

**Independent Test**: Can be fully tested with a pre-seeded spellcasting character (e.g., Level 5 Wizard) by navigating to Character Detail → SPELLS tab and verifying the stat block, slot tracker, and spell list render correctly.

**Acceptance Scenarios**:

1. **Given** a logged-in player with a Wizard character, **When** they open the character management page, **Then** a "SPELLS" tab is visible in the actions pane navigation alongside existing tabs (ACTIONS, INVENTORY, etc.).
2. **Given** a player on the SPELLS tab, **When** the tab loads, **Then** they see their spellcasting ability, spell modifier, spell save DC, and spell attack bonus displayed at the top.
3. **Given** a Level 3 Wizard, **When** viewing the SPELLS tab, **Then** spell slots for levels 1 and 2 are displayed with total and expanded (used) counters, and clicking a slot toggles it between available and spent.
4. **Given** a player on the SPELLS tab, **When** viewing the spell list, **Then** cantrips appear in a "CANTRIP" section and spells are grouped by level (1ST LEVEL, 2ND LEVEL, etc.) with columns for Name, Casting Time, Range, Hit/DC, Effect summary, and Notes.
5. **Given** a player whose character has no spellcasting ability and no Magic Initiate feat, **When** they open the character management page, **Then** no SPELLS tab is shown.

---

### User Story 2 - Manage Spells (Add/Remove from Character) (Priority: P2)

A player with an existing spellcasting character clicks the "MANAGE SPELLS" button on the SPELLS tab. A spell browser opens, filtered by the character's class spell list and level. The player can search by name, filter by level or school, and mark spells as known/prepared. For prepared-spell classes (e.g., Cleric, Wizard), the player can toggle preparation status. For known-spell classes (e.g., Sorcerer, Bard), the player adds or removes known spells. Changes are saved back to the character.

**Why this priority**: Without the ability to manage spells, the tab is read-only and useless for any character whose spells haven't been manually added to the backend. This unlocks the full loop — view, add, remove.

**Independent Test**: Can be tested by clicking "MANAGE SPELLS" on a Level 2 Wizard, adding "Burning Hands", saving, and verifying the spell appears in the SPELLS tab list.

**Acceptance Scenarios**:

1. **Given** a player on the SPELLS tab, **When** they click "MANAGE SPELLS", **Then** the actions pane transitions inline to a spell browser view showing spells available to the character's class (no overlay or modal is used).
2. **Given** the spell browser is open, **When** the player searches "fireball", **Then** only spells matching the name are shown.
3. **Given** the spell browser is open, **When** the player selects a spell and confirms, **Then** the spell is added to the character's spell list and appears in the SPELLS tab.
4. **Given** a prepared-spell class character (e.g., Wizard), **When** the player views their spells, **Then** each spell shows a preparation toggle, and toggling it updates the character's prepared status.
5. **Given** the player removes a spell via MANAGE SPELLS, **When** the panel closes, **Then** the spell no longer appears in the character's spell list.
6. **Given** a Wizard character, **When** the spell browser opens, **Then** only Wizard spells of levels 0 through the character's maximum castable level are shown.

---

### User Story 3 - Magic Initiate Feat Spell Selection in Character Builder (Priority: P3)

A player building a character chooses the Magic Initiate feat (from background or origin). During the character creation wizard, they are prompted to choose a spellcasting class as the source and then select 2 cantrips and 1 first-level spell from that class's list. The same spell picker also appears in the level-up flow when a character gains the Magic Initiate feat for the first time during levelling. These selected spells are recorded on the character and appear in the SPELLS tab. The 1st-level spell granted by Magic Initiate can be cast once per long rest without using a spell slot.

**Why this priority**: Magic Initiate is a common feat for non-spellcasters. It is a separate user journey from primary spellcasting classes and can be implemented after the core SPELLS tab is functional.

**Independent Test**: Can be tested by creating a Fighter character with the Magic Initiate feat, selecting Wizard as the source, picking Fire Bolt and Minor Illusion as cantrips and Burning Hands as the 1st-level spell, then verifying those spells appear in the SPELLS tab with a "Cast Once Per Long Rest" annotation on the 1st-level spell.

**Acceptance Scenarios**:

1. **Given** a player in the character creation wizard who has selected a background that grants Magic Initiate, **When** the origin/feat step is reached, **Then** a spell selection sub-step appears asking them to choose a source class and spells.
2. **Given** the Magic Initiate spell picker, **When** the player selects a source class, **Then** only cantrips and 1st-level spells from that class are shown for selection.
3. **Given** the Magic Initiate spell picker, **When** the player selects spells, **Then** exactly 2 cantrips and 1 first-level spell must be chosen before proceeding.
4. **Given** a completed character with Magic Initiate, **When** viewing the SPELLS tab, **Then** the 2 cantrips and the 1st-level spell are listed, with the 1st-level spell annotated as castable once per long rest without a slot.
5. **Given** a character with both a spellcasting class and the Magic Initiate feat, **When** viewing the SPELLS tab, **Then** all spells from both sources appear together, correctly attributed.
6. **Given** an existing character who gains the Magic Initiate feat through the level-up flow, **When** the feat is confirmed, **Then** the same spell picker sub-step appears inline in the level-up flow before the level-up is finalised, requiring the player to choose their source class, 2 cantrips, and 1 first-level spell.

---

### User Story 4 - Print Spell Sheet as Second Page (Priority: P4)

A player with a spellcasting character prints their character sheet (or saves as PDF). The resulting document is two pages: Page 1 is the existing character sheet, and Page 2 is the spell sheet laid out in the official D&D 5e 2024 format — including the spellcasting stat block, spell slot grid, and the cantrips & prepared spells table as shown in the provided PDF reference image.

**Why this priority**: This is a polish feature following the core spell tab. Print output depends on the SPELLS tab data being available and correct.

**Independent Test**: Can be tested by triggering the print action on a character with known spells and verifying the browser print preview shows two pages — page 1 the character sheet, page 2 the spell sheet — both matching the expected layout.

**Acceptance Scenarios**:

1. **Given** a character with spells, **When** the player clicks "Print Character Sheet", **Then** the print preview shows two pages.
2. **Given** the print preview is open, **When** the player views page 2, **Then** it contains the spellcasting ability box, spell save DC, spell attack bonus, the spell slot grid (levels 1–9 with Total/Expanded columns), and the Cantrips & Prepared Spells table.
3. **Given** the print preview page 2, **When** the cantrips & spells table is populated, **Then** each row shows Level, Name, Casting Time, Range, Concentration (C), Ritual (R), Material (M) indicators, and Notes.
4. **Given** a character without any spells, **When** the player prints, **Then** only Page 1 is rendered (no blank spell sheet page is added).

---

### Edge Cases

- What happens when a character belongs to a class with no spellcasting (e.g., Fighter with no subclass)? No SPELLS tab shown; no second print page.
- What happens if a spell appears on both the ACTIONS tab and the SPELLS tab and the player removes it via MANAGE SPELLS? It disappears from both tabs simultaneously — there is one canonical spell list, displayed in two places.
- What if a non-spellcasting class character gains Magic Initiate? SPELLS tab appears showing only Magic Initiate spells.
- What happens when a character levels up and gains new spell slots? Slot tracker updates to reflect new maximum; previously spent slots beyond the new max are auto-recovered.
- How does the system handle a character who has prepared more spells than their class maximum? The system warns the player during management but does not block saving (to support DM overrides in campaigns set to permissive rule validation).
- What if spell data for a class spell is missing from the content database? The spell entry still shows in the manage panel marked as "data unavailable"; the character's spell list entry continues to display the spell by name with a warning indicator.
- What happens when a Warlock character's spell slots are displayed? Warlocks use Pact Magic — all slots are the same level and recover on short rest. The slot display must reflect this correctly instead of the standard multi-level chart. The shared Short Rest button in the character management area MUST restore Warlock Pact Magic slots, while the Long Rest button restores standard slots for all other classes.
- What if a multiclass character combines two spellcasting classes? Spell slots are pooled using the standard multiclass spellcasting table; the slot grid reflects the combined pool, not per-class slots.
- What does the SPELLS tab show when a spellcasting character has no spells? An empty-state message (e.g. "No spells added yet") is displayed with a prominent MANAGE SPELLS button as the primary call to action. The stat block and slot tracker are still visible above the empty list so the player knows their spellcasting stats.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The character management page MUST display a "SPELLS" tab in the actions pane navigation for any character whose class grants spellcasting or who has the Magic Initiate feat.
- **FR-002**: The SPELLS tab MUST display a spellcasting stat block showing: spellcasting ability name, spell modifier value, spell save DC, and spell attack bonus — all calculated from the character's current ability scores and proficiency bonus.
- **FR-003**: The SPELLS tab MUST display spell slots for each level (1–9) where the character has slots, showing total available and how many have been spent, with the ability to toggle individual slots as spent. Slot recovery is performed via Long Rest and Short Rest buttons located in the shared character management area (not on the SPELLS tab itself).
- **FR-004**: Slot usage state (spent slots) MUST be persisted to the character record so it survives page refreshes. A Long Rest action MUST restore all standard spell slots; a Short Rest action MUST restore Warlock Pact Magic slots. Both rest actions MUST also reset all other per-rest trackers on the character (death saves, limited-use feature counts, Magic Initiate 1st-level spell use).
- **FR-005**: The SPELLS tab MUST group spells by level with "CANTRIP" as the first group followed by "1ST LEVEL", "2ND LEVEL", etc., displaying Name, Casting Time, Range, Hit/DC, Effect summary, and Notes per row.
- **FR-006**: Each spell row MUST visually indicate Concentration (C), Ritual (R), and Material Component (M) requirements using icons or badges.
- **FR-007**: A "MANAGE SPELLS" button MUST be present on the SPELLS tab and MUST transition the actions pane inline to a spell browser view for adding or removing spells; no modal or overlay is used.
- **FR-007a**: Attack cantrips and spells that deal damage MUST appear on both the ACTIONS tab (as attack rows with hit bonus and damage) and the SPELLS tab (as spell rows with full spell detail). Entries on the ACTIONS tab are derived from the character's spell list and must stay in sync — adding or removing a damaging spell via MANAGE SPELLS must immediately update the ACTIONS tab attack list.
- **FR-008**: The spell browser MUST filter available spells to only those on the character's class spell list(s) and within the character's accessible spell levels.
- **FR-009**: The spell browser MUST support text search by spell name, filtering by spell level, and filtering by school of magic.
- **FR-010**: Characters using prepared-spell mechanics (Wizard, Cleric, Druid, Paladin) MUST be able to toggle individual spells as prepared or unprepared; the current prepared count MUST be shown against the class maximum.
- **FR-011**: Both the character creation wizard and the level-up flow MUST detect when the Magic Initiate feat is newly acquired and display a spell selection sub-step for choosing a source class, 2 cantrips, and 1 first-level spell. The sub-step MUST block progression until all three spells are selected. If a character already has Magic Initiate spells recorded, the sub-step MUST be skipped (re-gaining the feat does not reset choices).
- **FR-012**: Spells selected via Magic Initiate MUST be stored on the character with a source attribute distinguishing them from class spells.
- **FR-013**: The 1st-level spell granted by Magic Initiate MUST be trackable as a per-long-rest limited use (not consuming a standard spell slot).
- **FR-014**: The print action MUST produce a two-page output for characters with spells: Page 1 is the existing character sheet; Page 2 is the spell sheet in the official D&D 5e 2024 layout.
- **FR-015**: The spell sheet print page MUST include: the spellcasting ability block (ability name, modifier, save DC, attack bonus), the spell slot grid (levels 1–9, Total and Expanded columns), and the Cantrips & Prepared Spells table with all columns.
- **FR-016**: Characters with no spellcasting and no Magic Initiate feat MUST NOT see the SPELLS tab and MUST NOT have a second print page rendered.
- **FR-017**: Warlock characters MUST have their Pact Magic spell slots displayed correctly: all slots at one level, recoverable on short rest, correctly separated from any multiclass standard spell slots.
- **FR-018**: When a spellcasting character has no spells recorded, the SPELLS tab MUST display an empty-state message (e.g. "No spells added yet") and a prominent MANAGE SPELLS call-to-action button. The spellcasting stat block and slot tracker MUST still render above the empty list. This empty state applies both to characters who have never added spells and to characters who have removed all spells.

### Key Entities

- **Spell**: Content entity (already exists) with level (0–9), school, casting time, range, components (V/S/M), duration, concentration flag, ritual flag, and description.
- **CharacterSpell**: Join entity linking a character to a spell (already partially exists); needs a `source` field (`class` vs `magic_initiate`) and any is_always_prepared handling reviewed for Magic Initiate.
- **SpellSlotState**: Tracks how many slots at each level are currently spent for a character. Does not currently exist; must be added. Recovery is triggered externally by shared Long Rest / Short Rest actions (not owned by this entity itself).
- **SpellcastingProfile**: Runtime-computed data (not stored) — the character's spellcasting ability key, modifier, save DC, and attack bonus derived from class data and ability scores.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can navigate to the SPELLS tab and see their full populated spell list within 2 seconds of tab selection.
- **SC-002**: Players can add a spell to their character via the MANAGE SPELLS browser in 5 or fewer interactions from the moment they click "MANAGE SPELLS".
- **SC-003**: Spent spell slot state persists correctly: refreshing the character page shows the same spent-slot configuration as before the refresh.
- **SC-004**: A character created with the Magic Initiate feat has all 3 selected spells (2 cantrips + 1 first-level) visible on the SPELLS tab immediately after wizard completion, without any additional manual steps.
- **SC-005**: Printing a spellcasting character's sheet produces a 2-page output where Page 2 is correctly populated with spells and spellcasting stats.
- **SC-006**: Characters with no spells display no SPELLS tab, keeping the interface uncluttered for non-casters.
- **SC-007**: All necessary spell indicators (concentration, ritual, material component) are visible at a glance in the spell list without requiring the player to open individual spell details.

## Assumptions

- The existing `Spell` content model contains a sufficient dataset covering the core PHB spellcasting classes. If not, populating the spell database is a prerequisite task outside this feature.
- "Magic Initiate" feat is identifiable by matching `feat.id` or `feat.name` to "magic-initiate", consistent with the approach used in the `003-fix-human-origin-feat-dropdown` feature.
- Spell slot counts per class and level follow the standard D&D 5e 2024 progression tables and are derived from the existing class JSON data in `api/content/classes/`.
- The existing `CharacterSpellViewSet` provides a working REST base for reading and writing character spells; only the `source` field and spell slot state persistence need to be added to the backend.
- The character sheet tab navigation being extended is the mobile tab nav (`character-tabs`). On desktop, the SPELLS content will be injected as a new section alongside the existing layout.
- Spell preparation maximums follow standard rules (e.g., Wizards: intelligence modifier + level; Clerics/Druids: wisdom modifier + level); all known spells for known-spell classes count as always prepared.
- Multiclass spell slot pooling follows the standard D&D 5e multiclass spellcasting table.
