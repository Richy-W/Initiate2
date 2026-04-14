# Feature Specification: D&D Character and Campaign Management Web Application

**Feature Branch**: `001-dnd-web-app`  
**Created**: April 11, 2026  
**Status**: Draft  
**Input**: User description: "I want to create a web application using the projects json files to for Dungeons and drangons players to create, manage, and play dungeons and dragons characters, and DM players to manage Campaigns that the players are in."

## Clarifications

### Session 2026-04-11

- Q: Which ability score generation method should the character creation process support? → A: All methods - standard array, point-buy system, and dice rolling with reroll 1s option
- Q: What user authentication method should the application support for account creation and login? → A: Email/password with email reset or security question options
- Q: How should the application handle equipment encumbrance and carrying capacity? → A: DM configurable at campaign level
- Q: How should players join campaigns with their characters? → A: DM choice between approval-required requests or invitation-only modes
- Q: How should character progression and changes be tracked when a character participates in multiple campaigns simultaneously? → A: Characters only in single campaigns; players can have multiple characters per campaign; player decides what to keep when leaving
- Q: Should the application include DM tools for combat management? → A: Yes - initiative tracker with NPC creation, monster integration, hidden creatures, and name disguising capabilities
- Q: How should initiative values be determined when creatures are added to the initiative tracker? → A: Prompt players for rolled initiative, they enter number, with option for automatic bonus calculation or manual total entry
- Q: Should character sheets automatically calculate ability modifiers and skill bonuses? → A: Yes - automatic calculation of all derived statistics from base character data
- Q: How should character hit points be calculated during leveling? → A: Players enter rolled hit die values, system automatically adds Constitution modifier
- Q: Should the character sheet provide skill roll assistance? → A: Yes - players click skills, enter d20 roll, system calculates total with skill bonus
- Q: Should attack rolls and saving throws have the same interactive roll assistance? → A: Yes - clickable attacks and saves with d20 entry and automatic bonus calculation
- Q: Should the initiative tracker manage timed spell effects? → A: Yes - track spell durations, concentration effects, and automatic expiration in initiative order
- Q: Should DMs be able to create and manage homebrew content? → A: Yes - custom species, classes, spells, items, and other content for their campaigns
- Q: Should the application support character levels beyond the standard 1-20 range? → A: Yes - allow epic levels beyond 20 for campaigns that want extended progression
- Q: How should the system handle rule validation when players attempt to create character builds that violate D&D rules? → A: Flexible validation - DMs can configure validation strictness per campaign
- Q: Can users switch between player and DM roles, and can characters be used as NPCs? → A: Yes - any user can create characters or campaigns, and DMs can convert characters into NPCs for their campaigns
- Q: How should homebrew content ownership and sharing be managed? → A: User-created content controlled by creator with granular sharing options - universal, campaign-specific, individual users, or private
- Q: Should there be administrative oversight for content management and moderation? → A: Yes - admin privileges to control content permissions, edit any content, and manage platform-wide content policies

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Character Creation and Basic Management (Priority: P1)

A player wants to create and manage their D&D character using the official rules and content available in the system. They need to build a character from scratch, view their character sheet, and make updates as their character progresses.

**Why this priority**: This is the core value proposition - character creation is the primary need for D&D players and provides immediate utility. Without this, the application has no purpose.

**Independent Test**: Can be fully tested by creating a new character, selecting species/class/background, assigning abilities, and viewing the complete character sheet. Delivers a functional digital character sheet that replaces pen-and-paper.

**Acceptance Scenarios**:

