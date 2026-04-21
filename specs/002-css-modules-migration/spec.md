# Feature Specification: CSS Module Migration

**Feature Branch**: `002-css-modules-migration`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "I want to tackle the CSS Module Migration to be compliant with the constitution."

## Background

The project constitution mandates CSS Modules (`.module.css`) for all component-level styles, with global design tokens in `index.css` and shared layout patterns in `styles/pages.css`. Story 001 was implemented using plain global CSS files, which is explicitly flagged as technical debt that must be resolved before story 001 is considered complete. This feature covers that migration.

**Files to migrate** (14 component-level CSS files across 3 categories):

| Category | File | Consuming Component(s) |
| -------- | ---- | ---------------------- |
| Character | `styles/CharacterSheet.css` | `components/Character/CharacterSheet.tsx` |
| Character | `components/Character/EncumbranceStatus.css` | `components/Character/EncumbranceStatus.tsx` |
| Character | `components/Character/Inventory.css` | `components/Character/Inventory.tsx` |
| Character | `styles/OfficialIdentityHeader.css` | `components/Character/OfficialIdentityHeader.tsx` |
| Equipment | `components/Equipment/EquipmentBrowser.css` | `components/Equipment/EquipmentBrowser.tsx` |
| Equipment | `components/Equipment/EquippedItems.css` | `components/Equipment/EquippedItems.tsx` |
| Equipment | `components/Equipment/ItemDetail.css` | `components/Equipment/ItemDetail.tsx` |
| Equipment | `components/Equipment/MagicalProperties.css` | `components/Equipment/MagicalProperties.tsx` |
| Pages & layout | `styles/CharacterCreation.css` | `components/CharacterCreation/CharacterWizard.tsx` |
| Pages & layout | `styles/CharacterEditor.css` | `components/CharacterEditing/CharacterEditor.tsx` |
| Pages & layout | `styles/CharacterList.css` | `pages/CharacterList.tsx` |
| Pages & layout | `styles/Layout.css` | `components/Layout.tsx` |
| Pages & layout | `styles/LoginPage.css` | `pages/auth/LoginPage.tsx`, `pages/auth/RegisterPage.tsx` |
| Pages & layout | `pages/HelpPage.css` | `pages/HelpPage.tsx` |

**Files that stay global (must NOT be converted):**

- `index.css` — design tokens and global CSS custom properties
- `styles/pages.css` — shared layout patterns (page structure, hero, tabs, cards); consumed by 8+ pages/components
- `App.css` — global resets, dark-theme base, and the `@media print` block that applies the character sheet print layout across multiple pages

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Character view renders correctly after migration (Priority: P1)

A developer viewing the character sheet, encumbrance status, and inventory panels sees the same visual output before and after migration. All existing class names and styles are preserved; no visual regression occurs on the character-facing features that users interact with.

**Why this priority**: CharacterSheet, EncumbranceStatus, and Inventory are the three files explicitly named in the constitution as tech-debt. They are the primary user-facing components and carry the highest regression risk.

**Independent Test**: Can be fully tested by loading a character in the app, inspecting its rendered layout, and confirming it matches the pre-migration baseline across all three column areas of the sheet.

**Acceptance Scenarios**:

1. **Given** the app is running with all character CSS migrated to modules, **When** a user navigates to the character sheet page, **Then** all layout sections (ability scores, combat stats, skills, equipment, class features, species traits, feats) render with correct styling, spacing, and colours.
2. **Given** the character sheet is displayed, **When** the user triggers the print/save-as-PDF action, **Then** the printed output is visually identical to the pre-migration baseline (three-column A4 layout).
3. **Given** a character with heavy encumbrance, **When** the component renders, **Then** the encumbrance status indicator displays with the correct visual state (colour, icon, text).
4. **Given** a character with inventory items, **When** the inventory panel renders, **Then** all item rows are correctly styled with no layout breakage.

---

### User Story 2 - Equipment browser and item details render correctly after migration (Priority: P2)

A developer using the equipment browser, equipped items list, item detail panel, and magical properties section sees no visual difference after migration. All interaction states (hover, selected, etc.) continue to apply correctly.

**Why this priority**: Equipment components are self-contained and can be migrated independently as a batch without risk to the character sheet.

**Independent Test**: Can be fully tested by opening the equipment browser from a character sheet and interacting with item selection and detail views.

**Acceptance Scenarios**:

1. **Given** the equipment CSS modules are in place, **When** a user opens the equipment browser, **Then** the list, search, and filter controls render with the correct layout and spacing.
2. **Given** an item is selected in the browser, **When** the item detail panel renders, **Then** the detail layout, magical-properties section, and any equipped-item indicators are correctly styled.
3. **Given** an item is equipped, **When** the EquippedItems component renders, **Then** equipped item rows display with the correct styling and no overlap with the module from EquipmentBrowser.

