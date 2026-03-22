# D&D 2024 API Development Instructions

## Overview
This project is a comprehensive JSON API for Dungeons & Dragons 2024 Edition, providing structured data for all core game components including monsters, classes, backgrounds, species, equipment, feats, and spells.

## Project Structure

### Core Components
Each major game component follows a consistent three-file pattern:
- `{component}-schema.json` - Defines the JSON structure and validation rules
- `{component}-index.json` - Contains categorized listings and quick reference data
- `{component}/` directory - Individual JSON files for each item (flat structure, no letter-based subdirectories)

**Important**: All component directories use a **flat structure** for consistency. Do NOT create letter-based subdirectories (a/, b/, c/, etc.) or letter-specific index files. All individual items go directly in the component folder.

### Component Types
1. **Monsters** (`monsters/`, `monster-schema.json`, `monster-index.json`)
2. **Classes** (`classes/`, `class-schema.json`, `class-index.json`)
3. **Backgrounds** (`backgrounds/`, `background-schema.json`, `background-index.json`)
4. **Species** (`species/`, `species-schema.json`, `species-index.json`)
5. **Equipment** (`equipment/`, `equipment-schema.json`, `equipment-index.json`)
6. **Feats** (`feats/`, `feat-schema.json`, `feat-index.json`)
7. **Magic Items** (`magic-items/`, `magic-item-schema.json`, `magic-item-index.json`)
8. **Spells** (`spells/` directory)

## Character Creation Workflow

### Complete Character Creation Process
Using the D&D 2024 API, create a complete playable character by following these five core steps and then completing mechanical details.

### Overview: Five Steps to a Character
1. **Choose a Class** - Define adventuring profession and capabilities
2. **Determine Origin** - Select background and species (ancestral roots)
3. **Determine Ability Scores** - Allocate six core stats for a 3-point spread
4. **Choose Alignment** - Select moral and ethical framework (optional but recommended)
5. **Describe Your Character** - Add personality, appearance, and backstory details

### Preparation Before Character Creation
Before starting the creation process:

1. **Talk with Your DM**
   - Discuss campaign type and setting
   - Identify adventurer concepts that fit the game
   - Ask about party composition and needs
   - Reference: [character-creation.json](character-creation.json) - Preparation section

2. **Attend Session Zero** (if applicable)
   - Collaborative session to create all party members together
   - Aligns character concepts with campaign themes
   - Ensures party works well together
   - Allows all players to coordinate builds

3. **Choose Character Sheet Format**
   - Physical printed sheet
   - Digital form or calculator
   - Custom tracker using [character-sheet.json](character-sheet.json) structure
   - Use whatever format works best for your play style

### Step 1: Choose a Class

**Reference Files**: `classes/`, [class-index.json](class-index.json), [class-schema.json](class-schema.json)

Every adventurer belongs to a class that defines their primary vocation and special talents.

**Available Classes (12 total)**:
- **Barbarian** (d12 HP) - Fierce rage and incredible durability
- **Bard** (d8 HP) - Versatile performer, full spellcaster
- **Cleric** (d8 HP) - Divine magic, support and healing
- **Druid** (d8 HP) - Nature magic, shapeshift, full spellcaster
- **Fighter** (d10 HP) - Master weapons, tactical combatant
- **Monk** (d8 HP) - Martial artist, ki energy abilities
- **Paladin** (d10 HP) - Holy warrior, melee + divine magic
- **Ranger** (d10 HP) - Hunter, tracker, half spellcaster
- **Rogue** (d8 HP) - Precision strikes, infiltration specialist
- **Sorcerer** (d6 HP) - Innate magic user, metamagic
- **Warlock** (d8 HP) - Pact magic, invocations, otherworldly patron
- **Wizard** (d6 HP) - Arcane knowledge, largest spell selection

**How to Choose**:
- Consider your fantasy role: tank, damage dealer, support, utility
- Think about playstyle: combat-focused, spellcasting, skills
- Consider party composition: what does the party need?
- Pick what excites you most about D&D