1. **Given** a new player visits the application, **When** they choose to create a character, **Then** they are guided through species, class, background, and ability score selection
2. **Given** a character creation session, **When** the player selects a species (e.g., Human), **Then** appropriate species traits and bonuses are automatically applied
3. **Given** a character creation session, **When** the player selects a class (e.g., Fighter), **Then** class features, hit points, and proficiencies are automatically calculated
4. **Given** a completed character, **When** the player views their character sheet, **Then** all relevant stats, abilities, equipment, and features are clearly displayed with automatically calculated ability modifiers, skill bonuses, saving throw bonuses, and other derived statistics
5. **Given** a character sheet, **When** the player clicks on a skill, **Then** they can enter their d20 roll and the system displays the total result including the skill bonus
6. **Given** a character sheet, **When** the player clicks on an attack or saving throw, **Then** they can enter their d20 roll and the system displays the total result including all applicable bonuses
7. **Given** an existing character, **When** the player levels up, **Then** they can add new features, enter their hit die roll, and the character sheet updates accordingly with automatically calculated hit point increases (including Constitution modifier)

---

### User Story 2 - Equipment and Inventory Management (Priority: P2)

Players need to manage their character's equipment, weapons, armor, and magical items as they acquire loot during adventures. This includes tracking encumbrance, managing currency, and viewing item details.

**Why this priority**: Equipment management is essential gameplay functionality that directly impacts character effectiveness and game balance. Required for most D&D sessions.

**Independent Test**: Can be tested by adding/removing items from inventory, equipping/unequipping gear, and viewing how it affects character stats and carrying capacity.

**Acceptance Scenarios**:

1. **Given** a character sheet, **When** the player adds a weapon to inventory, **Then** it appears in their equipment list with proper stats and properties
2. **Given** equipped armor, **When** the player views their character sheet, **Then** their Armor Class reflects the armor bonus
3. **Given** a character with inventory items, **When** total weight exceeds carrying capacity, **Then** the system indicates encumbrance status
4. **Given** a magical item, **When** the player views item details, **Then** magical properties and usage rules are clearly displayed

---

### User Story 3 - Campaign Participation (Priority: P3)

Players want to join campaigns run by Dungeon Masters, track campaign-specific character progress, and coordinate with other players in their group.

**Why this priority**: Enables social gameplay and organized sessions, but characters can exist independently of campaigns for one-shots or personal use.

**Independent Test**: Can be tested by creating a campaign, adding characters to it, and tracking session-specific changes and progress.

**Acceptance Scenarios**:

1. **Given** an active campaign, **When** a player requests to join with their character, **Then** the DM can approve the request and the character appears in the campaign roster
2. **Given** a character in a campaign, **When** the character gains experience or loot during a session, **Then** changes are tracked separately from other campaigns
3. **Given** a campaign session, **When** the DM makes campaign-wide announcements or updates, **Then** all players in the campaign receive the information

---

### User Story 4 - Campaign Creation and Management (Priority: P2)

Dungeon Masters need to create campaigns, invite players, track party information, manage NPCs, and coordinate session logistics.

**Why this priority**: Essential for DMs to organize and run games effectively. Slightly lower priority than basic character management since fewer users are DMs.

**Independent Test**: Can be tested by creating a campaign, setting up basic details, inviting players, and managing campaign information.

**Acceptance Scenarios**:

1. **Given** a user with DM privileges, **When** they create a new campaign, **Then** they can set campaign name, description, setting, and house rules
2. **Given** any user in the application, **When** they choose to create a campaign, **Then** they become the DM for that campaign with full campaign management privileges
3. **Given** an active campaign, **When** the DM invites players, **Then** invited players receive notifications and can join with approved characters
4. **Given** a DM with access to characters, **When** they want to add an NPC to their campaign, **Then** they can convert existing characters into NPCs with full stat integration into campaign and initiative systems
5. **Given** a campaign with multiple players, **When** the DM views the party overview, **Then** all player characters, their stats, and statuses are visible
4. **Given** a campaign session, **When** the DM updates party status or records session notes, **Then** information is saved and accessible to appropriate players
5. **Given** a campaign with configurable rule validation, **When** a player creates a character that violates standard D&D rules, **Then** the system responds according to the DM's validation settings (strict prevention, warnings with explanations, or permissive allowance)

---

### User Story 5 - DM Combat Management and Initiative Tracking (Priority: P2)

Dungeon Masters need tools to manage combat encounters, including initiative tracking, NPC creation, and the ability to control what information players can see during battles.

