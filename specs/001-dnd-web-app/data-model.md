# Data Model: D&D Character and Campaign Management Web Application

**Date**: April 11, 2026  
**Status**: Design Phase  

## Core Entities

### User Account
**Purpose**: Represents a person who uses the application with flexible role assignments

**Fields**:
- `id`: Primary key (UUID)
- `email`: Unique identifier for authentication
- `username`: Display name (optional)
- `password_hash`: Secure password storage
- `security_question`: Optional password recovery
- `security_answer_hash`: Encrypted answer
- `is_admin`: Platform administration privileges
- `created_at`: Account creation timestamp
- `last_login`: Last authentication timestamp

**Relationships**:
- One-to-many with Characters (created characters)
- One-to-many with Campaigns (owned campaigns as DM)
- Many-to-many with Campaigns through CampaignMembership (participating campaigns)
- One-to-many with HomebrewContent (created content)

**Validation Rules**:
- Email must be valid format and unique
- Password must meet security requirements
- Username unique if provided

### Character
**Purpose**: Represents a player character with all D&D statistics and progression

**Fields**:
- `id`: Primary key (UUID)
- `name`: Character name
- `level`: Current level (1 to unlimited for epic levels)
- `experience_points`: Total XP earned
- `species`: Foreign key to Species
- `class_primary`: Foreign key to CharacterClass
- `background`: Foreign key to Background
- `ability_scores`: JSONField storing all six abilities
- `hit_points_current`: Current HP
- `hit_points_maximum`: Maximum HP
- `armor_class`: Calculated AC
- `proficiency_bonus`: Level-based bonus
- `skills`: JSONField storing skill proficiencies
- `equipment`: JSONField storing owned items
- `currency`: JSONField storing coin amounts
- `notes`: Text field for player notes
- `created_at`: Character creation timestamp
- `updated_at`: Last modification timestamp

**Relationships**:
- Many-to-one with User (owner)
- Many-to-one with Campaign (current campaign, nullable)
- One-to-many with CharacterFeature (class features, feats)
- One-to-many with CharacterSpell (known spells)

**Calculated Properties**:
- Ability modifiers (derived from ability scores)
- Skill bonuses (ability modifier + proficiency + other bonuses)
- Saving throw bonuses
- Attack bonuses
- Spell save DC

**Validation Rules**:
- Level must be positive integer
- Ability scores must be between 1-30
- Equipment must reference valid items
- Cannot be in multiple campaigns simultaneously

### Campaign
**Purpose**: Represents a D&D campaign with settings and player management

**Fields**:
- `id`: Primary key (UUID)
- `name`: Campaign name
- `description`: Campaign setting and notes
- `dm`: Foreign key to User (Dungeon Master)
- `is_active`: Campaign status
- `join_mode`: Enum (INVITATION_ONLY, APPROVAL_REQUIRED)
- `encumbrance_rules`: Enum (DISABLED, SIMPLE, VARIANT)
- `rule_validation`: Enum (STRICT, WARNINGS, PERMISSIVE)
- `settings`: JSONField for custom house rules
- `created_at`: Campaign creation timestamp
- `last_session`: Last gameplay session timestamp

**Relationships**:
- Many-to-one with User (DM owner)
- One-to-many with Character (participating characters)
- One-to-many with CampaignInvitation (pending invitations)
- One-to-many with InitiativeTracker (combat encounters)
- Many-to-many with HomebrewContent through CampaignHomebrew (enabled content)

**Validation Rules**:
- Name must be unique per DM
- DM cannot participate as player character in same campaign
- Join mode must be valid enum value

### Species
**Purpose**: Character ancestry options (Human, Elf, Dwarf, etc.) with traits

**Fields**:
- `id`: Primary key (UUID)
- `name`: Species name
- `description`: Lore and appearance
- `ability_score_bonuses`: JSONField storing attribute improvements
- `traits`: JSONField storing special abilities
- `languages`: JSONField storing known languages
- `proficiencies`: JSONField storing automatic proficiencies
- `is_official`: Boolean (true for D&D content, false for homebrew)
- `creator`: Foreign key to User (null for official content)

**Relationships**:
- One-to-many with Character (characters of this species)
- Many-to-one with User (homebrew creator)

**Validation Rules**:
- Official content cannot be modified by users
- Homebrew content can only be edited by creator or admin

### CharacterClass
**Purpose**: Character profession/archetype with level-based features

**Fields**:
- `id`: Primary key (UUID)
- `name`: Class name (Fighter, Wizard, etc.)
- `description`: Class concept and role
- `hit_die`: Die type for hit points (d6, d8, d10, d12)
- `primary_abilities`: JSONField storing key attributes
- `saving_throw_proficiencies`: JSONField storing proficient saves
- `skill_proficiencies`: JSONField storing available skills
- `equipment_proficiencies`: JSONField storing armor/weapon proficiencies
- `spellcasting`: JSONField storing spell progression (nullable)
- `features_by_level`: JSONField storing level-based features
- `is_official`: Boolean flag
- `creator`: Foreign key to User (homebrew creator)

**Relationships**:
- One-to-many with Character (characters of this class)
- Many-to-one with User (homebrew creator)

**Validation Rules**:
- Hit die must be valid die type
- Features by level must have entries for levels 1-20 minimum
- Spellcasting progression must be consistent

### Equipment
**Purpose**: Items that characters can own (weapons, armor, tools, magical items)