---

### User Story 3 - Pages and layout components render correctly after migration (Priority: P3)

All page-level components (CharacterList, CharacterCreation wizard, CharacterEditor, Layout shell, Login/Register pages, and HelpPage) render identically after their plain CSS files are replaced with CSS Modules.

**Why this priority**: These components are higher-level wrappers; breakage here affects navigation and onboarding but the visual investment is lower than the core character sheet.

**Independent Test**: Can be tested by navigating the full user journey: register → log in → view character list → create character → view dashboard → visit help page.

**Acceptance Scenarios**:

1. **Given** Layout.css is migrated, **When** a user navigates any page, **Then** the navigation bar, sidebar, and main content area are correctly styled.
2. **Given** LoginPage.css is migrated to a module used by both LoginPage and RegisterPage, **When** either page is loaded, **Then** both pages render with the correct form layout, branding, and button styles.
3. **Given** CharacterList.css is migrated, **When** a user views their character list, **Then** character cards display with correct grid layout, images, and status indicators.
4. **Given** CharacterCreation.css is migrated, **When** a user progresses through the character wizard, **Then** all wizard steps render with correct step-indicator, form, and review layouts.
5. **Given** CharacterEditor.css is migrated, **When** a user edits an existing character, **Then** the editor form renders with correct field layout and validation styling.
6. **Given** HelpPage.css is migrated, **When** a user visits the help page, **Then** all content sections are correctly styled.

---

### Edge Cases

- `LoginPage.css` is imported by both `LoginPage.tsx` and `RegisterPage.tsx`. After migration, both files must import the same module file without style duplication or conflicts.
- `CharacterSheet.css` contains the `.official-sheet`, `.sheet-main`, `.left-column`, `.center-column`, `.right-column` class names that are also referenced by the `@media print` block in `App.css`. The CSS Module class names will be hashed at runtime; the print media query in `App.css` uses the `.character-sheet-layout` wrapper class (not a module class) so the print block must be verified to still apply correctly.
- Any CSS class that was applied via a plain string (e.g. `className="some-class"`) must be updated to reference the imported module object (e.g. `className={styles.someClass}`). Any class name using kebab-case must map to camelCase or bracket-notation access in the JSX without breaking the style.
- The `styles/pages.css` shared layout classes are used across 8+ components and must NOT be converted. Components that use both `pages.css` classes and component-specific classes will need to combine module style references with the global `pages.css` class strings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each of the 14 component-level CSS files listed in the Background table MUST be converted to a co-located `.module.css` file placed next to its consuming component.
- **FR-002**: Each consuming component MUST be updated to import its styles as a module object and reference all CSS classes through that object.
- **FR-003**: The original plain `.css` files MUST be deleted after their consuming components are updated to ensure no dead file remains.
- **FR-004**: `index.css`, `styles/pages.css`, and `App.css` MUST remain as plain global CSS files and MUST NOT be converted to modules.
- **FR-005**: All existing visual styles MUST be preserved exactly; no rules may be removed, modified, or reordered during migration unless a rule is verified to be unused.
- **FR-006**: CSS class names in the migrated modules MUST remain semantically identical to the originals (only the import and reference syntax changes in the TSX files).
- **FR-007**: Components that mix global `pages.css` class names with component-specific module classes MUST use both correctly (global string + module reference) without losing either style.
- **FR-008**: After migration the character sheet print layout MUST continue to produce the correct A4 portrait output with the `.character-sheet-layout` wrapper class intact.
- **FR-009**: The `LoginPage.module.css` file MUST be importable by both `LoginPage.tsx` and `RegisterPage.tsx` without duplication of the CSS file.

## Assumptions

- Migration is a refactor: zero net visual change is the goal. No new styles will be added as part of this work.
- Create React App (CRA) is the build tool, which has built-in CSS Module support for files ending in `.module.css`; no build configuration changes are required.
- `styles/pages.css` is treated as a shared layout file and excluded from the migration scope because it is explicitly described by the constitution as an intended global file.
- `App.css` contains the `@media print` block that controls character sheet printing and also includes global dark-theme base styles; it is treated as global and excluded from migration scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 14 identified plain component CSS files are deleted; 14 `.module.css` files exist in their place (co-located with their components).
- **SC-002**: Zero plain `.css` import statements remain in any component or page file other than the permitted globals (`App.css`, `index.css`, `pages.css`).
- **SC-003**: The application compiles with no TypeScript or webpack errors after migration.
- **SC-004**: All existing pages and components render visually identically to the pre-migration baseline (verified by manual review of each affected component in a running browser).
- **SC-005**: The character sheet print layout produces an A4 portrait output matching the pre-migration printed format.
- **SC-006**: No unused CSS files remain in the repository after migration.
