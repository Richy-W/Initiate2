from rest_framework import serializers
from .models import (
    Species, CharacterClass, Background, Spell, Equipment,
    ClassFeature, Skill, Condition, DamageType
)


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for skills."""
    
    class Meta:
        model = Skill
        fields = ['id', 'name', 'ability', 'description']


class ConditionSerializer(serializers.ModelSerializer):
    """Serializer for conditions."""
    
    class Meta:
        model = Condition
        fields = ['id', 'name', 'description']


class DamageTypeSerializer(serializers.ModelSerializer):
    """Serializer for damage types."""
    
    class Meta:
        model = DamageType
        fields = ['id', 'name', 'description']


class SpeciesSerializer(serializers.ModelSerializer):
    """Serializer for character species."""
    
    movement_summary = serializers.ReadOnlyField()
    has_darkvision = serializers.ReadOnlyField()
    
    class Meta:
        model = Species
        fields = [
            'id', 'name', 'description', 'source', 'page',
            'size', 'speed', 'darkvision', 'has_darkvision',
            'ability_score_increases', 'lifespan', 'traits',
            'languages', 'proficiencies', 'movement_types', 
            'movement_summary', 'creature_type'
        ]


class ClassFeatureSerializer(serializers.ModelSerializer):
    """Serializer for class features."""
    
    character_class_name = serializers.CharField(source='character_class.name', read_only=True)
    
    class Meta:
        model = ClassFeature
        fields = [
            'id', 'name', 'description', 'level',
            'uses', 'recharge', 'character_class_name'
        ]


class CharacterClassSerializer(serializers.ModelSerializer):
    """Serializer for character classes."""
    
    is_spellcaster = serializers.ReadOnlyField()
    spell_slots_at_level = serializers.ReadOnlyField()
    skill_proficiency_options = SkillSerializer(source='skill_proficiencies', many=True, read_only=True)
    features_by_level = serializers.SerializerMethodField()
    
    class Meta:
        model = CharacterClass
        fields = [
            'id', 'name', 'description', 'source', 'page',
            'hit_die', 'primary_ability', 'saving_throw_proficiencies',
            'armor_proficiencies', 'weapon_proficiencies', 'tool_proficiencies',
            'skill_proficiency_options', 'skill_choices', 'spellcasting',
            'starting_equipment', 'starting_wealth', 'subclass_name',
            'subclass_level', 'is_spellcaster', 'spell_slots_at_level',
            'features_by_level'
        ]
    
    def get_features_by_level(self, obj):
        """Get features organized by level."""
        if not hasattr(obj, '_prefetched_features'):
            # If features aren't prefetched, return empty dict to avoid N+1 queries
            return {}
        
        features_by_level = {}
        for feature in obj.features.all():
            level = feature.level
            if level not in features_by_level:
                features_by_level[level] = []
            features_by_level[level].append({
                'name': feature.name,
                'description': feature.description,
                'uses': feature.uses,
                'recharge': feature.recharge
            })
        return features_by_level


class BackgroundSerializer(serializers.ModelSerializer):
    """Serializer for character backgrounds."""
    
    skill_proficiency_list = SkillSerializer(source='skill_proficiencies', many=True, read_only=True)
    total_skill_choices = serializers.ReadOnlyField()
    
    class Meta:
        model = Background
        fields = [
            'id', 'name', 'description', 'source', 'page',
            'ability_score_increases', 'skill_proficiency_list',
            'skill_choices', 'total_skill_choices', 'languages',
            'equipment', 'tool_proficiencies', 'feature_name',
            'feature_description', 'starting_gold', 'origin_feats'
        ]


class SpellSerializer(serializers.ModelSerializer):
    """Serializer for spells."""
    
    class_names = serializers.StringRelatedField(source='classes', many=True, read_only=True)
    
    class Meta:
        model = Spell
        fields = [
            'id', 'name', 'description', 'source', 'page',
            'level', 'school', 'casting_time', 'range', 'components',
            'duration', 'ritual', 'concentration', 'damage_type',
            'class_names'
        ]


class EquipmentSerializer(serializers.ModelSerializer):
    """Serializer for equipment."""
    
    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'description', 'source', 'page',
            'category', 'cost', 'weight', 'properties', 'rarity'
        ]