**Why this priority**: Combat management is a core DM responsibility and significantly improves game flow during sessions. Essential for most D&D gameplay but can be managed with external tools if needed.

**Independent Test**: Can be tested by creating NPCs, adding player characters and monsters to initiative order, managing turn progression, and verifying player visibility controls work properly.

**Acceptance Scenarios**:

1. **Given** an active campaign session, **When** the DM starts a combat encounter, **Then** they can create an initiative tracker and all players are prompted to roll and enter their initiative
2. **Given** an initiative tracker, **When** players enter their initiative roll, **Then** they can choose to either have the system automatically add their applicable bonuses (dexterity modifier plus class-specific bonuses) or manually enter their total initiative value
3. **Given** an initiative tracker, **When** the DM creates or adds NPCs/monsters, **Then** they can set initiative, stats, and visibility settings for each creature
4. **Given** creatures in initiative, **When** the DM chooses to hide a creature, **Then** it appears in DM view but is invisible to players
5. **Given** a visible creature, **When** the DM changes its display name, **Then** players see the modified name while DM sees both original and display names
6. **Given** an active initiative tracker, **When** the DM advances turns, **Then** current turn is highlighted and visible to appropriate players
7. **Given** a character casts a spell with duration during combat, **When** the spell is activated, **Then** it appears in the initiative tracker with duration countdown and automatically expires when the duration ends

---

### User Story 6 - DM Homebrew Content Management (Priority: P3)

Dungeon Masters want to create and manage custom content (homebrew) for their campaigns, including custom species, classes, spells, items, and other game elements that extend beyond official D&D content.

**Why this priority**: Enables campaign customization and creative freedom for DMs, but not essential for core functionality. Players can enjoy full D&D experience with official content alone.

**Independent Test**: Can be tested by creating custom homebrew items, making them available to specific campaigns, and verifying players can use homebrew content in character creation and gameplay.

**Acceptance Scenarios**:

1. **Given** a DM managing a campaign, **When** they create custom homebrew content (species, class, spell, item), **Then** they can define its properties, rules, and which campaigns have access to it
2. **Given** a campaign with homebrew content enabled, **When** players create or edit characters, **Then** they can access and use the custom content alongside official content
3. **Given** homebrew content in a campaign, **When** it's used in character sheets or initiative trackers, **Then** the system applies the custom rules and calculations properly
4. **Given** a user who created homebrew content, **When** they want to control access, **Then** they can set sharing permissions to private, specific users, specific campaigns, or universal public access
5. **Given** a DM with homebrew content, **When** they want to share it with other DMs, **Then** they can export/import homebrew content between campaigns

---

### Edge Cases

