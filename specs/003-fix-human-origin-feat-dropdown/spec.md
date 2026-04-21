# Feature Specification: Fix Human Origin Feat Dropdown on Character Creation

**Feature Branch**: `003-fix-human-origin-feat-dropdown`  
**Created**: 2026-04-21  
**Status**: Draft  
**Input**: User description: "we are fixing a defect on the create character page where the human should be able to select an origin feat but is instead given a text box to type. This should be a drop down with all of the origin feats listed in the same styles as the rest of the page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Origin Feat via Dropdown (Priority: P1)

A player choosing the Human species during character creation currently encounters a plain text input box labeled "Origin Feat Choice" when they should see a styled dropdown populated with all available origin feats.

**Why this priority**: This is the core defect. The current text box provides no guidance on valid origin feats, forces players to type exact names, and is inconsistent with the rest of the character creation wizard's select-based UI pattern.

**Independent Test**: Can be fully tested by navigating to Character Creation → selecting Human as the species → verifying the "Origin Feat Choice" control is a dropdown pre-populated with all origin feats.

**Acceptance Scenarios**:

1. **Given** a user is on the Species step, **When** they select "Human" as their species, **Then** an "Origin Feat Choice" dropdown appears listing all available origin feats (Alert, Magic Initiate, Savage Attacker, Skilled, Tough) instead of a free-text input.
2. **Given** the dropdown is visible, **When** a user selects a feat from the list, **Then** the chosen feat is recorded in the character data, shown in the Review step, and a brief summary of the selected feat is displayed immediately below the dropdown on the Species step.
3. **Given** the dropdown is visible with no feat yet chosen, **When** the page first loads with Human selected, **Then** the dropdown displays a non-submittable prompt ("-- Choose an origin feat --") that does not count as a valid selection.
4. **Given** a Human is selected but no origin feat has been chosen, **When** the user attempts to advance to the next step, **Then** advancement is blocked and a validation message prompts them to select an origin feat.
5. **Given** origin feats cannot be loaded from the server, **When** the dropdown would normally render, **Then** a clear inline error message is shown instead of a broken or empty control.

---

### User Story 2 - Consistent Visual Styling (Priority: P2)

The new dropdown must look and behave consistently with the other dropdowns already on the Species Selection step (Skill Proficiency Choice, Size Choice, Spellcasting Ability Choice), which all use the `species-select` CSS class.

**Why this priority**: Visual inconsistency erodes trust and signals to users that the interface is incomplete.

**Independent Test**: Can be tested by comparing the appearance of the origin feat dropdown against the existing "Skill Proficiency Choice" dropdown on the same step.

**Acceptance Scenarios**:

1. **Given** the origin feat dropdown is rendered, **When** a user views the Species step with Human selected, **Then** the dropdown matches the height, width, font, border, and color styling of the adjacent dropdowns on the page.
2. **Given** the page is viewed on mobile screen widths, **When** a user scrolls through the species options form, **Then** the origin feat dropdown is fully visible and usable without horizontal overflow.
3. **Given** a keyboard or screen reader user selects a feat from the dropdown, **When** the feat summary appears below the dropdown, **Then** the summary text is automatically announced by assistive technology without requiring further navigation.

---

### User Story 3 - Skilled Feat Skill Selection (Priority: P2)

When a player selects the Skilled origin feat, they must choose 3 skills or tools to gain proficiency in. Those proficiencies must be reflected in the character's skill modifiers and proficiency tracking throughout the rest of the wizard and on the final character sheet.

**Why this priority**: Without this, selecting Skilled has no mechanical effect — the feat choice is recorded but the character gains nothing from it. This is the minimum needed for the fix to be functionally complete for Skilled.

**Independent Test**: Can be fully tested by selecting Human → Skilled → choosing 3 skills → completing the wizard → verifying those 3 skills are marked as proficient on the created character's sheet.

**Acceptance Scenarios**:

1. **Given** a user selects "Skilled" from the origin feat dropdown, **When** the feat summary appears below the dropdown, **Then** three individual dropdowns appear (each listing all available skills and tool proficiencies) prompting the user to choose one proficiency per dropdown.
2. **Given** the three Skilled dropdowns are visible, **When** a user selects the same proficiency in more than one of the three dropdowns, **Then** the duplicate selection is prevented and the conflicting dropdown does not allow confirming the same choice.
3. **Given** the skill selection control is visible, **When** a user leaves any of the three dropdowns at the unselected prompt and attempts to advance, **Then** advancement is blocked and a validation message indicates all three selections must be made.
3. **Given** a user selects exactly 3 skills/tools and completes the wizard, **When** the character is created, **Then** those 3 proficiencies are added to the character's proficiency set and their skill modifiers are calculated accordingly.
4. **Given** a user has chosen a Skillful skill and then selects Skilled as their origin feat, **When** the three Skilled proficiency dropdowns appear, **Then** the skill already chosen for Skillful is excluded from (or greyed out in) each of the three Skilled dropdowns so it cannot be selected twice.
5. **Given** a user selects Skilled and chooses 3 skills, **Then** switches the feat choice to a different feat, **When** the Skilled selection control disappears, **Then** the previously chosen skills are cleared and do not persist to the created character.

