from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import (
    Species, CharacterClass, Background, Spell, Equipment, 
    ClassFeature, Skill, Condition, DamageType
)
from .serializers import (
    SpeciesSerializer, CharacterClassSerializer, BackgroundSerializer,
    SpellSerializer, EquipmentSerializer, ClassFeatureSerializer,
    SkillSerializer, ConditionSerializer, DamageTypeSerializer
)


class ContentViewSetMixin:
    """Mixin for common content viewset functionality."""
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['name']
    ordering = ['name']


class SpeciesViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D species (races)."""
    
    queryset = Species.objects.all()
    serializer_class = SpeciesSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['size', 'creature_type']
    
    @action(detail=False, methods=['get'])
    def by_size(self, request):
        """Get species grouped by size category."""
        sizes = {}
        for species in self.get_queryset():
            size = species.size
            if size not in sizes:
                sizes[size] = []
            sizes[size].append(self.get_serializer(species).data)
        
        return Response(sizes)
    
    @action(detail=True, methods=['get'])
    def traits(self, request, pk=None):
        """Get detailed traits for a specific species."""
        species = self.get_object()
        return Response({
            'species': species.name,
            'traits': species.traits,
            'ability_score_increases': species.ability_score_increases,
            'languages': species.languages,
            'proficiencies': species.proficiencies,
            'movement': {
                'walking_speed': species.speed,
                'other_movement': species.movement_types,
                'summary': species.movement_summary
            }
        })


class CharacterClassViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D character classes."""
    
    queryset = CharacterClass.objects.all().prefetch_related('features', 'skill_proficiencies')
    serializer_class = CharacterClassSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['hit_die', 'subclass_level']
    
    @action(detail=True, methods=['get'])
    def features(self, request, pk=None):
        """Get all features for a character class by level."""
        character_class = self.get_object()
        features_by_level = {}
        
        for feature in character_class.features.all():
            level = feature.level
            if level not in features_by_level:
                features_by_level[level] = []
            features_by_level[level].append({
                'name': feature.name,
                'description': feature.description,
                'uses': feature.uses,
                'recharge': feature.recharge
            })
        
        return Response({
            'class_name': character_class.name,
            'features_by_level': features_by_level,
            'total_levels': len(features_by_level)
        })
    
    @action(detail=True, methods=['get'])
    def progression(self, request, pk=None):
        """Get level progression details for a class."""
        character_class = self.get_object()
        
        progression = {
            'hit_die': character_class.hit_die,
            'primary_abilities': character_class.primary_ability,
            'saving_throws': character_class.saving_throw_proficiencies,
            'skill_choices': character_class.skill_choices,
            'skill_options': [skill.name for skill in character_class.skill_proficiencies.all()],
            'spellcasting': character_class.spellcasting,
            'subclass_info': {
                'name': character_class.subclass_name,
                'level': character_class.subclass_level
            }
        }
        
        return Response(progression)
    
    @action(detail=False, methods=['get'])
    def spellcasters(self, request):
        """Get all spellcasting classes."""
        spellcasters = self.get_queryset().exclude(spellcasting__exact={})
        serializer = self.get_serializer(spellcasters, many=True)
        return Response(serializer.data)


class BackgroundViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D character backgrounds."""
    
    queryset = Background.objects.all().prefetch_related('skill_proficiencies')
    serializer_class = BackgroundSerializer
    search_fields = ['name', 'description', 'feature_name']
    
    @action(detail=True, methods=['get'])
    def proficiencies(self, request, pk=None):
        """Get all proficiencies and bonuses for a background."""
        background = self.get_object()
        
        return Response({
            'background': background.name,
            'ability_score_increases': background.ability_score_increases,
            'skills': [skill.name for skill in background.skill_proficiencies.all()],
            'additional_skill_choices': background.skill_choices,
            'tool_proficiencies': background.tool_proficiencies,
            'languages': background.languages,
            'starting_equipment': background.equipment,
            'starting_gold': background.starting_gold,
            'feature': {
                'name': background.feature_name,
                'description': background.feature_description
            },
            'origin_feats': background.origin_feats
        })
    
    @action(detail=False, methods=['get'])
    def with_feats(self, request):
        """Get backgrounds that offer origin feats."""
        backgrounds_with_feats = self.get_queryset().exclude(origin_feats__exact=[])
        serializer = self.get_serializer(backgrounds_with_feats, many=True)
        return Response(serializer.data)


class SpellViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D spells."""
    
    queryset = Spell.objects.all().prefetch_related('classes')
    serializer_class = SpellSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['level', 'school', 'ritual', 'concentration']
    
    @action(detail=False, methods=['get'])
    def by_class(self, request):
        """Get spells available to a specific class."""
        class_name = request.query_params.get('class', None)
        if not class_name:
            return Response({'error': 'Class parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            character_class = CharacterClass.objects.get(name__iexact=class_name)
            spells = self.get_queryset().filter(classes=character_class)
            serializer = self.get_serializer(spells, many=True)
            return Response(serializer.data)
        except CharacterClass.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def by_level(self, request):
        """Get spells grouped by spell level."""
        level = request.query_params.get('level', None)
        if level is not None:
            spells = self.get_queryset().filter(level=level)
        else:
            spells = self.get_queryset()
        
        spells_by_level = {}
        for spell in spells:
            spell_level = spell.level
            if spell_level not in spells_by_level:
                spells_by_level[spell_level] = []
            spells_by_level[spell_level].append(self.get_serializer(spell).data)
        
        return Response(spells_by_level)


class EquipmentViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D equipment."""
    
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    search_fields = ['name', 'description', 'category']
    filterset_fields = ['category', 'rarity']
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get equipment grouped by category."""
        category = request.query_params.get('category', None)
        if category:
            equipment = self.get_queryset().filter(category__icontains=category)
        else:
            equipment = self.get_queryset()
        
        categories = {}
        for item in equipment:
            cat = item.category
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(self.get_serializer(item).data)
        
        return Response(categories)


class SkillViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D skills."""
    
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['ability']
    
    @action(detail=False, methods=['get'])
    def by_ability(self, request):
        """Get skills grouped by ability score."""
        skills_by_ability = {}
        for skill in self.get_queryset():
            ability = skill.ability
            if ability not in skills_by_ability:
                skills_by_ability[ability] = []
            skills_by_ability[ability].append(self.get_serializer(skill).data)
        
        return Response(skills_by_ability)


class ConditionViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D conditions."""
    
    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer
    search_fields = ['name', 'description']


class DamageTypeViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D damage types."""
    
    queryset = DamageType.objects.all()
    serializer_class = DamageTypeSerializer
    search_fields = ['name', 'description']


class ClassFeatureViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for class features."""
    
    queryset = ClassFeature.objects.all().select_related('character_class')
    serializer_class = ClassFeatureSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['character_class', 'level']
    
    @action(detail=False, methods=['get'])
    def by_class_and_level(self, request):
        """Get features for specific class and level."""
        class_name = request.query_params.get('class')
        level = request.query_params.get('level')
        
        if not class_name or not level:
            return Response(
                {'error': 'Both class and level parameters are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            level = int(level)
            features = self.get_queryset().filter(
                character_class__name__iexact=class_name,
                level__lte=level
            ).order_by('level')
            
            serializer = self.get_serializer(features, many=True)
            return Response(serializer.data)
        except (ValueError, CharacterClass.DoesNotExist):
            return Response(
                {'error': 'Invalid class or level'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
