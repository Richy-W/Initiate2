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
    tool_proficiencies = JSONField(default=list, help_text="List of tool proficiency names")
    
    # Equipment and features
    equipment = JSONField(default=list, help_text="Character's equipment items with quantities")
    equipped_items = JSONField(default=dict, help_text="Currently equipped items by slot")
    currency = JSONField(default=dict, help_text="Character's currency (cp, sp, gp, pp)")
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
    
    # Inventory Management Methods
    
    def add_item(self, equipment_id, quantity=1):
        """Add an item to the character's inventory."""
        # Find existing item or create new entry
        for item in self.equipment:
            if item.get('equipment_id') == equipment_id:
                item['quantity'] = item.get('quantity', 1) + quantity
                break
        else:
            self.equipment.append({
                'equipment_id': equipment_id,
                'quantity': quantity
            })
        self.save(update_fields=['equipment'])
    
    def remove_item(self, equipment_id, quantity=1):
        """Remove an item from the character's inventory."""
        for i, item in enumerate(self.equipment):
            if item.get('equipment_id') == equipment_id:
                current_quantity = item.get('quantity', 1)
                if current_quantity <= quantity:
                    # Remove item entirely
                    del self.equipment[i]
                else:
                    # Reduce quantity
                    item['quantity'] = current_quantity - quantity
                self.save(update_fields=['equipment'])
                break
    
    def equip_item(self, equipment_id, slot=None):
        """Equip an item to a specific slot with validation."""
        can_equip, message = self.can_equip_item(equipment_id, slot)
        
        if not can_equip:
            return False, message
        
        # Find the slot to use
        if not slot:
            from apps.content.models import Equipment
            try:
                equipment = Equipment.objects.get(id=equipment_id)
                valid_slots = self._get_valid_slots_for_equipment(equipment)
                
                # Find first available slot
                for valid_slot in valid_slots:
                    if not self.equipped_items or valid_slot not in self.equipped_items:
                        slot = valid_slot
                        break
            except Equipment.DoesNotExist:
                return False, "Equipment not found"
        
        if not slot:
            return False, "No available slot found"
        
        # Handle two-handed weapons
        from apps.content.models import Equipment
        try:
            equipment = Equipment.objects.get(id=equipment_id)
            if hasattr(equipment, 'properties') and equipment.properties:
                properties = equipment.properties if isinstance(equipment.properties, list) else []
                if 'two-handed' in properties:
                    # Unequip off-hand item if present
                    if self.equipped_items and 'off_hand' in self.equipped_items:
                        self.unequip_item('off_hand')
        except Equipment.DoesNotExist:
            pass
        
        # Equip the item
        if not self.equipped_items:
            self.equipped_items = {}
        self.equipped_items[slot] = equipment_id
        self.save(update_fields=['equipped_items'])
        
        return True, f"Item equipped in {slot} slot"
    
    def unequip_item(self, slot):
        """Unequip an item from a specific slot."""
        if self.equipped_items and slot in self.equipped_items:
            del self.equipped_items[slot]
            self.save(update_fields=['equipped_items'])
            return True, f"Item unequipped from {slot} slot"
        return False, f"No item equipped in {slot} slot"
    
    @property
    def total_weight(self):
        """Calculate total weight of carried items."""
        from apps.content.models import Equipment
        total = 0
        for item in self.equipment:
            try:
                equipment = Equipment.objects.get(id=item['equipment_id'])
                quantity = item.get('quantity', 1)
                total += equipment.weight * quantity
            except Equipment.DoesNotExist:
                continue
        return total
    
    @property
    def is_encumbered(self):
        """Check if character is encumbered by weight."""
        return self.total_weight > self.carrying_capacity
    
    @property 
    def encumbrance_status(self):
        """
        Get encumbrance status with support for different rule variants.
        Currently implements Simple rules; can be enhanced for campaign-specific variants.
        """
        weight = self.total_weight
        capacity = self.carrying_capacity
        
        # Simple encumbrance rules (default D&D 2024)
        if weight <= capacity:
            return 'normal'
        elif weight <= capacity * 2:
            return 'encumbered'  # Speed reduced by 10 feet
        else:
            return 'heavily_encumbered'  # Speed reduced to 5 feet, disadvantage on ability checks/attacks/saves using Str/Dex/Con
    
    @property
    def encumbrance_effects(self):
        """Get the mechanical effects of current encumbrance status."""
        status = self.encumbrance_status
        
        if status == 'normal':
            return {
                'speed_penalty': 0,
                'disadvantage_checks': False,
                'description': 'No encumbrance penalties'
            }
        elif status == 'encumbered':
            return {
                'speed_penalty': 10,
                'disadvantage_checks': False,
                'description': 'Speed reduced by 10 feet'
            }
        else:  # heavily_encumbered
            return {
                'speed_penalty': self.speed - 5,  # Reduced to 5 feet
                'disadvantage_checks': True,
                'description': 'Speed reduced to 5 feet, disadvantage on ability checks, attack rolls, and saving throws that use Strength, Dexterity, or Constitution'
            }
    
    @property
    def effective_speed(self):
        """Get character speed accounting for encumbrance."""
        base_speed = self.speed
        effects = self.encumbrance_effects
        return max(5, base_speed - effects['speed_penalty'])
    
    def get_encumbrance_for_campaign_rules(self, encumbrance_rule='SIMPLE'):
        """
        Calculate encumbrance based on different campaign rule variants.
        This method can be called when campaign settings are available.
        """
        weight = self.total_weight
        capacity = self.carrying_capacity
        
        if encumbrance_rule == 'DISABLED':
            return {
                'status': 'normal',
                'effects': {
                    'speed_penalty': 0,
                    'disadvantage_checks': False,
                    'description': 'Encumbrance rules disabled'
                }
            }
        
        elif encumbrance_rule == 'SIMPLE':
            # Standard D&D 2024 rules (current implementation)
            return {
                'status': self.encumbrance_status,
                'effects': self.encumbrance_effects
            }
            
        elif encumbrance_rule == 'VARIANT':
            # Variant encumbrance rules with multiple tiers
            fifth_capacity = capacity / 5
            
            if weight <= fifth_capacity:
                status = 'unencumbered'
                effects = {
                    'speed_penalty': 0,
                    'disadvantage_checks': False,
                    'description': 'Unencumbered - no penalties'
                }
            elif weight <= capacity * 2 / 5:
                status = 'lightly_encumbered'
                effects = {
                    'speed_penalty': 5,
                    'disadvantage_checks': False,
                    'description': 'Lightly encumbered - speed reduced by 5 feet'
                }
            elif weight <= capacity * 3 / 5:
                status = 'moderately_encumbered'
                effects = {
                    'speed_penalty': 10,
                    'disadvantage_checks': False,
                    'description': 'Moderately encumbered - speed reduced by 10 feet'
                }
            elif weight <= capacity:
                status = 'heavily_encumbered'
                effects = {
                    'speed_penalty': 15,
                    'disadvantage_checks': True,
                    'description': 'Heavily encumbered - speed reduced by 15 feet, disadvantage on ability checks and saving throws using Str, Dex, or Con'
                }
            else:
                status = 'over_encumbered'
                effects = {
                    'speed_penalty': self.speed - 5,
                    'disadvantage_checks': True,
                    'description': 'Over encumbered - speed reduced to 5 feet, disadvantage on ability checks, attack rolls, and saving throws using Str, Dex, or Con'
                }
            
            return {
                'status': status,
                'effects': effects
            }
        
        # Default to simple rules
        return {
            'status': self.encumbrance_status,
            'effects': self.encumbrance_effects
        }
    
    def get_equipped_item_in_slot(self, slot):
        """Get equipped item ID for a specific slot."""
        return self.equipped_items.get(slot) if self.equipped_items else None
    
    def get_equipped_items_details(self):
        """Get detailed information about all equipped items."""
        from apps.content.models import Equipment
        
        if not self.equipped_items:
            return {}
        
        equipped_details = {}
        for slot, equipment_id in self.equipped_items.items():
            try:
                equipment = Equipment.objects.get(id=equipment_id)
                equipped_details[slot] = {
                    'equipment': equipment,
                    'slot': slot,
                    'id': equipment_id
                }
            except Equipment.DoesNotExist:
                # Remove invalid equipment reference
                continue
        
        return equipped_details
    
    def can_equip_item(self, equipment_id, slot=None):
        """Check if an item can be equipped in a specific slot or any valid slot."""
        from apps.content.models import Equipment
        
        try:
            equipment = Equipment.objects.get(id=equipment_id)
        except Equipment.DoesNotExist:
            return False, "Equipment not found"
        
        # Validate slot based on equipment type
        valid_slots = self._get_valid_slots_for_equipment(equipment)
        
        if slot:
            if slot not in valid_slots:
                return False, f"Equipment cannot be equipped in {slot} slot"
            
            # Check if slot is already occupied
            if self.equipped_items and slot in self.equipped_items:
                return False, f"Slot {slot} is already occupied"
        else:
            # Find first available slot
            available_slots = []
            for valid_slot in valid_slots:
                if not self.equipped_items or valid_slot not in self.equipped_items:
                    available_slots.append(valid_slot)
            
            if not available_slots:
                return False, f"No available slots for {equipment.equipment_type}"
        
        # Check if character has the item in inventory
        has_item = False
        for item in self.equipment:
            if item['equipment_id'] == equipment_id and item.get('quantity', 1) > 0:
                has_item = True
                break
        
        if not has_item:
            return False, "Item not in inventory"
        
        # Check equipment restrictions (strength requirement, etc.)
        if hasattr(equipment, 'strength_requirement') and equipment.strength_requirement:
            if self.total_strength < equipment.strength_requirement:
                return False, f"Requires {equipment.strength_requirement} Strength (have {self.total_strength})"
        
        return True, "Can equip"
    
    def _get_valid_slots_for_equipment(self, equipment):
        """Get valid equipment slots for a piece of equipment."""
        equipment_type = equipment.equipment_type.lower()
        
        slot_mapping = {
            'armor': ['armor'],
            'shield': ['shield'],
            'weapon': ['main_hand', 'off_hand'],
            'melee_weapon': ['main_hand', 'off_hand'],
            'ranged_weapon': ['main_hand', 'off_hand'],
            'simple_melee_weapon': ['main_hand', 'off_hand'],
            'simple_ranged_weapon': ['main_hand', 'off_hand'],
            'martial_melee_weapon': ['main_hand', 'off_hand'],
            'martial_ranged_weapon': ['main_hand', 'off_hand'],
            'ring': ['ring_1', 'ring_2'],
            'amulet': ['neck'],
            'necklace': ['neck'],
            'cloak': ['cloak'],
            'boots': ['feet'],
            'gloves': ['hands'],
            'helmet': ['head'],
            'belt': ['belt'],
            'bracers': ['wrists']
        }
        
        # Check for specific weapon properties
        if hasattr(equipment, 'properties') and equipment.properties:
            properties = equipment.properties if isinstance(equipment.properties, list) else []
            if 'two-handed' in properties:
                return ['main_hand']  # Two-handed items occupy main hand only but require both hands free
        
        return slot_mapping.get(equipment_type, [])
    
    @property
    def calculated_armor_class(self):
        """Calculate AC including equipped armor/shield."""
        from apps.content.models import Equipment
        
        base_ac = 10 + self.dexterity_modifier
        equipped_ac = 10
        max_dex_bonus = None
        
        # Check for equipped armor
        armor_id = self.get_equipped_item_in_slot('armor')
        if armor_id:
            try:
                armor = Equipment.objects.get(id=armor_id)
                if armor.armor_class:
                    equipped_ac = armor.armor_class
                    max_dex_bonus = armor.dex_bonus_max
            except Equipment.DoesNotExist:
                pass
        
        # Apply dexterity modifier with max bonus limit
        dex_modifier = self.dexterity_modifier
        if max_dex_bonus is not None:
            dex_modifier = min(dex_modifier, max_dex_bonus)
        
        final_ac = equipped_ac + dex_modifier
        
        # Add shield bonus
        shield_id = self.get_equipped_item_in_slot('shield')
        if shield_id:
            try:
                shield = Equipment.objects.get(id=shield_id)
                if shield.armor_class:
                    final_ac += shield.armor_class
            except Equipment.DoesNotExist:
                pass
        
        return max(final_ac, base_ac)
    
    def get_currency_total_gp_value(self):
        """Get total currency value in gold pieces."""
        currency = self.currency or {}
        cp = currency.get('cp', 0)
        sp = currency.get('sp', 0)
        ep = currency.get('ep', 0)
        gp = currency.get('gp', 0)
        pp = currency.get('pp', 0)
        
        return (pp * 10) + gp + (ep * 0.5) + (sp * 0.1) + (cp * 0.01)
    
    def add_currency(self, currency_type, amount):
        """Add currency of a specific type."""
        if not self.currency:
            self.currency = {}
        if currency_type not in ['cp', 'sp', 'ep', 'gp', 'pp']:
            raise ValueError(f"Invalid currency type: {currency_type}")
        if amount < 0:
            raise ValueError("Amount must be positive")
        
        current = self.currency.get(currency_type, 0)
        self.currency[currency_type] = current + amount
        self.save(update_fields=['currency'])
        return True
    
    def remove_currency(self, currency_type, amount):
        """Remove currency of a specific type."""
        if currency_type not in ['cp', 'sp', 'ep', 'gp', 'pp']:
            raise ValueError(f"Invalid currency type: {currency_type}")
        if amount < 0:
            raise ValueError("Amount must be positive")
        if not self.currency:
            return False, "No currency to remove"
        
        current = self.currency.get(currency_type, 0)
        if current >= amount:
            self.currency[currency_type] = current - amount
            self.save(update_fields=['currency'])
            return True, f"Removed {amount} {currency_type}"
        return False, f"Insufficient {currency_type} (have {current}, need {amount})"
    
    def can_afford_cost(self, cost_dict):
        """Check if character can afford a specific cost."""
        # Convert cost to total GP value and compare with total wealth
        total_cost_gp = 0
        for currency_type, amount in cost_dict.items():
            if currency_type == 'cp':
                total_cost_gp += amount * 0.01
            elif currency_type == 'sp':
                total_cost_gp += amount * 0.1
            elif currency_type == 'ep':
                total_cost_gp += amount * 0.5
            elif currency_type == 'gp':
                total_cost_gp += amount
            elif currency_type == 'pp':
                total_cost_gp += amount * 10
        
        return self.get_currency_total_gp_value() >= total_cost_gp
    
    def pay_cost(self, cost_dict, auto_convert=True):
        """
        Pay a cost, automatically converting currency if needed.
        
        Args:
            cost_dict: Dict with currency types and amounts (e.g., {'gp': 50, 'sp': 5})
            auto_convert: Whether to automatically convert higher denominations if exact currency not available
            
        Returns:
            tuple: (success: bool, message: str)
        """
        # First check if we can afford it at all
        if not self.can_afford_cost(cost_dict):
            return False, "Cannot afford this cost"
        
        if not auto_convert:
            # Check if we have exact currency amounts
            current_currency = self.currency or {}
            for currency_type, amount_needed in cost_dict.items():
                current_amount = current_currency.get(currency_type, 0)
                if current_amount < amount_needed:
                    return False, f"Need {amount_needed} {currency_type}, but only have {current_amount}"
            
            # Deduct exact amounts
            for currency_type, amount in cost_dict.items():
                self.remove_currency(currency_type, amount)
            return True, "Payment successful"
        
        # Auto-convert currency if needed
        total_cost_cp = 0
        for currency_type, amount in cost_dict.items():
            if currency_type == 'cp':
                total_cost_cp += amount
            elif currency_type == 'sp':
                total_cost_cp += amount * 10
            elif currency_type == 'gp':
                total_cost_cp += amount * 100
            elif currency_type == 'pp':
                total_cost_cp += amount * 1000
        
        return self._pay_in_copper(total_cost_cp)
    
    def _pay_in_copper(self, total_cp_needed):
        """Internal method to pay a cost by converting all currency to copper."""
        current_currency = self.currency or {}
        
        # Calculate total copper we have
        total_cp_available = 0
        total_cp_available += current_currency.get('cp', 0)
        total_cp_available += current_currency.get('sp', 0) * 10
        total_cp_available += current_currency.get('gp', 0) * 100
        total_cp_available += current_currency.get('pp', 0) * 1000
        
        if total_cp_available < total_cp_needed:
            return False, f"Insufficient funds (need {total_cp_needed} cp total, have {total_cp_available})"
        
        # Pay using highest denominations first 
        remaining_cost = total_cp_needed
        new_currency = current_currency.copy()
        
        # Use platinum first
        pp_available = new_currency.get('pp', 0)
        pp_used = min(pp_available, remaining_cost // 1000)
        new_currency['pp'] = pp_available - pp_used
        remaining_cost -= pp_used * 1000
        
        # Use gold
        gp_available = new_currency.get('gp', 0)
        gp_used = min(gp_available, remaining_cost // 100)
        new_currency['gp'] = gp_available - gp_used
        remaining_cost -= gp_used * 100
        
        # Use silver
        sp_available = new_currency.get('sp', 0)
        sp_used = min(sp_available, remaining_cost // 10)
        new_currency['sp'] = sp_available - sp_used
        remaining_cost -= sp_used * 10
        
        # Use copper
        cp_available = new_currency.get('cp', 0)
        cp_used = min(cp_available, remaining_cost)
        new_currency['cp'] = cp_available - cp_used
        remaining_cost -= cp_used
        
        self.currency = new_currency
        self.save(update_fields=['currency'])
        
        return True, "Payment successful with automatic currency conversion"
    
    def convert_currency(self, from_type, to_type, amount):
        """
        Convert currency from one denomination to another.
        
        Args:
            from_type: Source currency type ('cp', 'sp', 'gp', 'pp')
            to_type: Target currency type ('cp', 'sp', 'gp', 'pp')  
            amount: Amount of source currency to convert
            
        Returns:
            tuple: (success: bool, converted_amount: int, message: str)
        """
        conversion_rates = {
            'cp': 1,
            'sp': 10,
            'gp': 100,
            'pp': 1000
        }
        
        if from_type not in conversion_rates or to_type not in conversion_rates:
            return False, 0, "Invalid currency type"
        
        current_currency = self.currency or {}
        current_amount = current_currency.get(from_type, 0)
        
        if current_amount < amount:
            return False, 0, f"Insufficient {from_type} to convert"
        
        # Convert to copper, then to target currency
        copper_value = amount * conversion_rates[from_type]
        target_amount = copper_value // conversion_rates[to_type]
        
        # Check if conversion loses value (e.g., converting 5 cp to sp loses 5 cp)
        if target_amount == 0:
            return False, 0, f"Cannot convert {amount} {from_type} to {to_type} - not enough value"
        
        # Perform the conversion
        success, msg = self.remove_currency(from_type, amount)
        if success:
            self.add_currency(to_type, target_amount)
            return True, target_amount, f"Converted {amount} {from_type} to {target_amount} {to_type}"
        
        return False, 0, msg
    
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
