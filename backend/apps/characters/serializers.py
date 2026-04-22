from rest_framework import serializers
from .models import Character, CharacterSpell
from apps.content.serializers import SpeciesSerializer, CharacterClassSerializer, BackgroundSerializer, SkillSerializer
import json
from pathlib import Path


class CharacterSerializer(serializers.ModelSerializer):
    """Basic character serializer for list views."""
    
    species_name = serializers.CharField(source='species.name', read_only=True)
    class_name = serializers.CharField(source='character_class.name', read_only=True)
    background_name = serializers.CharField(source='background.name', read_only=True)
    owner_username = serializers.CharField(source='user.username', read_only=True)
    
    # Calculated properties
    proficiency_bonus = serializers.ReadOnlyField()
    initiative = serializers.ReadOnlyField()
    speed = serializers.ReadOnlyField()
    hit_point_maximum = serializers.ReadOnlyField()
    
    class Meta:
        model = Character
        fields = [
            'id', 'name', 'level', 'experience_points',
            'species', 'species_name', 'character_class', 'class_name',
            'background', 'background_name', 'owner_username',
            'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
            'max_hit_points', 'current_hit_points', 'temporary_hit_points',
            'currency',
            'hit_point_maximum', 'armor_class', 'proficiency_bonus',
            'initiative', 'speed', 'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate character creation data."""
        if data.get('level', 1) < 1 or data.get('level', 1) > 20:
            raise serializers.ValidationError("Level must be between 1 and 20")
        
        # Validate ability scores
        ability_scores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
        for ability in ability_scores:
            score = data.get(ability, 10)
            if score < 1 or score > 20:
                raise serializers.ValidationError(f"{ability.title()} must be between 1 and 20")
        
        return data


class CharacterDetailSerializer(CharacterSerializer):
    """Detailed character serializer with full information."""
    
    species_detail = SpeciesSerializer(source='species', read_only=True)
    class_detail = CharacterClassSerializer(source='character_class', read_only=True)
    background_detail = BackgroundSerializer(source='background', read_only=True)
    
    skill_proficiencies_detail = SkillSerializer(source='skill_proficiencies', many=True, read_only=True)
    skill_expertises_detail = SkillSerializer(source='skill_expertises', many=True, read_only=True)
    
    # All ability scores and modifiers
    total_strength = serializers.ReadOnlyField()
    total_dexterity = serializers.ReadOnlyField()
    total_constitution = serializers.ReadOnlyField()
    total_intelligence = serializers.ReadOnlyField()
    total_wisdom = serializers.ReadOnlyField()
    total_charisma = serializers.ReadOnlyField()
    
    strength_modifier = serializers.ReadOnlyField()
    dexterity_modifier = serializers.ReadOnlyField()
    constitution_modifier = serializers.ReadOnlyField()
    intelligence_modifier = serializers.ReadOnlyField()
    wisdom_modifier = serializers.ReadOnlyField()
    charisma_modifier = serializers.ReadOnlyField()
    
    carrying_capacity = serializers.ReadOnlyField()
    
    # Encumbrance calculations
    total_weight = serializers.ReadOnlyField()
    encumbrance_status = serializers.ReadOnlyField()
    encumbrance_effects = serializers.ReadOnlyField()
    effective_speed = serializers.ReadOnlyField()
    is_encumbered = serializers.ReadOnlyField()
    
    # Equipped items details
    equipped_items_details = serializers.SerializerMethodField()
    calculated_armor_class = serializers.ReadOnlyField()
    
    def get_equipped_items_details(self, obj):
        """Get detailed information about equipped items."""
        return obj.get_equipped_items_details()
    
    class Meta(CharacterSerializer.Meta):
        fields = CharacterSerializer.Meta.fields + [
            'species_detail', 'class_detail', 'background_detail',
            'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
            'total_strength', 'total_dexterity', 'total_constitution',
            'total_intelligence', 'total_wisdom', 'total_charisma',
            'strength_modifier', 'dexterity_modifier', 'constitution_modifier',
            'intelligence_modifier', 'wisdom_modifier', 'charisma_modifier',
            'skill_proficiencies', 'skill_proficiencies_detail',
            'skill_expertises', 'skill_expertises_detail',
            'saving_throw_proficiencies', 'equipment', 'features', 'spells_known',
            'personality_traits', 'ideals', 'bonds', 'flaws',
            'backstory', 'notes', 'carrying_capacity', 'total_weight',
            'encumbrance_status', 'encumbrance_effects', 'effective_speed', 'is_encumbered',
            'equipped_items_details', 'calculated_armor_class'
        ]


class CharacterCreateSerializer(serializers.ModelSerializer):
    """Serializer for character creation with validation."""

    selected_skills = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        write_only=True,
        default=list,
    )
    selected_class_equipment = serializers.JSONField(required=False, write_only=True, allow_null=True)
    selected_background_equipment = serializers.JSONField(required=False, write_only=True, allow_null=True)
    selected_class_equipment_option = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    selected_background_equipment_option = serializers.CharField(required=False, write_only=True, allow_blank=True, allow_null=True)
    selected_species_options = serializers.JSONField(required=False, write_only=True, allow_null=True)
    
    class Meta:
        model = Character
        fields = [
            'id',
            'name', 'species', 'character_class', 'background',
            'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
            'personality_traits', 'ideals', 'bonds', 'flaws', 'backstory',
            'selected_skills', 'selected_class_equipment', 'selected_background_equipment',
            'selected_class_equipment_option', 'selected_background_equipment_option', 'selected_species_options'
        ]
        read_only_fields = ['id']
    
    def validate(self, data):
        """Validate character creation data with detailed logging."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Character validation data: {data}")
        
        # Check that foreign keys exist
        try:
            from apps.content.models import Species, CharacterClass, Background
            
            if 'species' in data:
                if not Species.objects.filter(id=data['species'].id if hasattr(data['species'], 'id') else data['species']).exists():
                    logger.error(f"Species not found: {data['species']}")
                    raise serializers.ValidationError(f"Species '{data['species']}' not found")
                    
            if 'character_class' in data:
                class_id = data['character_class'].id if hasattr(data['character_class'], 'id') else data['character_class']
                if not CharacterClass.objects.filter(id=class_id).exists():
                    logger.error(f"Character class not found: {data['character_class']}")
                    raise serializers.ValidationError(f"Character class '{data['character_class']}' not found")
                    
            if 'background' in data:
                bg_id = data['background'].id if hasattr(data['background'], 'id') else data['background']
                if not Background.objects.filter(id=bg_id).exists():
                    logger.error(f"Background not found: {data['background']}")
                    raise serializers.ValidationError(f"Background '{data['background']}' not found")
        
        except Exception as e:
            logger.error(f"Foreign key validation error: {e}")
            raise serializers.ValidationError(f"Database validation error: {str(e)}")
        
        # Validate ability scores 
        ability_scores = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
        for ability in ability_scores:
            score = data.get(ability)
            if score is not None:
                if score < 1 or score > 20:
                    logger.error(f"Invalid {ability} score: {score}")
                    raise serializers.ValidationError(f"{ability.title()} must be between 1 and 20, got {score}")
        
        logger.info("Character validation passed")
        return data
    
    def create(self, validated_data):
        """Create character with calculated initial values and selected build choices."""
        import logging
        from apps.content.models import Skill
        logger = logging.getLogger(__name__)

        selected_skills = validated_data.pop('selected_skills', []) or []
        selected_class_equipment = validated_data.pop('selected_class_equipment', None) or {}
        selected_background_equipment = validated_data.pop('selected_background_equipment', None) or {}
        selected_class_equipment_option = (validated_data.pop('selected_class_equipment_option', None) or '').strip()
        selected_background_equipment_option = (validated_data.pop('selected_background_equipment_option', None) or '').strip()
        selected_species_options = validated_data.pop('selected_species_options', None) or {}
        
        logger.info(f"Creating character with validated data: {validated_data}")
        
        try:
            character = Character(**validated_data)
            
            # Calculate initial hit points
            character.max_hit_points = character.hit_point_maximum
            character.current_hit_points = character.max_hit_points
            
            # Set initial armor class (10 + Dex modifier)
            character.armor_class = 10 + character.dexterity_modifier

            # Class saving throw proficiencies.
            class_save_profs = character.character_class.saving_throw_proficiencies or []
            normalized_save_profs = [str(save).strip().lower() for save in class_save_profs if str(save).strip()]
            character.saving_throw_proficiencies = normalized_save_profs

            # Build starting features from background and class progression.
            features = []

            if character.background.feature_name:
                features.append({
                    'name': character.background.feature_name,
                    'description': character.background.feature_description,
                    'source': 'Background',
                })

            for class_feature in character.character_class.features.filter(level__lte=character.level):
                features.append({
                    'name': class_feature.name,
                    'description': class_feature.description,
                    'source': f'Class {character.character_class.name}',
                    'level': class_feature.level,
                    'uses': class_feature.uses,
                    'recharge': class_feature.recharge,
                })

            if character.background.origin_feats:
                for feat in character.background.origin_feats:
                    if isinstance(feat, str):
                        feat_name = feat
                        feat_desc = ''
                    elif isinstance(feat, dict):
                        feat_name = feat.get('name') or feat.get('title') or feat.get('id')
                        feat_desc = feat.get('description', '')
                    else:
                        feat_name = None
                        feat_desc = ''

                    if feat_name:
                        features.append({
                            'name': feat_name,
                            'description': feat_desc,
                            'source': 'Origin Feat',
                        })

            # Fall back to JSON file to load feat data if origin_feats is empty in DB
            if not any(f.get('source') == 'Origin Feat' for f in features if isinstance(f, dict)):
                from pathlib import Path as _Path
                bg_slug = str(character.background.name or '').strip().lower().replace(' ', '-').replace("'", '')
                bg_json_path = _Path(__file__).resolve().parents[3] / 'api' / 'content' / 'backgrounds' / f'{bg_slug}.json'
                if bg_json_path.exists():
                    try:
                        import json as _json
                        with bg_json_path.open('r', encoding='utf-8') as _fp:
                            bg_json = _json.load(_fp)
                        feat_data = bg_json.get('feat')
                        if feat_data and isinstance(feat_data, dict) and feat_data.get('name'):
                            features.append({
                                'name': feat_data['name'],
                                'description': feat_data.get('description', ''),
                                'source': 'Origin Feat',
                            })
                    except Exception:
                        pass

            character.features = features

            # Apply Tough feat HP bonus: +2 at level 1, +1 per additional level = level+1 total
            has_tough = any(
                isinstance(f, dict) and (f.get('name') or '').lower() == 'tough'
                for f in character.features
            )
            if has_tough:
                tough_bonus = character.level + 1  # level 1 = +2, level 2 = +3, etc.
                character.max_hit_points += tough_bonus
                character.current_hit_points = character.max_hit_points

            # Build starting equipment and gold/currency.
            equipment_items = []
            default_currency = {'cp': 0, 'sp': 0, 'ep': 0, 'gp': 0, 'pp': 0}

            def _slugify(value):
                return str(value or '').strip().lower().replace("'", '').replace(' ', '-')

            def _load_content_json(content_dir, name):
                if not name:
                    return {}
                repo_root = Path(__file__).resolve().parents[3]
                payload_path = repo_root / 'api' / 'content' / content_dir / f"{_slugify(name)}.json"
                if not payload_path.exists():
                    return {}
                try:
                    with payload_path.open('r', encoding='utf-8') as fp:
                        return json.load(fp)
                except Exception:
                    return {}

            def _normalize_choice_payload(raw, option_code=''):
                """Normalize many payload shapes into {'items': [...], 'gold': n}."""
                if isinstance(raw, dict) and 'items' in raw:
                    return {
                        'items': raw.get('items') or [],
                        'gold': int(raw.get('gold', 0) or 0),
                    }

                if isinstance(raw, dict) and 'options' in raw and isinstance(raw.get('options'), list):
                    options = raw.get('options') or []
                    selected = None
                    if option_code:
                        selected = next((opt for opt in options if str(opt.get('choice', '')).upper() == option_code.upper()), None)
                    if not selected and options:
                        selected = options[0]
                    if isinstance(selected, dict):
                        return {
                            'items': selected.get('items') or [],
                            'gold': int(selected.get('gold', 0) or 0),
                        }

                if isinstance(raw, list):
                    return {'items': raw, 'gold': 0}

                return {'items': [], 'gold': 0}

            def add_equipment_from_value(value):
                if isinstance(value, str):
                    trimmed = value.strip()
                    if not trimmed:
                        return

                    # Unpack stringified list/dict payloads instead of storing raw JSON text.
                    if (trimmed.startswith('[') and trimmed.endswith(']')) or (
                        trimmed.startswith('{') and trimmed.endswith('}')
                    ):
                        try:
                            parsed = json.loads(trimmed)
                            add_equipment_from_value(parsed)
                            return
                        except Exception:
                            try:
                                normalized = (
                                    trimmed.replace('None', 'null')
                                    .replace('True', 'true')
                                    .replace('False', 'false')
                                    .replace("'", '"')
                                )
                                parsed = json.loads(normalized)
                                add_equipment_from_value(parsed)
                                return
                            except Exception:
                                pass

                    equipment_items.append({'name': trimmed, 'quantity': 1})
                    return

                if isinstance(value, dict):
                    if isinstance(value.get('items'), list):
                        add_equipment_from_value(value.get('items'))
                        return

                    if value.get('name'):
                        equipment_items.append({
                            'name': value.get('name'),
                            'quantity': int(value.get('quantity', 1) or 1),
                            **({'item_type': value.get('item_type')} if value.get('item_type') else {}),
                            **({'weapon_type': value.get('weapon_type')} if value.get('weapon_type') else {}),
                        })
                    return

                if isinstance(value, list):
                    for item in value:
                        add_equipment_from_value(item)

            class_json = _load_content_json('classes', character.character_class.name)
            background_json = _load_content_json('backgrounds', character.background.name)
            species_json = _load_content_json('species', character.species.name)
            selected_variant = str(selected_species_options.get('variant', '') or '').strip()
            selected_skill_choice = str(selected_species_options.get('skillChoice', '') or '').strip()
            selected_spellcasting_ability = str(selected_species_options.get('spellcastingAbility', '') or '').strip()
            selected_size = str(selected_species_options.get('sizeCategory', '') or '').strip()
            selected_feat = str(selected_species_options.get('featChoice', '') or '').strip()

            variants = species_json.get('variants') or []
            variant_match = next(
                (
                    variant
                    for variant in variants
                    if str(variant.get('name', '')).strip().lower() == selected_variant.lower()
                ),
                None,
            )

            if variant_match:
                features.append({
                    'name': f"{character.species.name} Variant: {variant_match.get('name')}",
                    'description': variant_match.get('description', ''),
                    'source': 'Species',
                })

                for variant_trait in variant_match.get('traits') or []:
                    if isinstance(variant_trait, dict) and variant_trait.get('name'):
                        features.append({
                            'name': variant_trait.get('name'),
                            'description': variant_trait.get('description', ''),
                            'source': f"{character.species.name} Variant",
                        })

            if selected_spellcasting_ability:
                features.append({
                    'name': 'Species Spellcasting Ability Choice',
                    'description': selected_spellcasting_ability,
                    'source': 'Species Choice',
                })

            if selected_size:
                features.append({
                    'name': 'Species Size Choice',
                    'description': selected_size,
                    'source': 'Species Choice',
                })

            # Unpack Magic Initiate choices before building the feat feature
            mi_spell_list = str(selected_species_options.get('magicInitiateSpellList', '') or '').strip()
            mi_ability = str(selected_species_options.get('magicInitiateAbility', '') or '').strip()
            mi_cantrip1 = str(selected_species_options.get('magicInitiateCantrip1', '') or '').strip()
            mi_cantrip2 = str(selected_species_options.get('magicInitiateCantrip2', '') or '').strip()
            mi_spell1 = str(selected_species_options.get('magicInitiateSpell1', '') or '').strip()

            if selected_feat == 'Magic Initiate':
                mi_parts = []
                if mi_spell_list:
                    mi_parts.append(f"Spell List: {mi_spell_list}")
                if mi_ability:
                    mi_parts.append(f"Spellcasting Ability: {mi_ability}")
                if mi_cantrip1:
                    mi_parts.append(f"Cantrip: {mi_cantrip1}")
                if mi_cantrip2:
                    mi_parts.append(f"Cantrip: {mi_cantrip2}")
                if mi_spell1:
                    mi_parts.append(f"1st-Level Spell: {mi_spell1}")
                features.append({
                    'name': 'Magic Initiate',
                    'description': '; '.join(mi_parts),
                    'source': 'Feat',
                })
            elif selected_feat:
                features.append({
                    'name': f"Species Feat Choice: {selected_feat}",
                    'description': '',
                    'source': 'Feat',
                })

            # T017: Unpack new species-option keys
            selected_skillful_choice = str(selected_species_options.get('skillfulChoice', '') or '').strip()
            skilled_skill_choices = [
                str(v).strip()
                for v in (selected_species_options.get('skilledSkillChoices') or [])
                if str(v).strip()
            ]
            skilled_tool_choices = [
                str(v).strip()
                for v in (selected_species_options.get('skilledToolChoices') or [])
                if str(v).strip()
            ]

            # T018: Add Skillful + Skilled skills to selected_skills (with deduplication)
            if selected_skillful_choice and selected_skillful_choice not in selected_skills:
                selected_skills.append(selected_skillful_choice)
            for skill_name in skilled_skill_choices:
                if skill_name not in selected_skills:
                    selected_skills.append(skill_name)

            if selected_skill_choice and selected_skill_choice not in selected_skills:
                selected_skills.append(selected_skill_choice)

            class_choice_payload = _normalize_choice_payload(selected_class_equipment, selected_class_equipment_option)
            if not class_choice_payload['items'] and not class_choice_payload['gold']:
                class_choice_payload = _normalize_choice_payload(
                    class_json.get('startingEquipment') or character.character_class.starting_equipment,
                    selected_class_equipment_option,
                )

            background_choice_payload = _normalize_choice_payload(selected_background_equipment, selected_background_equipment_option)
            if not background_choice_payload['items'] and not background_choice_payload['gold']:
                background_choice_payload = _normalize_choice_payload(
                    background_json.get('startingEquipment') or character.background.equipment,
                    selected_background_equipment_option,
                )

            # Preserve legacy background equipment payload if it's a flat list.
            add_equipment_from_value(character.background.equipment)
            add_equipment_from_value(class_choice_payload.get('items', []))
            add_equipment_from_value(background_choice_payload.get('items', []))

            character.equipment = equipment_items

            currency = default_currency.copy()
            background_gold = int(character.background.starting_gold or 0)
            class_gold = int(class_choice_payload.get('gold', 0) or 0)
            selected_bg_gold = int(background_choice_payload.get('gold', 0) or 0)

            if class_gold == 0:
                class_gold = int((class_json.get('startingWealthVariant') or {}).get('gp', 0) or 0)

            if selected_bg_gold == 0:
                selected_bg_gold = int(background_json.get('startingEquipment', {}).get('gold', 0) or 0)
            currency['gp'] = background_gold + class_gold + selected_bg_gold
            character.currency = currency
            
            character.save()

            # Background fixed skill proficiencies.
            if character.background and hasattr(character.background, 'skill_proficiencies'):
                for skill in character.background.skill_proficiencies.all():
                    character.skill_proficiencies.add(skill)

            # Selected class skills from the creation flow.
            for skill_name in selected_skills:
                skill_obj = Skill.objects.filter(name__iexact=str(skill_name).strip()).first()
                if skill_obj:
                    character.skill_proficiencies.add(skill_obj)

            # T019: Persist Skilled tool proficiencies (deduplication guard).
            existing_tools = list(character.tool_proficiencies or [])
            for tool_name in skilled_tool_choices:
                if tool_name not in existing_tools:
                    existing_tools.append(tool_name)
            character.tool_proficiencies = existing_tools

            # Persist Magic Initiate cantrips and spell into spells_known
            if selected_feat == 'Magic Initiate':
                mi_spells = []
                for cantrip_name in [mi_cantrip1, mi_cantrip2]:
                    if cantrip_name:
                        mi_spells.append({
                            'name': cantrip_name,
                            'level': 0,
                            'source': 'Magic Initiate',
                            'prepared': True,
                            'spellcasting_ability': mi_ability,
                        })
                if mi_spell1:
                    mi_spells.append({
                        'name': mi_spell1,
                        'level': 1,
                        'source': 'Magic Initiate',
                        'prepared': True,
                        'spellcasting_ability': mi_ability,
                    })
                if mi_spells:
                    existing_spells = list(character.spells_known or [])
                    existing_spells.extend(mi_spells)
                    character.spells_known = existing_spells

            character.save(update_fields=['tool_proficiencies', 'spells_known'])

            logger.info(f"Character created successfully: {character.id}")
            return character
            
        except Exception as e:
            logger.error(f"Character creation error: {e}")
            raise serializers.ValidationError(f"Failed to create character: {str(e)}")


class CharacterSpellSerializer(serializers.ModelSerializer):
    """Serializer for character spells."""
    
    spell_name = serializers.CharField(source='spell.name', read_only=True)
    spell_level = serializers.IntegerField(source='spell.level', read_only=True)
    spell_school = serializers.CharField(source='spell.school', read_only=True)
    character_name = serializers.CharField(source='character.name', read_only=True)
    
    class Meta:
        model = CharacterSpell
        fields = [
            'id', 'character', 'character_name', 'spell', 'spell_name',
            'spell_level', 'spell_school', 'is_prepared', 'is_always_prepared',
            'notes'
        ]
        read_only_fields = ['id']
    
    def validate(self, data):
        """Validate character spell assignment."""
        character = data['character']
        spell = data['spell']
        
        # Check if character's class can learn this spell
        if not spell.classes.filter(id=character.character_class.id).exists():
            raise serializers.ValidationError(
                f"{character.character_class.name} cannot learn {spell.name}"
            )
        
        return data


class CharacterAbilityCheckSerializer(serializers.Serializer):
    """Serializer for ability check requests."""
    
    ability = serializers.ChoiceField(choices=[
        'strength', 'dexterity', 'constitution', 
        'intelligence', 'wisdom', 'charisma'
    ])
    skill = serializers.CharField(required=False, allow_blank=True)
    advantage = serializers.BooleanField(default=False)
    disadvantage = serializers.BooleanField(default=False)
    modifier = serializers.IntegerField(default=0, help_text="Additional modifier to add")
    
    def validate(self, data):
        """Validate ability check data."""
        if data.get('advantage') and data.get('disadvantage'):
            raise serializers.ValidationError("Cannot have both advantage and disadvantage")
        return data


class CharacterSavingThrowSerializer(serializers.Serializer):
    """Serializer for saving throw requests."""
    
    ability = serializers.ChoiceField(choices=[
        'strength', 'dexterity', 'constitution', 
        'intelligence', 'wisdom', 'charisma'
    ])
    advantage = serializers.BooleanField(default=False)
    disadvantage = serializers.BooleanField(default=False)
    modifier = serializers.IntegerField(default=0, help_text="Additional modifier to add")
    
    def validate(self, data):
        """Validate saving throw data."""
        if data.get('advantage') and data.get('disadvantage'):
            raise serializers.ValidationError("Cannot have both advantage and disadvantage")
        return data