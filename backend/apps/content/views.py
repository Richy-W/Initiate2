from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from apps.common.audit import log_audit_event

from .models import (
    Species, CharacterClass, Background, Spell, Equipment, 
    ClassFeature, Skill, Condition, DamageType,
    HomebrewContent, ContentSharingPermission,
)
from .serializers import (
    SpeciesSerializer, CharacterClassSerializer, BackgroundSerializer,
    SpellSerializer, EquipmentSerializer, ClassFeatureSerializer,
    SkillSerializer, ConditionSerializer, DamageTypeSerializer,
    HomebrewContentSerializer, ContentSharingPermissionSerializer,
)


class ContentViewSetMixin:
    """Mixin for common content viewset functionality."""
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['name']
    ordering = ['name']
    cache_timeout_seconds = 60

    def _cache_key(self, request):
        return f"content:{self.__class__.__name__}:{self.action}:{request.get_full_path()}"

    def list(self, request, *args, **kwargs):
        cache_key = self._cache_key(request)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            cache.set(cache_key, response.data, self.cache_timeout_seconds)
        return response

    def retrieve(self, request, *args, **kwargs):
        cache_key = self._cache_key(request)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        response = super().retrieve(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            cache.set(cache_key, response.data, self.cache_timeout_seconds)
        return response


@extend_schema(tags=['content'])
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


@extend_schema(tags=['content'])
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


@extend_schema(tags=['content'])
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


@extend_schema(tags=['content'])
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


@extend_schema(tags=['content'])
class EquipmentViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D equipment."""
    
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    search_fields = ['name', 'description', 'category', 'equipment_type']
    filterset_fields = ['equipment_type', 'category', 'rarity']
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get equipment grouped by equipment type."""
        equipment_type = request.query_params.get('type', None)
        if equipment_type:
            equipment = self.get_queryset().filter(equipment_type=equipment_type)
        else:
            equipment = self.get_queryset()
        
        types = {}
        for item in equipment:
            eq_type = item.equipment_type
            if eq_type not in types:
                types[eq_type] = []
            types[eq_type].append(self.get_serializer(item).data)
        
        return Response(types)
    
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


@extend_schema(tags=['content'])
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


@extend_schema(tags=['content'])
class ConditionViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D conditions."""
    
    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer
    search_fields = ['name', 'description']


@extend_schema(tags=['content'])
class DamageTypeViewSet(ContentViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoints for D&D damage types."""
    
    queryset = DamageType.objects.all()
    serializer_class = DamageTypeSerializer
    search_fields = ['name', 'description']


@extend_schema(tags=['content'])
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


@extend_schema(tags=['homebrew'])
class HomebrewContentViewSet(viewsets.ModelViewSet):
    """API endpoints for homebrew content management."""

    serializer_class = HomebrewContentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'updated_at', 'version']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return HomebrewContent.objects.filter(is_public=True, status='published')
        return HomebrewContent.objects.filter(
            Q(creator=user) | Q(is_public=True, status='published')
        )

    def perform_create(self, serializer):
        instance = serializer.save(creator=self.request.user)
        log_audit_event(
            request=self.request,
            action='homebrew.create',
            target=instance,
            metadata={
                'content_type': instance.content_type,
                'name': instance.name,
            },
        )

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        obj = self.get_object()
        if obj.creator != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        obj.publish_new_version()
        log_audit_event(
            request=request,
            action='homebrew.publish',
            target=obj,
            metadata={'version': obj.version},
        )
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def new_version(self, request, pk=None):
        obj = self.get_object()
        if obj.creator != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        obj.version += 1
        obj.status = 'draft'
        if 'data' in request.data:
            obj.data = request.data.get('data')
        if 'dependencies' in request.data:
            obj.dependencies = request.data.get('dependencies')
        obj.save()
        log_audit_event(
            request=request,
            action='homebrew.new_version',
            target=obj,
            metadata={'version': obj.version},
        )
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        obj = self.get_object()
        if obj.creator != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ContentSharingPermissionSerializer(data={**request.data, 'content': obj.pk})
        serializer.is_valid(raise_exception=True)
        permission = serializer.save()
        log_audit_event(
            request=request,
            action='homebrew.share',
            target=obj,
            metadata={
                'permission_id': permission.pk,
                'shared_with_user': permission.shared_with_user_id,
                'shared_with_campaign': permission.shared_with_campaign_id,
                'permission_level': permission.permission_level,
            },
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def permissions_list(self, request, pk=None):
        obj = self.get_object()
        if obj.creator != request.user:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        perms = ContentSharingPermission.objects.filter(content=obj)
        return Response(ContentSharingPermissionSerializer(perms, many=True).data)

    @action(detail=True, methods=['post'])
    def moderate(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['published', 'archived', 'draft']:
            return Response({'detail': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        previous_status = obj.status
        obj.status = new_status
        obj.save(update_fields=['status', 'updated_at'])
        log_audit_event(
            request=request,
            action='homebrew.moderate',
            target=obj,
            metadata={
                'previous_status': previous_status,
                'new_status': new_status,
            },
        )
        return Response(self.get_serializer(obj).data)
