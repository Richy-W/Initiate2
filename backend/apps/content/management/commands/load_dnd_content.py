import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from apps.content.models import (
    DamageType, Condition, Skill, Species, Background, CharacterClass,
    ClassFeature, Spell, Equipment, Feat, Monster, MagicItem, WeaponProperty
)


class Command(BaseCommand):
    help = 'Load D&D 2024 JSON data into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before loading',
        )
        parser.add_argument(
            '--data-dir',
            type=str,
            help='Path to JSON data directory',
            default=None,
        )

    def handle(self, *args, **options):
        # Find the data directory
        if options['data_dir']:
            data_dir = options['data_dir']
        else:
            # Resolve workspace root (6 levels up from this file), then api/content
            workspace_root = os.path.dirname(
                os.path.dirname(
                    os.path.dirname(
                        os.path.dirname(
                            os.path.dirname(
                                os.path.dirname(os.path.abspath(__file__))
                            )
                        )
                    )
                )
            )
            data_dir = os.path.join(workspace_root, 'api', 'content')
        
        if not os.path.exists(data_dir):
            self.stdout.write(self.style.ERROR(f'Data directory not found: {data_dir}'))
            return

        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Loading D&D 2024 data...')
        
        try:
            with transaction.atomic():
                # Load basic data first
                self.load_damage_types()
                self.load_conditions() 
                self.load_skills()
                
                # Load content data
                self.load_species(data_dir)
                self.load_backgrounds(data_dir)
                self.load_classes(data_dir)
                self.load_equipment(data_dir)
                self.load_weapon_properties(data_dir)
                self.load_feats(data_dir)
                # self.load_spells(data_dir)  # TODO: Implement spells loading
                # self.load_monsters(data_dir)  # TODO: Implement monsters loading
                # self.load_magic_items(data_dir)  # TODO: Implement magic items loading
                
            self.stdout.write(self.style.SUCCESS('Successfully loaded D&D 2024 data'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading data: {str(e)}'))
            raise

    def clear_data(self):
        """Clear existing content data."""
        models_to_clear = [
            ClassFeature, Background, CharacterClass, Species, Equipment, 
            Feat, Spell, Monster, MagicItem, Skill, Condition, DamageType
        ]
        
        for model in models_to_clear:
            count = model.objects.count()
            model.objects.all().delete()
            self.stdout.write(f'Cleared {count} {model.__name__} records')

    def load_damage_types(self):
        """Load standard D&D damage types."""
        damage_types = [
            ('Acid', 'Corrosive damage that dissolves materials'),
            ('Bludgeoning', 'Blunt force trauma from impacts'),
            ('Cold', 'Freezing damage from ice and cold'),
            ('Fire', 'Burning damage from flames and heat'),
            ('Force', 'Pure magical energy damage'),
            ('Lightning', 'Electrical damage from lightning and electricity'),
            ('Necrotic', 'Death magic that withers living tissue'),
            ('Piercing', 'Sharp pointed damage from spears, arrows, etc.'),
            ('Poison', 'Toxic damage from venoms and toxins'),
            ('Psychic', 'Mental damage affecting the mind'),
            ('Radiant', 'Divine light energy damage'),
            ('Slashing', 'Cutting damage from blades and claws'),
            ('Thunder', 'Sonic boom damage from loud sounds'),
        ]
        
        for name, description in damage_types:
            DamageType.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
        
        self.stdout.write(f'Loaded {len(damage_types)} damage types')

    def load_conditions(self):
        """Load standard D&D conditions."""
        conditions = [
            ('Blinded', 'Cannot see; attacks have disadvantage, others have advantage'),
            ('Charmed', 'Cannot attack the charmer; charmer has advantage on social interactions'),
            ('Deafened', 'Cannot hear; automatically fails hearing-based ability checks'),
            ('Frightened', 'Disadvantage on ability checks and attacks while source is in sight'),
            ('Grappled', 'Speed becomes 0; ends if grappler is incapacitated'),
            ('Incapacitated', 'Cannot take actions or reactions'),
            ('Invisible', 'Cannot be seen; attacks have advantage, others have disadvantage'),
            ('Paralyzed', 'Incapacitated and cannot move or speak; auto-fails Str and Dex saves'),
            ('Petrified', 'Transformed into stone; incapacitated and unaware'),
            ('Poisoned', 'Disadvantage on attack rolls and ability checks'),
            ('Prone', 'Can only crawl; disadvantage on attacks; others have advantage on melee'),
            ('Restrained', 'Speed becomes 0; disadvantage on attacks and Dex saves'),
            ('Stunned', 'Incapacitated and cannot move; auto-fails Str and Dex saves'),
            ('Unconscious', 'Incapacitated, cannot move/speak, unaware; prone; auto-fails saves'),
        ]
        
        for name, description in conditions:
            Condition.objects.get_or_create(
                name=name,
                defaults={'description': description}
            )
        
        self.stdout.write(f'Loaded {len(conditions)} conditions')

    def load_skills(self):
        """Load standard D&D skills."""
        skills = [
            ('Acrobatics', 'DEX', 'Balance, tumbling, and aerial maneuvers'),
            ('Animal Handling', 'WIS', 'Calming and controlling animals'),
            ('Arcana', 'INT', 'Knowledge of magic, magical theory, and spells'),
            ('Athletics', 'STR', 'Physical activities like climbing and swimming'),
            ('Deception', 'CHA', 'Lying and misleading others'),
            ('History', 'INT', 'Knowledge of historical events and figures'),
            ('Insight', 'WIS', 'Reading people and understanding motivations'),
            ('Intimidation', 'CHA', 'Threatening and coercing others'),
            ('Investigation', 'INT', 'Logical deduction and finding clues'),
            ('Medicine', 'WIS', 'Treating wounds and diagnosing illnesses'),
            ('Nature', 'INT', 'Knowledge of natural phenomena and creatures'),
            ('Perception', 'WIS', 'Noticing things with your senses'),
            ('Performance', 'CHA', 'Entertaining others through various arts'),
            ('Persuasion', 'CHA', 'Convincing others through reason and charm'),
            ('Religion', 'INT', 'Knowledge of deities, religions, and divine magic'),
            ('Sleight of Hand', 'DEX', 'Manual dexterity and pickpocketing'),
            ('Stealth', 'DEX', 'Moving unseen and unheard'),
            ('Survival', 'WIS', 'Tracking, navigation, and wilderness survival'),
        ]
        
        for name, ability, description in skills:
            Skill.objects.get_or_create(
                name=name,
                defaults={'ability': ability, 'description': description}
            )
        
        self.stdout.write(f'Loaded {len(skills)} skills')

    def load_species(self, data_dir):
        """Load species data from JSON files."""
        species_dir = os.path.join(data_dir, 'species')
        if not os.path.exists(species_dir):
            self.stdout.write(self.style.WARNING('Species directory not found'))
            return
        
        count = 0
        for filename in os.listdir(species_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(species_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    size_raw = data.get('size', 'Medium')
                    size_val = size_raw if isinstance(size_raw, str) else size_raw.get('category', 'Medium')
                    speed_raw = data.get('speed', 30)
                    speed_val = speed_raw if isinstance(speed_raw, int) else speed_raw.get('walk', 30)

                    # Create species from JSON data
                    species, created = Species.objects.update_or_create(
                        name=data.get('name', ''),
                        defaults={
                            'description': data.get('description', ''),
                            'size': size_val,
                            'speed': speed_val,
                            'darkvision': data.get('senses', {}).get('darkvision', data.get('darkvision', 0)),
                            'ability_score_increases': data.get('ability_score_increases', data.get('abilityScoreIncrease', {})),
                            'traits': data.get('traits', []),
                            'languages': data.get('languageProficiencies', []),
                            'proficiencies': data.get('skillProficiencies', {}),
                            'source': data.get('source', data.get('sourceBook', 'Unknown')),
                            'page': data.get('page'),
                        }
                    )
                    
                    if created:
                        count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error loading {filename}: {str(e)}'))
        
        self.stdout.write(f'Loaded {count} species')

    def load_backgrounds(self, data_dir):
        """Load background data from JSON files."""
        backgrounds_dir = os.path.join(data_dir, 'backgrounds')
        if not os.path.exists(backgrounds_dir):
            self.stdout.write(self.style.WARNING('Backgrounds directory not found'))
            return
        
        count = 0
        for filename in os.listdir(backgrounds_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(backgrounds_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Create background from JSON data
                    background, created = Background.objects.get_or_create(
                        name=data.get('name', ''),
                        defaults={
                            'description': data.get('description', ''),
                            'languages': data.get('languageProficiencies', []),
                            'equipment': data.get('equipment', []),
                            'tool_proficiencies': data.get('toolProficiencies', []),
                            'feature_name': data.get('feature', {}).get('name', ''),
                            'feature_description': data.get('feature', {}).get('description', ''),
                            'source': data.get('source', 'Unknown'),
                            'page': data.get('page'),
                        }
                    )
                    
                    # Add skill proficiencies
                    if created and 'skillProficiencies' in data:
                        for skill_name in data['skillProficiencies']:
                            try:
                                skill = Skill.objects.get(name=skill_name)
                                background.skill_proficiencies.add(skill)
                            except Skill.DoesNotExist:
                                pass
                    
                    if created:
                        count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error loading {filename}: {str(e)}'))
        
        self.stdout.write(f'Loaded {count} backgrounds')

    def load_classes(self, data_dir):
        """Load class data from JSON files."""
        classes_dir = os.path.join(data_dir, 'classes')
        if not os.path.exists(classes_dir):
            self.stdout.write(self.style.WARNING('Classes directory not found'))
            return
        
        count = 0
        for filename in os.listdir(classes_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(classes_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Create class from JSON data
                    char_class, created = CharacterClass.objects.get_or_create(
                        name=data.get('name', ''),
                        defaults={
                            'description': data.get('description', ''),
                            'hit_die': data.get('hitDie', 8),
                            'primary_ability': data.get('primaryAbility', []),
                            'saving_throw_proficiencies': data.get('proficiencies', {}).get('savingThrows', []),
                            'armor_proficiencies': data.get('proficiencies', {}).get('armor', []),
                            'weapon_proficiencies': data.get('proficiencies', {}).get('weapons', []),
                            'tool_proficiencies': data.get('proficiencies', {}).get('tools', []),
                            'skill_choices': data.get('proficiencies', {}).get('skillsToChoose', 2),
                            'spellcasting': data.get('spellcasting', {}),
                            'starting_equipment': data.get('equipment', []),
                            'starting_wealth': data.get('startingWealthVariant', {}),
                            'source': data.get('source', 'Unknown'),
                            'page': data.get('page'),
                        }
                    )
                    
                    # Add skill proficiencies
                    if created and 'proficiencies' in data and 'skills' in data['proficiencies']:
                        for skill_name in data['proficiencies']['skills']:
                            try:
                                skill = Skill.objects.get(name=skill_name)
                                char_class.skill_proficiencies.add(skill)
                            except Skill.DoesNotExist:
                                pass
                    
                    # Create class features
                    if created and 'classFeatures' in data:
                        for level, features in data['classFeatures'].items():
                            for feature_data in features:
                                ClassFeature.objects.create(
                                    character_class=char_class,
                                    name=feature_data.get('name', ''),
                                    description=feature_data.get('description', ''),
                                    level=int(level),
                                    uses=feature_data.get('uses', ''),
                                    recharge=feature_data.get('recharge', ''),
                                )
                    
                    if created:
                        count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error loading {filename}: {str(e)}'))
        
        self.stdout.write(f'Loaded {count} classes')

    def load_equipment(self, data_dir):
        """Load equipment data from JSON files."""
        equipment_dir = os.path.join(data_dir, 'equipment')
        if not os.path.exists(equipment_dir):
            self.stdout.write(self.style.WARNING('Equipment directory not found'))
            return
        
        count = 0
        for filename in os.listdir(equipment_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(equipment_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Handle different equipment file structures
                    items = []
                    if isinstance(data, list):
                        items = data
                    elif isinstance(data, dict) and 'equipment' in data:
                        items = data['equipment']
                    elif isinstance(data, dict) and 'items' in data:
                        items = data['items']
                    elif isinstance(data, dict) and 'weapons' in data:
                        items = data['weapons']
                    elif isinstance(data, dict) and 'armor' in data:
                        items = data['armor']
                    elif isinstance(data, dict) and 'tools' in data:
                        items = data['tools']
                    elif isinstance(data, dict) and 'gear' in data:
                        items = data['gear']
                    
                    for item_data in items:
                        if not isinstance(item_data, dict):
                            continue
                            
                        # Determine equipment type
                        eq_type = 'gear'
                        if 'armor' in filename.lower():
                            eq_type = 'armor'
                        elif 'weapon' in filename.lower():
                            eq_type = 'weapon'
                        elif 'tool' in filename.lower():
                            eq_type = 'tool'
                        
                        # Build armor-specific fields from the JSON structure
                        armor_class_val = None
                        dex_bonus_max_val = None
                        strength_req_val = None
                        stealth_disadv = False

                        if eq_type == 'armor':
                            ac_data = item_data.get('armorClass', {})
                            if isinstance(ac_data, dict):
                                armor_class_val = ac_data.get('base')
                                dex_bonus_max_val = ac_data.get('maxDexModifier')
                            elif isinstance(ac_data, int):
                                armor_class_val = ac_data

                            strength_req_val = item_data.get('requirements', {}).get('strength')

                            # Stealth disadvantage is in the effects array
                            for effect in item_data.get('effects', []):
                                if isinstance(effect, dict) and 'stealth' in effect.get('name', '').lower():
                                    stealth_disadv = True
                                    break

                            # Pack extra armor fields (don/doff time, full AC formula) into properties
                            armor_props = []
                            if item_data.get('donDoffTime'):
                                armor_props.append(item_data['donDoffTime'])
                            ac_data = item_data.get('armorClass', {})
                            if isinstance(ac_data, dict) and ac_data.get('formula'):
                                armor_props.append(f"AC: {ac_data['formula']}")
                            if item_data.get('notes'):
                                armor_props.append(item_data['notes'])
                        elif eq_type == 'tool':
                            armor_props = item_data.get('variants', [])
                        else:
                            armor_props = item_data.get('properties', [])

                        # Build damage dict — extend with weapon/tool-specific extras
                        damage_data = dict(item_data.get('damage', {}))
                        if eq_type == 'weapon':
                            if 'versatileDamage' in item_data:
                                damage_data['versatile'] = item_data['versatileDamage']
                            if 'mastery' in item_data:
                                damage_data['mastery'] = item_data['mastery']
                            if 'range' in item_data:
                                damage_data['range'] = item_data['range']
                            if 'ammunition' in item_data:
                                damage_data['ammunition'] = item_data['ammunition']
                        elif eq_type == 'tool':
                            # Store tool-specific fields in the damage JSONField
                            damage_data = {
                                'ability': item_data.get('ability', ''),
                                'utilize': item_data.get('utilize', []),
                                'craft': item_data.get('craft', []),
                            }

                        # Weight may be "Varies" for some tools — default to 0
                        raw_weight = item_data.get('weight', 0)
                        try:
                            weight_val = float(raw_weight)
                        except (TypeError, ValueError):
                            weight_val = 0.0

                        # Create equipment from JSON data
                        equipment, created = Equipment.objects.get_or_create(
                            name=item_data.get('name', ''),
                            defaults={
                                'description': item_data.get('description', ''),
                                'equipment_type': eq_type,
                                'category': item_data.get('category', ''),
                                'cost': item_data.get('cost', {}),
                                'weight': weight_val,
                                'armor_class': armor_class_val,
                                'dex_bonus_max': dex_bonus_max_val,
                                'strength_requirement': strength_req_val,
                                'stealth_disadvantage': stealth_disadv,
                                'damage': damage_data,
                                'properties': armor_props,
                                'tool_type': item_data.get('type', ''),
                                'source': item_data.get('source', 'PHB 2024'),
                                'page': item_data.get('page'),
                            }
                        )
                        if not created:
                            update_fields = []
                            if equipment.armor_class != armor_class_val:
                                equipment.armor_class = armor_class_val
                                update_fields.append('armor_class')
                            if equipment.dex_bonus_max != dex_bonus_max_val:
                                equipment.dex_bonus_max = dex_bonus_max_val
                                update_fields.append('dex_bonus_max')
                            if equipment.strength_requirement != strength_req_val:
                                equipment.strength_requirement = strength_req_val
                                update_fields.append('strength_requirement')
                            if equipment.stealth_disadvantage != stealth_disadv:
                                equipment.stealth_disadvantage = stealth_disadv
                                update_fields.append('stealth_disadvantage')
                            if equipment.damage != damage_data:
                                equipment.damage = damage_data
                                update_fields.append('damage')
                            if equipment.properties != armor_props:
                                equipment.properties = armor_props
                                update_fields.append('properties')
                            new_category = item_data.get('category', '')
                            if equipment.category != new_category:
                                equipment.category = new_category
                                update_fields.append('category')
                            if update_fields:
                                equipment.save(update_fields=update_fields)
                        
                        if created:
                            count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error loading {filename}: {str(e)}'))
        
        self.stdout.write(f'Loaded {count} equipment items')

    def load_weapon_properties(self, data_dir):
        """Load weapon property definitions from weapon-properties.json."""
        filepath = os.path.join(data_dir, 'equipment', 'weapon-properties.json')
        if not os.path.exists(filepath):
            self.stdout.write(self.style.WARNING('weapon-properties.json not found'))
            return

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        source = data.get('sourceBook', "Player's Handbook 2024")
        count = 0

        for prop_key, prop_data in data.get('weaponProperties', {}).items():
            obj, created = WeaponProperty.objects.get_or_create(
                name=prop_key,
                defaults={
                    'property_type': 'weapon',
                    'description': prop_data.get('description', ''),
                    'source': source,
                }
            )
            if not created and obj.description != prop_data.get('description', ''):
                obj.description = prop_data.get('description', '')
                obj.save(update_fields=['description'])
            if created:
                count += 1

        for prop_key, prop_data in data.get('masteryProperties', {}).items():
            obj, created = WeaponProperty.objects.get_or_create(
                name=prop_key,
                defaults={
                    'property_type': 'mastery',
                    'description': prop_data.get('description', ''),
                    'source': source,
                }
            )
            if not created and obj.description != prop_data.get('description', ''):
                obj.description = prop_data.get('description', '')
                obj.save(update_fields=['description'])
            if created:
                count += 1

        self.stdout.write(f'Loaded {count} weapon properties')

    def load_feats(self, data_dir):
        """Load feat data from JSON files."""
        feats_dir = os.path.join(data_dir, 'feats')
        if not os.path.exists(feats_dir):
            self.stdout.write(self.style.WARNING('Feats directory not found'))
            return
        
        count = 0
        for filename in os.listdir(feats_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(feats_dir, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    # Determine feat type
                    feat_type = 'general'
                    if 'boon' in data.get('name', '').lower():
                        feat_type = 'epic_boon'
                    elif 'fighting' in filename.lower():
                        feat_type = 'fighting_style'
                    
                    # Create feat from JSON data
                    feat, created = Feat.objects.get_or_create(
                        name=data.get('name', ''),
                        defaults={
                            'description': data.get('description', ''),
                            'prerequisite': data.get('prerequisite', ''),
                            'ability_score_increase': data.get('abilityScoreIncrease', {}),
                            'benefits': data.get('benefits', []),
                            'feat_type': feat_type,
                            'source': data.get('source', 'Unknown'),
                            'page': data.get('page'),
                        }
                    )
                    
                    if created:
                        count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error loading {filename}: {str(e)}'))
        
        self.stdout.write(f'Loaded {count} feats')