---

### User Story 4 - Skillful Trait Skill Selection (Priority: P2)

The Human species has a passive trait called **Skillful** that grants proficiency in one skill of the player's choice. Currently no selection control exists for this trait, meaning the proficiency is silently lost and never recorded on the character.

**Why this priority**: Without this, every Human character is created with a missing proficiency — a rules-incorrect outcome that affects skill modifier calculations on the character sheet.

**Independent Test**: Can be fully tested by selecting Human → choosing any skill for Skillful → completing the wizard → verifying that skill is marked proficient on the created character sheet with the correct modifier.

**Acceptance Scenarios**:

1. **Given** a user selects Human as their species, **When** the species options are shown, **Then** a "Skillful — Choose a Skill" dropdown appears listing all available skills, separate from and in addition to any origin feat controls.
2. **Given** the Skillful skill dropdown is visible, **When** a user selects a skill, **Then** that skill is recorded in the character state.
3. **Given** a Human is selected but no Skillful skill has been chosen, **When** the user attempts to advance past the Species step, **Then** advancement is blocked with a validation message prompting them to choose their Skillful proficiency.
4. **Given** a user selects a Skillful skill and completes the wizard, **When** the character is created, **Then** that skill appears as proficient with a correctly calculated modifier on the character sheet.

---

### Edge Cases

- What happens when the origin feats list returns empty from the server? — Show a user-friendly inline error or a disabled dropdown with a message; do not break the rest of the Species step.
- What happens when a species other than Human is selected (i.e. `offersFeatChoice` is false)? — The dropdown must not appear; existing behavior for all other species is unchanged.
- What happens when the user changes species away from Human after selecting an origin feat? — The previously chosen feat value is cleared from the character state so a stale feat is not submitted.
- What happens when a Human user tries to advance without choosing a feat? — Advancement is blocked with an inline validation message; the step does not proceed until a valid feat is selected from the dropdown.
- What happens when Skilled is selected but a user leaves one of the three dropdowns unselected and tries to advance? — Advancement is blocked with an inline validation message indicating all three selections are required.
- What happens if a tool proficiency chosen via Skilled overlaps with a tool proficiency from the character's background? — Must be handled gracefully without silent data loss; resolution behaviour is a planning-phase decision.
- What happens if a skill already granted by the character's background or class overlaps with a Skilled selection? — The overlap and resolution behaviour (e.g. double proficiency, or disallow duplicates) is a planning-phase decision; the spec requires the issue to be handled gracefully without silent data loss.
- What happens if the Skillful trait skill choice overlaps with the Skilled feat choices? — The Skillful-chosen skill is excluded from all three Skilled dropdowns so the same proficiency cannot be selected twice.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Species Selector MUST display a dropdown control (not a text input) for the "Origin Feat Choice" field whenever the selected species grants an origin feat of the player's choice.
- **FR-002**: The dropdown MUST be populated with all origin feats available in the application's feat catalogue.
- **FR-003**: Each dropdown option MUST display the feat name as its visible label only (no description text inside the option).
- **FR-004**: The dropdown MUST match the visual appearance and interactive behavior of the other option selectors on the Species Selection step.
- **FR-005**: Selecting a feat MUST update the feat choice field in the character state in the same way the existing text input did, so no downstream data submission logic requires changes.
- **FR-006**: Origin feat options MUST load asynchronously; the component MUST handle loading and error states without blocking the rest of the Species Selector from rendering.
- **FR-007**: If the selected species does not offer an origin feat choice, the dropdown MUST NOT be rendered (the existing conditional remains in place).
- **FR-008**: Selecting an origin feat MUST be required for species that offer a feat choice; the user MUST NOT be able to advance past the Species step until a valid feat is chosen (the "-- Choose an origin feat --" prompt option is not a valid selection).
- **FR-009**: When a feat is selected from the dropdown, a brief summary of that feat MUST be displayed immediately below the dropdown; the summary area MUST be hidden when no feat is selected.
- **FR-010**: The feat summary container MUST be marked as a live region so that assistive technology automatically announces the summary text when it updates after a selection change.
- **FR-011**: When the Skilled origin feat is selected, the system MUST present three individual dropdowns (each listing all available skills and tool proficiencies) for the user to select one proficiency each; these controls MUST only appear when Skilled is the active feat selection. Each dropdown MUST prevent the same proficiency from being chosen more than once across the three dropdowns. Any skill already chosen for the Skillful trait MUST be excluded from all three Skilled dropdowns.
- **FR-012**: The 3 skill or tool proficiencies chosen via the Skilled feat selection MUST be incorporated into the character's proficiency set at character creation so that skill modifier calculations and proficiency indicators on the character sheet reflect them correctly. Tool proficiencies MUST be stored separately from skill proficiencies in the character data.
- **FR-013**: When Human is selected, a dedicated dropdown MUST appear for the **Skillful** trait allowing the player to choose one skill proficiency from the full skill list; this control is independent of the origin feat dropdown.
- **FR-014**: The skill chosen for the Skillful trait MUST be required before the user can advance past the Species step, and MUST be included in the character's proficiency set at creation so skill modifier calculations reflect it correctly.

