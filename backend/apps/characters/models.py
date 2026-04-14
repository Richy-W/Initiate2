from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.content.models import Species, CharacterClass, Background, Skill, JSONField
import json

User = get_user_model()


class Character(models.Model):
    """D&D 5e Character model with full stat calculation."""
    
    # Basic Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=100)
    
    # Core character creation choices
    species = models.ForeignKey(Species, on_delete=models.PROTECT)
    character_class = models.ForeignKey(CharacterClass, on_delete=models.PROTECT)
    background = models.ForeignKey(Background, on_delete=models.PROTECT)
    
    # Level and experience
    level = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(20)])
    experience_points = models.PositiveIntegerField(default=0)
    
    # Ability Scores (base scores before any modifiers)
    strength = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(20)])
    dexterity = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(20)])
    constitution = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(20)])
    intelligence = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(20)])
    wisdom = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(20)])
    charisma = models.PositiveIntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(20)])
    
    # Hit Points
    max_hit_points = models.PositiveIntegerField(default=8)
    current_hit_points = models.PositiveIntegerField(default=8)
    temporary_hit_points = models.PositiveIntegerField(default=0)
    
    # Armor Class
    armor_class = models.PositiveIntegerField(default=10)
    
    # Proficiencies
    skill_proficiencies = models.ManyToManyField(Skill, blank=True, related_name='proficient_characters')
    skill_expertises = models.ManyToManyField(Skill, blank=True, related_name='expert_characters')
    saving_throw_proficiencies = JSONField(default=list, help_text="List of ability names")
    
    # Equipment and features
    equipment = JSONField(default=list, help_text="Character's equipment")
    features = JSONField(default=list, help_text="Character features and traits")
    spells_known = JSONField(default=list, help_text="Known spells")
    
    # Character customization
    personality_traits = models.TextField(blank=True)
    ideals = models.TextField(blank=True) 
    bonds = models.TextField(blank=True)
    flaws = models.TextField(blank=True)
    
    # Backstory
    backstory = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Meta information
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=False, help_text="Whether this character can be viewed by others")
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['user', 'name']
        
    def __str__(self):
        return f"{self.name} ({self.species.name} {self.character_class.name} {self.level})"
    
    # Ability Score Modifiers
    @property
    def strength_modifier(self):
        return self._calculate_modifier(self.total_strength)
    
    @property
    def dexterity_modifier(self):
        return self._calculate_modifier(self.total_dexterity)
        
    @property
    def constitution_modifier(self):
        return self._calculate_modifier(self.total_constitution)
        
    @property
    def intelligence_modifier(self):
        return self._calculate_modifier(self.total_intelligence)
        
    @property
    def wisdom_modifier(self):
        return self._calculate_modifier(self.total_wisdom)
        
    @property
    def charisma_modifier(self):
        return self._calculate_modifier(self.total_charisma)
    
    # Total Ability Scores (including racial bonuses)
    @property
    def total_strength(self):
        base = self.strength
        species_bonus = self.species.ability_score_increases.get('strength', 0)
        background_bonus = self.background.ability_score_increases.get('strength', 0)
        return min(20, base + species_bonus + background_bonus)
    
    @property
    def total_dexterity(self):
        base = self.dexterity
        species_bonus = self.species.ability_score_increases.get('dexterity', 0)
        background_bonus = self.background.ability_score_increases.get('dexterity', 0)
        return min(20, base + species_bonus + background_bonus)
        
    @property
    def total_constitution(self):
        base = self.constitution
        species_bonus = self.species.ability_score_increases.get('constitution', 0)
        background_bonus = self.background.ability_score_increases.get('constitution', 0)
        return min(20, base + species_bonus + background_bonus)
        
    @property
    def total_intelligence(self):
        base = self.intelligence
        species_bonus = self.species.ability_score_increases.get('intelligence', 0)
        background_bonus = self.background.ability_score_increases.get('intelligence', 0)
        return min(20, base + species_bonus + background_bonus)
        
    @property
    def total_wisdom(self):
        base = self.wisdom
        species_bonus = self.species.ability_score_increases.get('wisdom', 0)
        background_bonus = self.background.ability_score_increases.get('wisdom', 0)
        return min(20, base + species_bonus + background_bonus)
        
    @property
    def total_charisma(self):
        base = self.charisma
        species_bonus = self.species.ability_score_increases.get('charisma', 0)
        background_bonus = self.background.ability_score_increases.get('charisma', 0)
        return min(20, base + species_bonus + background_bonus)
    
    # Calculated Properties
    @property
    def proficiency_bonus(self):
        """Calculate proficiency bonus based on level."""
        return ((self.level - 1) // 4) + 2
    
    @property
    def initiative(self):
        """Calculate initiative modifier."""
        return self.dexterity_modifier
    
    @property
    def speed(self):
        """Get movement speed."""
        return self.species.speed
    
    @property
    def carrying_capacity(self):
        """Calculate carrying capacity."""
        return self.total_strength * 15
    
    @property
    def hit_point_maximum(self):
        """Calculate maximum hit points."""
        # This is a simplified calculation - could be enhanced with class progression
        constitution_bonus = self.constitution_modifier * self.level
        class_hp = self.character_class.hit_die + ((self.level - 1) * (self.character_class.hit_die // 2 + 1))
        return max(1, class_hp + constitution_bonus)
    
    def _calculate_modifier(self, score):
        """Calculate ability modifier from ability score."""
        return (score - 10) // 2
    
    def get_saving_throw_bonus(self, ability):
        """Get saving throw bonus for a specific ability."""
        modifier = getattr(self, f'{ability}_modifier')
        if ability in self.saving_throw_proficiencies:
            return modifier + self.proficiency_bonus
        return modifier
    
    def get_skill_bonus(self, skill):
        """Get skill bonus for a specific skill."""
        ability = skill.ability.lower()
        # Convert 3-letter codes to full names
        ability_map = {
            'str': 'strength', 'dex': 'dexterity', 'con': 'constitution',
            'int': 'intelligence', 'wis': 'wisdom', 'cha': 'charisma'
        }
        ability = ability_map.get(ability, ability)
        modifier = getattr(self, f'{ability}_modifier')
        
        if skill in self.skill_expertises.all():
            return modifier + (self.proficiency_bonus * 2)
        elif skill in self.skill_proficiencies.all():
            return modifier + self.proficiency_bonus
        else:
            return modifier
    
    def is_proficient_in_skill(self, skill):
        """Check if character is proficient in a skill."""
        return skill in self.skill_proficiencies.all()
    
    def is_expert_in_skill(self, skill):
        """Check if character has expertise in a skill."""
        return skill in self.skill_expertises.all()
    
    def save(self, *args, **kwargs):
        """Override save to calculate dependent values."""
        # Set current HP to max HP for new characters
        if not self.pk and self.current_hit_points == 8:
            self.current_hit_points = self.hit_point_maximum
            self.max_hit_points = self.hit_point_maximum
        
        super().save(*args, **kwargs)


class CharacterSpell(models.Model):
    """Track spells known/prepared by a character."""
    
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='character_spells')
    spell = models.ForeignKey('content.Spell', on_delete=models.CASCADE)
    
    # Spell preparation status
    is_prepared = models.BooleanField(default=True)
    is_always_prepared = models.BooleanField(default=False, help_text="Spells that are always prepared (domain spells, etc.)")
    
    # Spell customization
    spell_level = models.PositiveIntegerField(help_text="Level at which the spell is cast")
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['character', 'spell']
        ordering = ['spell__level', 'spell__name']
    
    def __str__(self):
        return f"{self.character.name} - {self.spell.name}"