**Class Information Includes**:
- Hit die (d6, d8, d10, d12) - affects HP gained per level
- Proficiencies (weapons, armor, skills, saving throws)
- Starting equipment options
- Class features by level (1-20 progression)
- Spellcasting ability and spell slots (if applicable)
- Subclass options (specializations within the class)

### Step 2: Determine Origin (Background + Species)

**Reference Files**: `backgrounds/`, `species/`, [origin-builder-rules.json](origin-builder-rules.json), [origin-schema.json](origin-schema.json)

Your character's origin consists of two components that work together:

#### 2A: Choose a Background
**Reference**: `backgrounds/`, [background-index.json](background-index.json), [background-schema.json](background-schema.json)

Your background represents your life before becoming an adventurer.

**Background Components**:
- **Three Ability Scores** - Choose which three to increase:
  - Focused method: +2 to one, +1 to another, +0 to third
  - Balanced method: +1 to all three
- **Origin Feat** - One feat specific to your background (required, not optional)
- **Skill Proficiencies** - Two skills you're trained in
- **Tool Proficiency** - One tool category you know how to use
- **Language Proficiency** - One additional language (sometimes a choice)
- **Starting Equipment** - Choose equipment package (A) or gold amount (B)

**Current Backgrounds (4)**:
- **Acolyte** - Religious service, divine studies
- **Criminal** - Life of crime, street survival
- **Sage** - Academic knowledge, scholarly pursuits
- **Soldier** - Military training, combat experience

**Ability Score Selection Rules**:
- You must choose from the three ability scores listed in your background
- You cannot increase an ability score above 20 during character creation
- Apply background increases after species increases

#### 2B: Choose a Species
**Reference**: `species/`, [species-index.json](species-index.json), [species-schema.json](species-schema.json)

Your species (also called race) represents your ancestral heritage and determines innate traits.

**Available Species (9)**:
- **Dragonborn** - Dragon ancestry, breath weapon (10 variants by dragon type)
- **Dwarf** - Mountain dwellers, tough and sturdy
- **Elf** - Long-lived, graceful beings (3 variants: Drow, High Elf, Wood Elf)
- **Gnome** - Clever small folk (2 variants: Forest, Rock)
- **Goliath** - Giant-descended, imposing presence (6 variants by giant type)
- **Halfling** - Small, lucky, brave
- **Human** - Versatile, adaptable, ambitious
- **Orc** - Powerful, primal warriors
- **Tiefling** - Infernal heritage, otherworldly appearance (3 variants by legacy type)

**Species Information Includes**:
- Creature type (all are Humanoid)
- Size (Small or Medium, varies by species)
- Speed (movement in feet per round)
- Lifespan (how long they typically live)
- Traits (special abilities like Darkvision, Resistance)
- Variants/Lineages (options within the species)
- Languages (including bonus languages available)
- Proficiencies (if any)

**Species Traits Examples**:
- Darkvision (can see in darkness)
- Resistance (to damage types)
- Extra skill proficiencies
- Innate spellcasting options
- Bonus proficiencies

### Step 3: Determine Ability Scores

**Reference**: [rules/abilities.json](rules/abilities.json)

Ability scores represent six core dimensions of your character's capabilities:

**The Six Abilities**:
1. **Strength** - Physical power, athletics
2. **Dexterity** - Agility, balance, reflexes
3. **Constitution** - Health, stamina, endurance
4. **Intelligence** - Reasoning, memory, analysis
5. **Wisdom** - Awareness, insight, intuition
6. **Charisma** - Force of personality, leadership

**Standard Ability Score Assignment**:
1. Start with base scores (depends on method chosen: array, roll, or purchase)
2. Add background ability increases (as selected in Step 2A)
3. Add species ability increases (if your species grants any)
4. Maximum score is 20 during character creation (before magic items)
5. Calculate ability modifiers: (score - 10) ÷ 2

**Ability Modifiers Matter For**:
- Skill checks
- Saving throws
- Attack rolls (for melee/ranged)
- Spell attack rolls
- Spell save DCs
- Initiative rolls

### Step 4: Choose Alignment

**Reference**: Rules for alignment system

Alignment is a two-axis system representing moral and ethical outlook (optional but recommended):