- What happens when a player tries to create a character with invalid ability score combinations?
- How does the system handle custom homebrew content that isn't in the official data files?
- What happens to characters using homebrew content if the homebrew is deleted or modified?
- How are sharing permissions enforced when homebrew content creator changes access levels?
- What happens to campaigns using shared homebrew content if the creator revokes access?
- How are admin actions on content moderation logged and reviewed?
- What happens when admin-edited content differs from the original creator's intent?
- What occurs if a player disconnects during character creation or campaign session?
- How are conflicts resolved when multiple players try to edit campaign information simultaneously?
- What happens when a character's level or equipment changes affect calculated stats?
- How does the system handle characters that exceed standard level limits?
- How are levels beyond 20 handled when official class features end at level 20?
- What happens to proficiency bonuses and ability score improvements at epic levels?
- What occurs if the DM disconnects during an active initiative tracker session?
- How are initiative ties resolved when multiple creatures have the same initiative?
- What happens if a player's character dies or leaves combat mid-encounter?
- How are concentration spells handled when a character takes damage or casts another concentration spell?
- What happens to active spell effects if combat ends before they expire naturally?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create player accounts with email/password authentication and provide password recovery via either email reset or security questions
- **FR-002**: System MUST support character creation using official D&D 2024 rules from the provided JSON data with multiple ability score generation methods: standard array (15,14,13,12,10,8), point-buy system (27 points), and dice rolling (4d6 drop lowest with option to reroll 1s)
- **FR-003**: System MUST automatically calculate character statistics (AC, HP, saving throws, ability modifiers, skill bonuses, attack bonuses, etc.) based on species, class, background, ability scores, and equipment selections
- **FR-004**: System MUST provide a comprehensive character sheet display showing all relevant character information
- **FR-005**: System MUST allow players to manage character inventory, equipment, and magical items with encumbrance rules configurable by DMs at the campaign level (simple, variant, or disabled)
- **FR-006**: System MUST support character progression and leveling with automatic feature unlocks and hit point calculation (players enter hit die roll, system adds Constitution modifier with minimum 1 HP gain per level) for all character levels including epic levels beyond 20
- **FR-007**: System MUST enable any user to create and manage campaigns, automatically granting DM privileges for campaigns they create
- **FR-008**: System MUST allow DMs to manage campaign membership through either player join requests requiring approval or invitation-only access, with appropriate notification systems
- **FR-009**: System MUST track character progress within single campaign participation (characters can only be in one campaign at a time) and allow players to choose what character data to retain when leaving campaigns
- **FR-010**: System MUST provide search and filtering capabilities for spells, equipment, and features
- **FR-011**: System MUST validate character builds against official D&D rules and limitations while supporting epic levels beyond 20 with appropriate scaling for proficiency bonuses and other mechanics, with DM-configurable validation strictness per campaign (strict enforcement, warnings only, or permissive for house rules)
- **FR-012**: System MUST persist all character and campaign data reliably
- **FR-013**: System MUST support real-time updates when multiple users interact with the same campaign
- **FR-014**: System MUST provide detailed views of spells, feats, equipment, and magical items from the JSON data
- **FR-015**: System MUST handle user permissions appropriately (players can only edit their characters, DMs can manage their campaigns, admins can moderate content and manage platform-wide settings)
- **FR-016**: System MUST allow players to have multiple characters within a single campaign while restricting each character to one active campaign at a time
- **FR-017**: System MUST allow DMs to convert existing characters (their own or with permission) into NPCs for use in campaigns and combat encounters
- **FR-018**: System MUST provide DMs with initiative tracking tools that prompt players to enter initiative rolls with the option to either automatically calculate bonuses (dexterity modifier plus class-specific bonuses) or manually enter their total initiative value
- **FR-019**: System MUST allow DMs to create custom NPCs with configurable stats, names, and abilities for use in campaigns and combat
- **FR-019**: System MUST enable DMs to add monsters from the JSON data to initiative trackers with appropriate stat blocks
- **FR-020**: System MUST allow DMs to control creature visibility in initiative order (hidden from players vs visible)
- **FR-021**: System MUST enable DMs to modify creature display names in initiative while preserving original names for DM reference
- **FR-022**: System MUST support real-time initiative tracking with turn progression visible to campaign participants based on DM permissions
- **FR-023**: System MUST provide interactive skill rolls on character sheets where players can click skills, enter d20 roll values, and receive calculated totals including all applicable bonuses
- **FR-024**: System MUST provide interactive attack rolls and saving throws on character sheets where players can click attacks/saves, enter d20 roll values, and receive calculated totals including all applicable bonuses (ability modifiers, proficiency, weapon bonuses, etc.)
- **FR-025**: System MUST track active spell effects with durations in the initiative tracker, including concentration spells, automatically decrementing durations each round and removing expired effects
- **FR-026**: System MUST allow players and DMs to add timed effects (spells, conditions, buffs) to the initiative tracker with specified durations and automatic expiration
- **FR-027**: System MUST enable DMs to create, edit, and manage homebrew content (species, classes, subclasses, spells, equipment, feats) with the same functionality as official content
- **FR-028**: System MUST allow DMs to control which campaigns have access to specific homebrew content, keeping custom content campaign-specific or shareable
- **FR-029**: System MUST provide granular sharing permissions for user-created content with options for private, specific users, specific campaigns, or universal public access
- **FR-030**: System MUST integrate homebrew content seamlessly with character creation, character sheets, and combat systems using the same rule validation and calculation engines
- **FR-031**: System MUST provide homebrew content versioning and dependency management to handle updates and deletions gracefully while respecting creator ownership and sharing permissions
- **FR-032**: System MUST provide admin privileges for content moderation including the ability to edit, approve, restrict, or remove any user-generated content for policy compliance
- **FR-033**: System MUST allow admins to override content sharing permissions when necessary for moderation purposes while maintaining audit logs of administrative actions

