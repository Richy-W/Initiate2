from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class JSONField(models.TextField):
    """Simple JSON field using TextField for SQLite compatibility."""
    
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('default', dict)
        super().__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            return value

    def to_python(self, value):
        if isinstance(value, (dict, list)):
            return value
        if value is None:
            return None
        if value == '':
            return None
        try:
            return json.loads(value)
        except (TypeError, ValueError):
            return value

    def get_prep_value(self, value):
        if value is None:
            return None
        return json.dumps(value)
    
    def value_to_string(self, obj):
        value = self.value_from_object(obj)
        return self.get_prep_value(value)


class BaseContentModel(models.Model):
    """Abstract base model for all D&D content."""
    
    name = models.CharField(max_length=200, db_index=True)
    description = models.TextField()
    source = models.CharField(max_length=100, default="Player's Handbook 2024")
    page = models.PositiveIntegerField(null=True, blank=True)
    
    # Common metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        ordering = ['name']
    
    def __str__(self):
        return self.name


class DamageType(models.Model):
    """D&D damage types."""
    
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Condition(models.Model):
    """D&D conditions that can affect creatures."""
    
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Skill(models.Model):
    """D&D skills."""
    
    name = models.CharField(max_length=50, unique=True)
    ability = models.CharField(max_length=20, choices=[
        ('STR', 'Strength'),
        ('DEX', 'Dexterity'), 
        ('CON', 'Constitution'),
        ('INT', 'Intelligence'),
        ('WIS', 'Wisdom'),
        ('CHA', 'Charisma'),
    ])
    description = models.TextField()
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.ability})"


class Species(BaseContentModel):
    """D&D character species (races)."""
    
    size = models.CharField(max_length=20, choices=[
        ('Tiny', 'Tiny'),
        ('Small', 'Small'),
        ('Medium', 'Medium'), 
        ('Large', 'Large'),
        ('Huge', 'Huge'),
        ('Gargantuan', 'Gargantuan'),
    ], default='Medium')
    
    speed = models.PositiveIntegerField(default=30, help_text="Base walking speed in feet")
    darkvision = models.PositiveIntegerField(default=0, help_text="Darkvision range in feet")
    
    # Ability score increases - for 2024 rules, this is more flexible
    ability_score_increases = JSONField(default=dict, help_text="JSON of ability score bonuses")
    
    # Life span information
    lifespan = models.CharField(max_length=200, blank=True, help_text="Typical lifespan description")
    
    # Species features
    traits = JSONField(default=list, help_text="JSON array of racial traits with descriptions")
    languages = JSONField(default=list, help_text="JSON array of known languages")
    proficiencies = JSONField(default=dict, help_text="JSON of skill/tool/armor proficiencies")
    
    # Movement types (for species with special movement)
    movement_types = JSONField(default=dict, help_text="Additional movement types (swim, fly, climb)")
    
    # Creature type (most are Humanoid, but some aren't)
    creature_type = models.CharField(max_length=30, default="Humanoid")
    
    class Meta:
        verbose_name_plural = "Species"
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def has_darkvision(self):
        """Check if this species has darkvision."""
        return self.darkvision > 0

    @property 
    def movement_summary(self):
        """Get a summary of all movement types."""
        summary = [f"Walk {self.speed} ft."]
        for movement_type, speed in self.movement_types.items():
            summary.append(f"{movement_type.title()} {speed} ft.")
        return ", ".join(summary)


class Background(BaseContentModel):
    """D&D character backgrounds."""
    
    # Ability score increases (new in D&D 2024)
    ability_score_increases = JSONField(default=dict, help_text="JSON of ability score bonuses")
    
    # Background features
    skill_proficiencies = models.ManyToManyField(Skill, blank=True)
    skill_choices = models.PositiveIntegerField(default=0, help_text="Number of additional skills to choose")
    languages = JSONField(default=list, help_text="Languages or language choices")
    equipment = JSONField(default=list, help_text="Starting equipment")
    tool_proficiencies = JSONField(default=list, help_text="Tool proficiencies")
    
    # Background feature
    feature_name = models.CharField(max_length=100)
    feature_description = models.TextField()
    
    # Starting wealth alternative 
    starting_gold = models.PositiveIntegerField(default=0, help_text="Alternative starting gold")
    
    # Background origin (for 2024 Origins)
    origin_feats = JSONField(default=list, help_text="Available feat choices from this background")
    
    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def total_skill_choices(self):
        """Get total number of skill proficiencies available."""
        return self.skill_proficiencies.count() + self.skill_choices