**Moral Axis**: Good / Neutral / Evil
**Ethical Axis**: Lawful / Neutral / Chaotic

**Examples**:
- Lawful Good - Crusader, righteous warrior
- Neutral Good - Robin Hood, independent helper
- Chaotic Good - Rebel, freedom fighter
- Lawful Neutral - Judge, neutral arbiter
- True Neutral - Wanderer, unconcerned
- Chaotic Neutral - Wanderer, selfish
- Lawful Evil - Tyrant, strict villain
- Neutral Evil - Mercenary, self-serving
- Chaotic Evil - Destroyer, cruel killer

**Alignment Guidance**:
- Choose what excites you about the character's personality
- Discuss with your DM if alignment restrictions apply
- Remember: alignment should inform roleplay, not restrict it
- Alignment can evolve based on character experiences

### Step 5: Describe Your Character

**Reference**: [character-sheet.json](character-sheet.json) - Page 2 sections

Add personality and appearance to bring your character to life:

**Appearance**:
- Physical description (height, build, distinctive features)
- Clothing and personal style
- Distinguishing marks (scars, tattoos, etc.)
- Overall presentation and demeanor

**Personality & Backstory**:
- Character personality traits (2-3 core traits)
- Character ideals (what they believe in)
- Character bonds (relationships and connections)
- Character flaws (weaknesses and vulnerabilities)
- Background story (what led them to adventuring?)

**Party & Campaign Integration**:
- How does this character know other party members?
- Why are they adventuring with this specific group?
- How do they fit into the campaign setting?
- What are their goals and motivations?

### Mechanical Completion Checklist

After the five core steps, complete these mechanical calculations:

**Statistics**:
- [ ] All ability scores assigned with modifiers calculated
- [ ] Proficiency bonus determined (based on level, typically level 1 = +2)
- [ ] Armor Class calculated (10 + DEX modifier + armor bonus)
- [ ] Hit Points calculated (class hit die + CON modifier + any bonuses)
- [ ] Initiative bonus calculated (DEX modifier)
- [ ] Passive Perception calculated (10 + WIS modifier)

**Proficiencies**:
- [ ] Saving throws marked (from class)
- [ ] Skill proficiencies marked (from class + background)
- [ ] Tool proficiencies marked (from background)
- [ ] Weapon proficiencies marked (from class + background)
- [ ] Armor proficiencies marked (from class + background)
- [ ] Languages spoken (from background + species)