### Key Entities *(include if feature involves data)*

- **Character**: Represents a player character with species, class, background, ability scores, level, equipment, and calculated statistics
- **Campaign**: Represents a D&D campaign with DM, participating characters, session notes, and campaign-specific settings
- **User Account**: Represents a person who can create characters and join campaigns, with role-based permissions (users can be both players and DMs for different campaigns, with optional admin privileges for content moderation)
- **Species**: Character ancestry options (Human, Elf, Dwarf, etc.) with associated traits and bonuses
- **Class**: Character profession/archetype (Fighter, Wizard, etc.) with features that unlock by level
- **Equipment**: Items that characters can own, including weapons, armor, tools, and magical items
- **Spell**: Magical abilities available to spellcasting characters with detailed descriptions and mechanics
- **Background**: Character history that provides skills, equipment, and roleplaying guidance
- **Initiative Tracker**: Real-time combat management tool showing turn order, participant stats, and DM-controlled visibility
- **NPC**: Custom non-player characters created by DMs with configurable stats, abilities, and campaign-specific information
- **Spell Effect**: Timed magical effects tracked in initiative with duration countdown, concentration status, and automatic expiration
- **Homebrew Content**: Custom game elements (species, classes, spells, items) created by users with granular sharing permissions (private, specific users, campaigns, or universal) and full integration with official content
- **Admin Account**: Special user privileges for platform moderation, content oversight, and system administration with the ability to edit any content and manage sharing permissions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete character creation from start to finish in under 15 minutes for their first character
- **SC-002**: System accurately calculates and displays character statistics with 100% rule compliance for core mechanics
- **SC-003**: 90% of users can successfully navigate between character sheet sections without assistance
- **SC-004**: Character data loads and displays within 2 seconds for standard character sheets
- **SC-005**: DMs can set up a new campaign and invite 4-6 players within 10 minutes
- **SC-006**: System supports concurrent access by campaign groups of up to 8 users without performance degradation
- **SC-007**: 95% of equipment/spell/feature searches return relevant results within 1 second
- **SC-008**: Character sheet updates reflect changes immediately across all connected campaign participants
- **SC-009**: Data persistence ensures no character or campaign information is lost during normal operations
- **SC-010**: DMs can create NPCs and set up initiative trackers with 4-6 participants within 3 minutes
- **SC-011**: Initiative tracker updates (turn advancement, creature visibility) reflect in real-time for all campaign participants
- **SC-012**: DMs can create basic homebrew content (custom species, spell, or item) and make it available to their campaign within 5 minutes
- **SC-013**: Characters using homebrew content display and calculate statistics correctly with the same accuracy as official content

## Assumptions

- Users have basic familiarity with D&D rules and terminology
- The provided JSON files contain complete and accurate D&D 2024 ruleset data
- Users will primarily access the application via web browsers on desktop/tablet devices
- Internet connectivity is available for real-time campaign features (offline character management not required for MVP)
- Standard web authentication patterns (email/password) are acceptable for user accounts
- Campaign groups will typically consist of 3-6 players plus 1 DM
- Character levels can extend beyond the standard 1-20 range for epic level campaigns
- The application will focus on official published content rather than homebrew rules for initial release
- DMs will primarily create homebrew content that extends rather than replaces core D&D mechanics
- Homebrew content will follow similar structure and patterns to official content for consistency
- Epic level progression (beyond 20) will use logical extensions of existing mechanics (continued proficiency bonus scaling, hit point growth, etc.)