**Fields**:
- `id`: Primary key (UUID)
- `name`: Item name
- `description`: Item description and lore
- `item_type`: Enum (WEAPON, ARMOR, TOOL, CONSUMABLE, MAGICAL, MISC)
- `weight`: Weight in pounds (decimal)
- `cost`: Value in gold pieces
- `properties`: JSONField storing special properties
- `armor_class`: AC bonus (armor only)
- `damage`: Damage dice and type (weapons only)
- `magical_properties`: JSONField for magical effects
- `is_official`: Boolean flag
- `creator`: Foreign key to User (homebrew creator)

**Relationships**:
- Many-to-many with Character through character equipment JSON
- Many-to-one with User (homebrew creator)

**Validation Rules**:
- Weight must be non-negative
- Cost must be non-negative
- Damage must be valid dice notation for weapons

### HomebrewContent
**Purpose**: User-generated content with sharing permissions

**Fields**:
- `id`: Primary key (UUID)
- `name`: Content name
- `content_type`: Enum (SPECIES, CLASS, SPELL, EQUIPMENT, BACKGROUND)
- `data`: JSONField storing the actual content
- `creator`: Foreign key to User
- `sharing_level`: Enum (PRIVATE, SPECIFIC_USERS, SPECIFIC_CAMPAIGNS, PUBLIC)
- `version`: Version number for updates
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Relationships**:
- Many-to-one with User (creator)
- Many-to-many with User through HomebrewAccess (specific user sharing)
- Many-to-many with Campaign through CampaignHomebrew (campaign sharing)

**Validation Rules**:
- Only creator or admin can modify content
- Data must conform to content type schema
- Public content must pass moderation review

### InitiativeTracker
**Purpose**: Real-time combat management with turn order and spell effects

**Fields**:
- `id`: Primary key (UUID)
- `campaign`: Foreign key to Campaign
- `name`: Encounter name
- `round_number`: Current combat round
- `active_participant`: Foreign key to InitiativeParticipant (current turn)
- `is_active`: Combat status
- `created_at`: Encounter start time

**Relationships**:
- Many-to-one with Campaign
- One-to-many with InitiativeParticipant (combatants)
- One-to-many with SpellEffect (active effects)

### InitiativeParticipant
**Purpose**: Combatant in initiative order (characters, NPCs, monsters)

**Fields**:
- `id`: Primary key (UUID)
- `initiative_tracker`: Foreign key to InitiativeTracker
- `character`: Foreign key to Character (nullable)
- `npc_name`: NPC/monster name (for non-characters)
- `initiative_value`: Initiative roll result
- `hit_points`: Current HP in combat
- `is_visible`: Whether players can see this participant
- `display_name`: Name shown to players (for disguised enemies)
- `turn_order`: Sort order in initiative

**Relationships**:
- Many-to-one with InitiativeTracker
- Many-to-one with Character (nullable for NPCs)

### SpellEffect
**Purpose**: Timed magical effects tracked in combat

**Fields**:
- `id`: Primary key (UUID)
- `initiative_tracker`: Foreign key to InitiativeTracker
- `caster`: Foreign key to InitiativeParticipant
- `spell_name`: Name of the spell
- `duration_rounds`: Remaining duration
- `concentration`: Whether it requires concentration
- `description`: Effect description
- `is_visible`: Whether players can see the effect

**Relationships**:
- Many-to-one with InitiativeTracker
- Many-to-one with InitiativeParticipant (caster)

## Data Relationships

### User Role Management
- Users can own multiple campaigns (as DM)
- Users can participate in multiple campaigns (as player)
- Campaign membership tracks player status (active, invited, left)
- Character-campaign relationship is one-to-one (character can only be in one active campaign)

### Content Hierarchy
- Official D&D content (species, classes, equipment) loaded from JSON files
- Homebrew content extends same schemas with user attribution
- Sharing permissions control content visibility across campaigns and users
- Admin users can moderate and edit any content

### Combat Integration
- Initiative trackers link to campaigns
- Participants reference characters or NPCs
- Spell effects automatically decrement duration each round
- Real-time updates propagate to all campaign participants

## State Transitions

### Character Lifecycle
1. **Created** → Character created by user
2. **Campaign-Assigned** → Character joins a campaign
3. **Active** → Character participates in sessions
4. **Campaign-Left** → Character leaves campaign (user chooses what to retain)
5. **Retired** → Character no longer actively played

### Campaign Lifecycle  
1. **Created** → Campaign created by DM
2. **Recruiting** → DM invites players
3. **Active** → Regular session play
4. **Paused** → Temporary hiatus
5. **Concluded** → Campaign finished

### Combat Lifecycle
1. **Initiated** → DM starts initiative tracker
2. **Rolling** → Players submit initiative rolls
3. **Active** → Turn-based combat
4. **Paused** → Combat temporarily stopped
5. **Concluded** → Combat finished

## Performance Considerations

### Database Indexing
- User email, username for authentication
- Character name, level for searches
- Campaign name, DM for filtering
- Equipment name, type for inventory searches
- Initiative tracker campaign, active status

### Caching Strategy
- Official D&D content cached in Redis
- Character calculations cached until stats change
- Campaign membership cached for permission checks
- Homebrew content cached by sharing level

### Query Optimization
- Use select_related for foreign key relationships
- Prefetch related objects for character sheets
- Aggregate queries for campaign statistics
- Pagination for large content lists