**Equipment & Wealth**:
- [ ] Starting equipment selected (from background and class)
- [ ] Starting gold calculated
- [ ] Armor and weapon selections recorded with AC/damage
- [ ] Encumbrance checked (shouldn't exceed 15 × STR score in pounds)

**Class-Specific**:
- [ ] Spell information completed (if spellcaster)
  - [ ] Spellcasting ability determined
  - [ ] Spell slots per level listed
  - [ ] Known spells or prepared spells selected
  - [ ] Cantrips selected
- [ ] Class features listed and understood
- [ ] Subclass choice made (if applicable to your class level)

**Character Details**:
- [ ] Personality described
- [ ] Appearance detailed
- [ ] Background story written
- [ ] Goals and motivations established
- [ ] Party connections identified
- [ ] Character sheet completely filled out

### Using the API for Character Creation

**Reference Files by Step**:
1. **Step 1 - Classes**: Use [class-index.json](class-index.json) to browse, then individual `classes/*.json` files for details
2. **Step 2 - Origin**: Use [origin-builder-rules.json](origin-builder-rules.json) to combine background + species
   - Browse `backgrounds/*.json` for background options
   - Browse `species/*.json` for species options
3. **Step 3 - Abilities**: Reference [rules/abilities.json](rules/abilities.json) for modifier calculations
4. **Step 4 - Alignment**: Consult rules system for alignment descriptions
5. **Step 5 - Personality**: Use [character-sheet.json](character-sheet.json) page 2 template

**Character Sheet Integration**:
- Use [character-sheet.json](character-sheet.json) as template for data organization
- All calculated fields reference the formulas in schema
- Map data from selected class, background, species to sheet sections
- Auto-populate standard calculations (AC, initiative, etc.)

### Example Character Creation (Fighter)

1. **Class**: Choose Fighter (d10 hit die)
2. **Background**: Choose Soldier (+2 STR, +1 CON, +0 CHA; feat: Savage Attacker; skills: Athletics, Intimidation)
3. **Species**: Choose Human (no variants, standard stats)
4. **Ability Scores**: 
   - STR 15 + 2 = 17 (+3 modifier)
   - DEX 14 (+2 modifier)
   - CON 14 + 1 = 15 (+2 modifier)
   - INT 10 (+0 modifier)
   - WIS 12 (+1 modifier)
   - CHA 10 + 0 = 10 (+0 modifier)
5. **Alignment**: Choose Lawful Neutral (professional soldier
6. **Personality**: War veteran, pragmatic, disciplined
7. **Mechanical Details**:
   - HP: 10 + 2 (CON) = 12
   - AC: 16 (chainmail 16, no DEX with heavy armor)
   - Attack: Longsword +5 (+3 STR + 2 proficiency), damage 1d8 + 3

### Reference Structure

Key files for each step:
- `character-creation.json` - Complete creation guide
- `character-sheet.json` - Data structure and field mappings
- `classes/` - 12 playable classes
- `backgrounds/` - 4+ backgrounds with ability/feat/equipment
- `species/` - 9 playable species with traits
- `rules/abilities.json` - Ability score system
- `api-index.json` - Overview of all components and their integration

## Working with Monsters

### Adding New Monsters
1. **Create individual JSON file** in `monsters/` directory
   - Use kebab-case naming (e.g., `storm-giant.json`)
   - Follow the structure defined in `monster-schema.json`
   - Include all required fields: name, size, type, alignment, armor_class, hit_points, speed, ability_scores, challenge_rating

2. **Monster JSON Structure Requirements:**
   ```json
   {
     "name": "Monster Name",
     "size": "Medium|Large|Huge|etc",
     "type": "Creature Type", 
     "alignment": "Alignment",
     "armor_class": 15,
     "initiative": 12,
     "hit_points": {
       "average": 45,
       "formula": "6d10 + 12"
     },
     "ability_scores": {
       "strength": { "score": 18, "modifier": 4, "save": 4 }
       // ... all six abilities
     },
     "actions": [...],
     "tactical_info": {
       "optimal_range": "Description",
       "key_abilities": ["List of abilities"],
       "weaknesses": ["List of weaknesses"], 
       "synergies": ["List of synergies"]
     }
   }
   ```

3. **Update monster-index.json** with:
   - Individual monster entry in alphabetical order in the main list
   - Add to appropriate category examples (aberrations, constructs, etc.)
   - Add to appropriate CR rating examples
   - Include role description and signature abilities

### Monster Categories
- **Aberrations**: Alien entities with bizarre powers
- **Beasts**: Natural animals including dinosaurs and prehistoric creatures (use for all animal stat blocks)
- **Constructs**: Artificial magical beings
- **Dragons**: Powerful reptilian creatures with breath weapons
- **Elementals**: Plane-native creatures with elemental powers
- **Fey**: Magical Feywild creatures
- **Fiends**: Evil Lower Planes creatures (demons/devils)
- **Giants**: Large humanoids with elemental themes
- **Celestials**: Divine Upper Planes beings
- **Humanoids**: Civilized bipedal creatures
- **Monstrosities**: Unnatural magical creatures
- **Oozes**: Amorphous creatures
- **Plants**: Living plant creatures
- **Undead**: Formerly living creatures

### Beast Category Guidelines
- **Natural Animals**: Use "Beast" type for all real-world animals (bears, wolves, hawks, etc.)
- **Dinosaurs**: Also classified as "Beast" type, include in same category
- **Prehistoric Creatures**: Any extinct natural animals use "Beast" type
- **No Animal Prefix**: Don't use "animal-" prefixes in file names, the Beast type serves as the filter
- **Habitat Context**: Include natural habitat information in tactical_info when relevant

## Working with Classes

### Class Structure
- Each class has detailed progression tables
- Subclass options and features
- Spell lists where applicable
- Equipment proficiencies

## Working with Backgrounds

### Background Components
- Ability score improvements
- Skill proficiencies
- Equipment packages
- Background features
- Suggested characteristics

## Working with Equipment

### Equipment Categories
- **Armor**: AC values, properties, weight
- **Weapons**: Damage, properties, weight
- **Adventuring Gear**: Various tools and items
- **Magic Items**: Magical properties and rarities

## Working with Feats

### Feat Types
- **General Feats**: Available to all characters
- **Fighting Style Feats**: Combat-focused abilities
- **Epic Boons**: High-level rewards (CR 20+)

## Working with Magic Items

### Magic Item Infrastructure
Magic items follow the established component pattern with three core files:

1. **magic-item-schema.json** - Defines JSON structure and validation for all magic items
2. **magic-item-index.json** - Master categorized index with organization by rarity, category, and properties
3. **magic-items/** directory - Individual JSON files for each item (kebab-case filenames in flat structure)

**Flat Structure Requirement**: All magic item files go directly in `magic-items/` folder. Do NOT create letter-based subdirectories (a/, b/, c/, etc.) or letter-specific index files. This maintains consistency with monsters, classes, backgrounds, and other components.

### Magic Item Categories (9 Total)
1. **Armor** - Magical armor from Equipment, can specify restricted types
2. **Potions** - Consumable magical brews (always consumed on use)
3. **Rings** - Rings worn on fingers (max 2 active rings per character without special rules)
4. **Rods** - Magical scepters (can serve as Arcane Focus)
5. **Scrolls** - Consumable spell containers (read to cast spell without slot)
6. **Staffs** - Multi-purpose items (can be Quarterstaff + Arcane Focus)
7. **Wands** - Spell-storing items (typically 12-15 inches, can be Arcane Focus)
8. **Weapons** - Magical weapons with bonuses or special properties
9. **Wondrous Items** - Diverse category (boots, belts, capes, bags, figurines, etc.)

### Magic Item Rarity Levels (6 Total)
- **Common** - 100 GP value, most plentiful
- **Uncommon** - 400 GP value, usually found in cities
- **Rare** - 4,000 GP value, found mainly in cities/rare locations
- **Very Rare** - 40,000 GP value, sold in wondrous locations
- **Legendary** - 200,000 GP value, for high-level campaigns
- **Artifact** - Priceless value, unique and difficult to acquire

### Attunement Rules
- Maximum 3 attuned items per character (typically)
- Attunement requires 1 hour of contact while concentrating
- Attunement ends when: removed (if removed for 24 hours), death, or intentionally ended
- Some items specify restrictions (Spellcaster, Class, etc.)
- Non-attuned items can be used by anyone

### Magic Item JSON Structure
```json
{
  "id": "lowercase-kebab-case-id",
  "name": "Item Name",
  "rarity": "Common|Uncommon|Rare|Very Rare|Legendary|Artifact",
  "category": "Armor|Potion|Ring|Rod|Scroll|Staff|Wand|Weapon|Wondrous Item",
  "attunement_required": false,
  "weight": "1 lb",
  "value": "500 GP",
  "description": "Full description of item appearance and basic function",
  "properties": ["Enchanted", "Category Tags"],
  "effect": { /* Mechanical effects of the item */ },
  "activation": {
    "type": "Passive|Action|Bonus Action|Reaction",
    "description": "How to activate the effect"
  },
  "attunement": {
    "required": false,
    "requirements": ["Optional class/type restrictions"],
    "description": "Attunement process if required"
  },
  "consumable": false,
  "curse": null,
  "sentience": null,
  "crafting": null,
  "source": "Player's Handbook"
}
```

### Adding Magic Items
1. **Create JSON file** in `magic-items/` with kebab-case name
2. **Follow structure** from magic-item-schema.json
3. **Include all required fields**: id, name, rarity, category, description
4. **Update magic-item-index.json**:
   - Add to appropriate category (Armor, Potion, etc.)
   - Add to rarity level (Common, Uncommon, etc.)
   - Add to attunement section
   - Add special property categories as applicable

### Common Magic Item Mechanics
- **Charge System**: Items with charges (1d4 + 1 per dawn, destroyed on last charge)
- **Attunement-Based Powers**: Effects require attunement
- **Spell Storage**: Wands/staffs/scrolls that contain spells
- **Consumable Items**: Used up when activated (potions, scrolls)
- **Curses**: Negative effects tied to the item (rare, usually hidden)
- **Sentience**: Intelligent items with personality and alignment

### Potion Specific Rules
- All potions are consumable (used once, then gone)
- Can be administered to another creature as an action
- Taking effect happens at start of next turn for some potions
- Never sentient or cursed
- Effects are instantaneous unless stated otherwise

### Wand/Rod/Staff Specific Rules
- Can serve as Arcane Focus for spellcasting
- Some use a charge system (recharge at dawn)
- Destruction risk on last charge use (roll d20, destroy on 1)
- Higher rarity = better saves DC and more charges
- Can be used as weapons or spell-storing devices

### Scroll Specific Rules
- Single-use consumable items
- Can only be read if spell is on your class list (DC 10 + spell level check if higher level)
- Spell scroll fades after spell is cast
- Never require attunement
- Material components not needed when using scroll

### Crafting Framework
Magic items can be crafted using specific tools (9 categories):
- **Alchemist's Supplies**: Potions
- **Herbalism Kit**: Potions
- **Jeweler's Tools**: Rings
- **Woodcarver's Tools**: Rods, Staffs, Wands
- **Calligrapher's Supplies**: Scrolls
- **Leatherworker's Tools**: Armor, Weapons
- **Smith's Tools**: Armor, Weapons
- **Weaver's Tools**: Armor
- **Tinker's Tools**: Wondrous Items

Crafting times range from 5 days to 250 days depending on rarity.

### Magic Item Examples (10 Included)
1. **Potion of Healing** (Common) - 2d4 + 2 HP restoration
2. **+1 Armor** (Uncommon) - +1 AC bonus
3. **+1 Weapon** (Uncommon) - +1 attack and damage
4. **Ring of Protection** (Uncommon) - +1 AC and saves (requires attunement)
5. **Wand of Fireballs** (Rare) - Spell storage, 7 charges
6. **Bag of Holding** (Uncommon) - 64 cubic feet storage, 500 lbs capacity
7. **Cloak of Billowing** (Common) - Cosmetic billowing effect (no mechanical benefit)
8. **Immovable Rod** (Uncommon) - Fixes in place, 8,000 lb weight limit
9. **Spell Scroll (1st Level)** (Common) - Single-use spell casting
10. **Staff of Striking** (Rare) - +1 quarterstaff with 1d6 force damage (charges)
11. **Boots of Levitation** (Rare) - Flying speed with restrictions, 4 charges
12. **Ring of Wizardry** (Rare) - Concentration advantage, spell storing (3 levels)

## Working with Rules System

### Rules Files Structure
The `rules/` directory contains comprehensive game mechanics and DM reference materials organized by topic:

- **rules-index.json** - Master index of all rule files with complete descriptions and "contains" arrays

### Current Rules Coverage

#### DM Guidance & Session Management
- **dm-rules.json** - DM fundamentals, philosophy, roles, and player management
- **session-management.json** - Session preparation and running guidelines
- **dm-toolbox.json** - Encounter design, custom backgrounds, XP budgets (levels 1-20)
- **running-combat.json** - Initiative tracking, HP management, conditions tracking

#### Game Mechanics & Systems
- **game-mechanics.json** - Basic play structure, roles, rhythm
- **d20-tests.json** - Ability checks, saving throws, attack rolls
- **advantage-disadvantage.json** - Modifier systems and Heroic Inspiration
- **actions.json** - 12 standard actions and action types
- **action-economy.json** - Turn structure, bonus actions, reactions
- **proficiency.json** - Proficiency bonus system and applications
- **skills.json** - 18 skills and ability associations
- **conditions.json** - 15 condition types and mechanics
- **dice-mechanics.json** - Dice types, notation, and usage
- **abilities.json** - Six ability scores and modifiers

#### Combat & Exploration
- **combat-structure.json** - Combat framework and initiative
- **combat-index.json** - Master combat reference index
- **movement-positioning.json** - Movement, positioning, grid rules
- **attack-mechanics.json** - Attacks, cover, opportunity attacks
- **damage-healing.json** - HP, damage types, resistances, death saves
- **special-combat.json** - Mounted, underwater, environmental combat
- **exploration.json** - Environment interaction, vision, travel

#### Social & Environment
- **social-interaction.json** - NPC interactions and influence actions
- **campaigns-adventures.json** - Adventure and campaign structure

#### Hazards & Adversity
- **curses-contagions.json** - Curses, Demonic Possession, magical contagions (Cackle Fever, Sewer Plague, Sight Rot)
- **environmental-hazards.json** - Nine environmental effects (deep water, extreme temperatures, hazardous terrain)
- **fear-mental-stress.json** - Fear effects, mental stress, psychological damage
- **poisons.json** - Four poison types, 14 example poisons (150-2000 gp range), harvesting mechanics
- **traps.json** - Trap design philosophy, 8 scalable traps (levels 1-20)
- **travel-pace.json** - Travel speeds, 11 terrain types, encounter distances, foraging/navigation DCs

### Adding New Rules Files
1. Create file in `rules/` directory with descriptive name (kebab-case)
2. Include "id", "name", "description", and "sections" structure
3. Add "contains" array listing major topics covered
4. Update `rules-index.json` with new file entry in "components" array
5. Include descriptive summary of what the file contains

## JSON Formatting Standards

### Required Conventions
1. **Naming**: Use kebab-case for file names (`storm-giant.json`)
2. **Properties**: Use snake_case for JSON properties (`armor_class`, `hit_points`)
3. **Consistency**: Follow existing patterns exactly
4. **Validation**: Ensure all required fields per schema are included

### Common Fields
- `challenge_rating`: Use decimals for fractional CR (0.25, 0.5)
- `experience_points`: Must match 2024 XP values for CR
- `proficiency_bonus`: Must match CR-appropriate bonus

## Index File Management

### When Adding New Items
1. **Alphabetical Order**: Always maintain alphabetical sorting
2. **Category Updates**: Add to relevant type/CR examples
3. **Role Descriptions**: Provide clear tactical role descriptions
4. **Signature Abilities**: List 3-5 key defining abilities

### Index Structure
Each index contains:
- Category organization with examples
- CR-based organization (for monsters)
- Individual item listings with metadata
- Usage examples and tactical information

## Schema Compliance

### Required Validation
- All items must conform to their respective schema
- Schemas define required vs optional fields
- Type validation (strings, numbers, arrays, objects)
- Enum validation for restricted values

### Common Schema Elements
- **Basic Info**: name, type, alignment
- **Mechanical Stats**: Numerical game values  
- **Descriptive Text**: Flavor and ability descriptions
- **Arrays**: Lists of abilities, equipment, etc.

## Tactical Information

### Include for Combat Entities
- **Optimal Range**: Preferred engagement distance
- **Key Abilities**: Most important tactical features  
- **Weaknesses**: Exploitable vulnerabilities
- **Synergies**: Works well with or enhances

## File Organization Best Practices

### Directory Structure
- Keep individual files in subdirectories by type
- Use clear, descriptive file names
- Maintain consistent naming patterns

### Cross-References
- Use exact name matching between files
- Maintain referential integrity in indexes
- Update all related files when making changes

## Version Control
- This API follows D&D 2024 Edition rules
- Mark schema versions consistently
- Maintain backward compatibility when possible

## Quality Assurance

### Before Committing Changes
1. Validate JSON syntax
2. Verify schema compliance
3. Check alphabetical ordering in indexes
4. Ensure all cross-references are updated
5. Test that required fields are present

### Common Mistakes to Avoid
- Forgetting to update index files
- Breaking alphabetical order
- Inconsistent naming conventions  
- Missing required schema fields
- Incorrect CR/XP relationships

---

*Always refer to official D&D 2024 source materials for accurate game data. This API provides structured access to published game content.*