### Key Entities

- **OriginFeat**: A feat categorised as an origin feat in the feat catalogue. Key attributes: name (display label), summary (brief description), choices (optional sub-selections required after picking the feat). Currently 5 exist: Alert, Magic Initiate, Savage Attacker, Skilled, Tough.
- **FeatSubChoice**: An additional selection required by a specific feat after it is chosen (e.g. Skilled requires choosing 3 skills/tools). Stored alongside the feat choice in character state.
- **TraitSubChoice**: An additional selection required by a species trait (e.g. Skillful requires choosing 1 skill proficiency). Stored in character state as part of the species options.
- **SelectedFeatChoice**: The player's chosen origin feat recorded during character creation. Stored as the feat name. No structural data change — only the UI control type changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of users selecting Human on the Species step see a populated dropdown instead of a text input.
- **SC-002**: The dropdown lists all origin feats defined in the feat catalogue with no omissions (currently 5 feats).
- **SC-003**: The origin feat dropdown is visually indistinguishable in style from the other option dropdowns on the same Species step, and the feat summary beneath it is usable by keyboard and screen reader users without manual navigation.
- **SC-004**: Selecting an origin feat in the dropdown and completing the wizard results in the selected feat being correctly saved to the created character, with no data loss compared to the previous text-input path.
- **SC-005**: All species other than Human continue to work correctly with zero regressions introduced by this change.
- **SC-006**: When Skilled is selected and 3 skills/tools are chosen, the created character's sheet shows those skills as proficient with correctly calculated modifiers, and any chosen tool proficiencies are recorded in the character's tool proficiency list.
- **SC-007**: When Human is selected and a skill is chosen for the Skillful trait, the created character's sheet shows that skill as proficient with a correctly calculated modifier.

## Clarifications

### Session 2026-04-21

- Q: Is choosing an origin feat required before the user can advance to the next step, or can they leave it unselected? → A: Required — the "-- Choose an origin feat --" prompt is a non-submittable placeholder; the user cannot advance past the Species step without selecting a feat.
- Q: Should the dropdown show a description or summary of each feat alongside its name? → A: Name only in dropdown; when a feat is selected its summary is shown below the dropdown.
- Q: Should the feat summary area be announced to screen readers when it updates? → A: Yes — the summary container must be a live region so assistive technology announces the summary automatically on selection change.
- Q: Should the Skilled feat sub-selection include tool proficiencies alongside skills? → A: Yes — both all available skills and all tool proficiencies must be selectable; tool proficiencies are stored separately from skill proficiencies in the character data.
- Q: What interaction style should the Skilled 3-proficiency selection use? → A: Three individual dropdowns (each showing the full skills + tools list); duplicate selections across the three dropdowns are prevented.
- Q: Should the Skillful-chosen skill be excluded from the Skilled dropdowns to prevent duplicate proficiency? → A: Yes — the skill chosen for Skillful must be excluded from all three Skilled proficiency dropdowns.
- Q: Should the Skillful-chosen skill be excluded from the Skilled dropdowns to prevent duplicate proficiency? → A: Yes — the skill chosen for Skillful must be excluded from all three Skilled proficiency dropdowns.

## Assumptions

- The `offersFeatChoice` detection logic in `SpeciesSelector.tsx` (checking trait descriptions for "origin feat of your choice") correctly identifies Human as the only species currently requiring this dropdown. No changes to that detection logic are in scope.
- The **Skillful** trait is present in the Human species JSON as a trait with description "You gain proficiency in one skill of your choice." The presence of this trait on the selected species is the signal to display the Skillful skill-choice dropdown; no changes to the Human JSON file are required beyond confirming this description is stable.
- The available skill list for the Skillful and Skilled selections is the standard D&D 2024 skill list; the exact source (static constant vs. API) is a planning decision.
- Origin feat data will be sourced from the existing `feat-index.json` file — the exact delivery mechanism (new API endpoint vs. static import) is a planning decision.
- The character state field will continue to store the selected feat as a name string, consistent with the previous text input. No data model or API submission changes are required.
- Repeatable feats (Magic Initiate, Skilled) appear once in the dropdown; multi-selection or repeat-pick mechanics are out of scope for this fix.