class CharacterClass(BaseContentModel):
    """D&D character classes."""
    
    hit_die = models.PositiveIntegerField(validators=[MinValueValidator(4), MaxValueValidator(12)])
    primary_ability = JSONField(default=list, help_text="Primary ability scores for multiclassing")
    
    # Saving throws
    saving_throw_proficiencies = JSONField(default=list, help_text="Saving throw proficiencies")
    
    # Proficiencies
    armor_proficiencies = JSONField(default=list)
    weapon_proficiencies = JSONField(default=list)
    tool_proficiencies = JSONField(default=list)
    skill_proficiencies = models.ManyToManyField(Skill, blank=True, help_text="Available skill choices")
    skill_choices = models.PositiveIntegerField(default=2, help_text="Number of skills to choose")
    
    # Spellcasting
    spellcasting = JSONField(default=dict, help_text="Spellcasting information if applicable")
    
    # Starting equipment
    starting_equipment = JSONField(default=list)
    starting_wealth = JSONField(default=dict, help_text="Alternative starting wealth")
    
    # Subclass information
    subclass_name = models.CharField(max_length=100, blank=True, help_text="What subclasses are called (e.g., 'Domain' for Cleric)")
    subclass_level = models.PositiveIntegerField(default=3, help_text="Level when subclass is chosen")
    
    class Meta:
        verbose_name_plural = "Character Classes"
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def is_spellcaster(self):
        """Check if this class can cast spells."""
        return bool(self.spellcasting and self.spellcasting.get('spellcasting_ability'))

    @property
    def spell_slots_at_level(self):
        """Get spell slot progression if applicable."""
        return self.spellcasting.get('spell_slots', {}) if self.spellcasting else {}


class ClassFeature(models.Model):
    """Features gained by class levels."""
    
    character_class = models.ForeignKey(CharacterClass, on_delete=models.CASCADE, related_name='features')
    name = models.CharField(max_length=100)
    description = models.TextField()
    level = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    
    # Feature metadata
    uses = models.CharField(max_length=50, blank=True, help_text="Usage limitations")
    recharge = models.CharField(max_length=50, blank=True, help_text="Recharge conditions")
    
    class Meta:
        ordering = ['character_class', 'level', 'name']
        unique_together = ['character_class', 'name', 'level']
    
    def __str__(self):
        return f"{self.character_class.name} {self.level}: {self.name}"


class Spell(BaseContentModel):
    """D&D spells."""
    
    level = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(9)])
    school = models.CharField(max_length=50, choices=[
        ('Abjuration', 'Abjuration'),
        ('Conjuration', 'Conjuration'),
        ('Divination', 'Divination'),
        ('Enchantment', 'Enchantment'),
        ('Evocation', 'Evocation'),
        ('Illusion', 'Illusion'),
        ('Necromancy', 'Necromancy'),
        ('Transmutation', 'Transmutation'),
    ])
    
    # Casting
    casting_time = models.CharField(max_length=100)
    range = models.CharField(max_length=100) 
    components = JSONField(default=dict, help_text="Verbal, Somatic, Material components")
    duration = models.CharField(max_length=100)
    concentration = models.BooleanField(default=False)
    ritual = models.BooleanField(default=False)
    
    # Classes that can learn this spell
    classes = models.ManyToManyField(CharacterClass, blank=True, related_name='spells')
    
    # Damage and effects
    damage = JSONField(default=dict, help_text="Damage dice and type")
    higher_levels = models.TextField(blank=True, help_text="At Higher Levels description")


