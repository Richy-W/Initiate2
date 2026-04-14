from rest_framework import serializers
from .models import Character, CharacterSpell
from apps.content.serializers import SpeciesSerializer, CharacterClassSerializer, BackgroundSerializer, SkillSerializer


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
            'max_hit_points', 'current_hit_points', 'temporary_hit_points',
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
            'backstory', 'notes', 'carrying_capacity'
        ]


class CharacterCreateSerializer(serializers.ModelSerializer):
    """Serializer for character creation with validation."""
    
    class Meta:
        model = Character
        fields = [
            'name', 'species', 'character_class', 'background',
            'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
            'personality_traits', 'ideals', 'bonds', 'flaws', 'backstory'
        ]
    
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
        """Create character with calculated initial values."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"Creating character with validated data: {validated_data}")
        
        try:
            character = Character(**validated_data)
            
            # Calculate initial hit points
            character.max_hit_points = character.hit_point_maximum
            character.current_hit_points = character.max_hit_points
            
            # Set initial armor class (10 + Dex modifier)
            character.armor_class = 10 + character.dexterity_modifier
            
            character.save()
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