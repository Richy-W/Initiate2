import json
from pathlib import Path

from rest_framework import serializers
from .models import (
    Species, CharacterClass, Background, Spell, Equipment,
    ClassFeature, Skill, Condition, DamageType,
    HomebrewContent, ContentSharingPermission
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
            'pk', 'id', 'name', 'description', 'source', 'page',
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
            'pk', 'id', 'name', 'description', 'source', 'page',
            'hit_die', 'primary_ability', 'saving_throw_proficiencies',
            'armor_proficiencies', 'weapon_proficiencies', 'tool_proficiencies',
            'skill_proficiency_options', 'skill_choices', 'spellcasting',
            'starting_equipment', 'starting_wealth', 'subclass_name',
            'subclass_level', 'is_spellcaster', 'spell_slots_at_level',
            'features_by_level'
        ]
    
    def get_features_by_level(self, obj):
        """Get features organized by level."""
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

        if features_by_level:
            return features_by_level

        # Fallback to bundled class JSON when DB rows are unavailable.
        class_slug = obj.name.strip().lower().replace(' ', '-').replace("'", '')
        repo_root = Path(__file__).resolve().parents[3]
        class_json_path = repo_root / 'api' / 'content' / 'classes' / f'{class_slug}.json'

        if not class_json_path.exists():
            return {}

        try:
            with class_json_path.open('r', encoding='utf-8') as fp:
                payload = json.load(fp)

            raw_features = payload.get('classFeatures', {})
            fallback_by_level = {}

            for level_key, level_value in raw_features.items():
                try:
                    level = int(level_key)
                except (TypeError, ValueError):
                    continue

                if isinstance(level_value, dict):
                    level_features = level_value.get('features', [])
                elif isinstance(level_value, list):
                    level_features = level_value
                else:
                    level_features = []

                normalized = []
                for feature_data in level_features:
                    if isinstance(feature_data, str):
                        normalized.append({
                            'name': feature_data,
                            'description': '',
                            'uses': '',
                            'recharge': ''
                        })
                        continue

                    if isinstance(feature_data, dict):
                        normalized.append({
                            'name': feature_data.get('name', ''),
                            'description': feature_data.get('description', ''),
                            'uses': feature_data.get('uses', ''),
                            'recharge': feature_data.get('recharge', ''),
                        })

                if normalized:
                    fallback_by_level[level] = normalized

            return fallback_by_level
        except Exception:
            return {}


class BackgroundSerializer(serializers.ModelSerializer):
    """Serializer for character backgrounds."""
    
    skill_proficiency_list = SkillSerializer(source='skill_proficiencies', many=True, read_only=True)
    total_skill_choices = serializers.ReadOnlyField()
    feat = serializers.SerializerMethodField()
    
    class Meta:
        model = Background
        fields = [
            'pk', 'id', 'name', 'description', 'source', 'page',
            'ability_score_increases', 'skill_proficiency_list',
            'skill_choices', 'total_skill_choices', 'languages',
            'equipment', 'tool_proficiencies', 'feature_name',
            'feature_description', 'starting_gold', 'origin_feats', 'feat'
        ]

    def get_feat(self, obj):
        """Return a single feat dict for this background. Reads origin_feats first,
        then falls back to the bundled JSON file."""
        if obj.origin_feats:
            for entry in obj.origin_feats:
                if isinstance(entry, dict) and entry.get('name'):
                    return entry
                if isinstance(entry, str) and entry:
                    return {'name': entry, 'description': ''}

        slug = obj.name.strip().lower().replace(' ', '-').replace("'", '')
        repo_root = Path(__file__).resolve().parents[3]
        json_path = repo_root / 'api' / 'content' / 'backgrounds' / f'{slug}.json'
        if json_path.exists():
            try:
                with json_path.open('r', encoding='utf-8') as fp:
                    data = json.load(fp)
                return data.get('feat') or None
            except Exception:
                pass
        return None


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
            'equipment_type', 'category', 'cost', 'weight', 'rarity',
            'armor_class', 'dex_bonus_max', 'strength_requirement', 'stealth_disadvantage',
            'damage', 'properties', 'tool_type'
        ]

class HomebrewContentSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = HomebrewContent
        fields = [
            'id', 'creator', 'creator_username', 'content_type', 'name',
            'description', 'data', 'dependencies', 'version', 'status', 'is_public',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'creator', 'version', 'created_at', 'updated_at']

    def validate_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('data must be an object.')
        return value

    def validate_dependencies(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('dependencies must be a list.')
        return value


class ContentSharingPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentSharingPermission
        fields = ['id', 'content', 'campaign', 'user', 'permission_type', 'granted_at']
        read_only_fields = ['id', 'granted_at']