class Equipment(BaseContentModel):
    """D&D equipment items."""
    
    TYPE_CHOICES = [
        ('armor', 'Armor'),
        ('weapon', 'Weapon'),
        ('shield', 'Shield'),
        ('tool', 'Tool'),
        ('gear', 'Adventuring Gear'),
        ('mount', 'Mount/Vehicle'),
    ]
    
    equipment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    cost = JSONField(default=dict, help_text="Cost in different currencies")
    weight = models.FloatField(default=0.0, help_text="Weight in pounds")
    
    # Armor specific
    armor_class = models.PositiveIntegerField(null=True, blank=True)
    dex_bonus_max = models.PositiveIntegerField(null=True, blank=True)
    strength_requirement = models.PositiveIntegerField(null=True, blank=True)
    stealth_disadvantage = models.BooleanField(default=False)
    
    # Weapon specific
    damage = JSONField(default=dict, help_text="Damage dice and type")
    properties = JSONField(default=list, help_text="Weapon properties")
    
    # Tool specific
    tool_type = models.CharField(max_length=50, blank=True)


class Feat(BaseContentModel):
    """D&D feats."""
    
    prerequisite = models.CharField(max_length=200, blank=True)
    ability_score_increase = JSONField(default=dict, help_text="ASI options")
    benefits = JSONField(default=list, help_text="List of feat benefits")
    
    # Feat type
    TYPE_CHOICES = [
        ('general', 'General Feat'),
        ('fighting_style', 'Fighting Style'),
        ('epic_boon', 'Epic Boon'),
        ('origin', 'Origin Feat'),
    ]
    feat_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general')


class Monster(BaseContentModel):
    """D&D monsters and NPCs."""
    
    # Basic stats
    size = models.CharField(max_length=20, choices=[
        ('Tiny', 'Tiny'),
        ('Small', 'Small'),
        ('Medium', 'Medium'),
        ('Large', 'Large'),
        ('Huge', 'Huge'),
        ('Gargantuan', 'Gargantuan'),
    ])
    
    creature_type = models.CharField(max_length=50)
    alignment = models.CharField(max_length=50)
    
    # Combat stats
    armor_class = models.PositiveIntegerField()
    hit_points = models.PositiveIntegerField()
    hit_dice = models.CharField(max_length=20)
    speed = JSONField(default=dict, help_text="Different movement speeds")
    
    # Ability scores
    strength = models.PositiveIntegerField(default=10)
    dexterity = models.PositiveIntegerField(default=10)
    constitution = models.PositiveIntegerField(default=10)
    intelligence = models.PositiveIntegerField(default=10)
    wisdom = models.PositiveIntegerField(default=10)
    charisma = models.PositiveIntegerField(default=10)
    
    # Combat info
    challenge_rating = models.FloatField()
    proficiency_bonus = models.PositiveIntegerField()
    experience_points = models.PositiveIntegerField()
    
    # Resistances and immunities
    damage_vulnerabilities = models.ManyToManyField(DamageType, blank=True, related_name='vulnerable_monsters')
    damage_resistances = models.ManyToManyField(DamageType, blank=True, related_name='resistant_monsters')
    damage_immunities = models.ManyToManyField(DamageType, blank=True, related_name='immune_monsters')
    condition_immunities = models.ManyToManyField(Condition, blank=True)
    
    # Senses and languages
    senses = JSONField(default=list, help_text="Special senses")
    languages = JSONField(default=list, help_text="Known languages")
    
    # Special abilities and actions
    special_abilities = JSONField(default=list, help_text="Special abilities")
    actions = JSONField(default=list, help_text="Actions") 
    bonus_actions = JSONField(default=list, help_text="Bonus actions")
    reactions = JSONField(default=list, help_text="Reactions")
    legendary_actions = JSONField(default=list, help_text="Legendary actions")


class MagicItem(BaseContentModel):
    """D&D magic items."""
    
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('very_rare', 'Very Rare'),
        ('legendary', 'Legendary'),
        ('artifact', 'Artifact'),
    ]
    
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES)
    item_type = models.CharField(max_length=100, help_text="Type of item (e.g., 'Wondrous item')")
    attunement = models.BooleanField(default=False)
    attunement_requirements = models.CharField(max_length=200, blank=True)
    
    # Properties
    properties = JSONField(default=list, help_text="Magic item properties")
    charges = models.PositiveIntegerField(null=True, blank=True, help_text="Number of charges if applicable")
    
    # Curse information
    cursed = models.BooleanField(default=False)
    curse_description = models.TextField(blank=True)
