import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from apps.content.models import (
    DamageType, Condition, Skill, Species, Background, CharacterClass,
    ClassFeature, Spell, Equipment, Feat, Monster, MagicItem
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
            # Look for data in project root
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            data_dir = project_root
        
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
                    
                    # Create species from JSON data
                    species, created = Species.objects.get_or_create(
                        name=data.get('name', ''),
                        defaults={
                            'description': data.get('description', ''),
                            'size': data.get('size', 'Medium'),
                            'speed': data.get('speed', {}).get('walk', 30),
                            'darkvision': data.get('darkvision', 0),
                            'ability_score_increases': data.get('abilityScoreIncrease', {}),
                            'traits': data.get('traits', []),
                            'languages': data.get('languageProficiencies', []),
                            'proficiencies': data.get('skillProficiencies', {}),
                            'source': data.get('source', 'Unknown'),
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
                        
                        # Create equipment from JSON data
                        equipment, created = Equipment.objects.get_or_create(
                            name=item_data.get('name', ''),
                            defaults={
                                'description': item_data.get('description', ''),
                                'equipment_type': eq_type,
                                'cost': item_data.get('cost', {}),
                                'weight': item_data.get('weight', 0),
                                'armor_class': item_data.get('armorClass'),
                                'dex_bonus_max': item_data.get('dexBonusMax'),
                                'strength_requirement': item_data.get('strengthRequirement'),
                                'stealth_disadvantage': item_data.get('stealthDisadvantage', False),
                                'damage': item_data.get('damage', {}),
                                'properties': item_data.get('properties', []),
                                'tool_type': item_data.get('type', ''),
                                'source': item_data.get('source', 'Unknown'),
                                'page': item_data.get('page'),
                            }
                        )
                        
                        if created:
                            count += 1
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error loading {filename}: {str(e)}'))
        
        self.stdout.write(f'Loaded {count} equipment items')

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