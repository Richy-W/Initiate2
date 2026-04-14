from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Character, CharacterSpell
from .serializers import CharacterSerializer, CharacterDetailSerializer, CharacterCreateSerializer, CharacterSpellSerializer
from apps.content.models import Species, CharacterClass, Background


class CharacterViewSet(viewsets.ModelViewSet):
    """API endpoints for character management."""
    
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    filterset_fields = ['species', 'character_class', 'background', 'level']
    ordering_fields = ['name', 'level', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def create(self, request, *args, **kwargs):
        """Override create to add debugging."""
        print(f"\n=== CHARACTER CREATION DEBUG ===")
        print(f"Request data: {request.data}")
        print(f"User: {request.user}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Serializer class: {self.get_serializer_class()}")
        
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"Creation failed with error: {e}")
            print(f"Error type: {type(e)}")
            raise
    
    def get_queryset(self):
        """Filter to user's own characters or public characters."""
        if self.action == 'list':
            # Show user's own characters plus public characters
            return Character.objects.filter(
                Q(user=self.request.user) | Q(is_public=True)
            ).select_related('species', 'character_class', 'background', 'user')
        else:
            # For detail views, user can only access their own characters
            return Character.objects.filter(user=self.request.user).select_related(
                'species', 'character_class', 'background'
            ).prefetch_related('skill_proficiencies', 'skill_expertises')
    
    def get_serializer_class(self):
        """Use appropriate serializer for each action."""
        if self.action == 'retrieve':
            return CharacterDetailSerializer
        elif self.action == 'create':
            return CharacterCreateSerializer
        return CharacterSerializer
    
    def perform_create(self, serializer):
        """Automatically set the character's user to the current user."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.error(f"=== CHARACTER CREATION ATTEMPT ===")
        logger.error(f"Request data: {self.request.data}")
        logger.error(f"User: {self.request.user}")
        logger.error(f"Serializer class: {type(serializer)}")
        
        try:
            serializer.save(user=self.request.user)
            logger.error(f"Character creation successful")
        except Exception as e:
            logger.error(f"Character creation failed: {e}")
            raise
    
    @action(detail=True, methods=['post'])
    def level_up(self, request, pk=None):
        """Level up a character."""
        character = self.get_object()
        
        if character.level >= 20:
            return Response(
                {'error': 'Character is already at maximum level'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simple level up - in a full implementation, this would handle class features, HP, etc.
        character.level += 1
        
        # Recalculate hit points (simplified)
        character.max_hit_points = character.hit_point_maximum
        character.current_hit_points = character.max_hit_points
        
        character.save()
        
        serializer = self.get_serializer(character)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def rest(self, request, pk=None):
        """Take a rest (short or long)."""
        character = self.get_object()
        rest_type = request.data.get('type', 'short')
        
        if rest_type == 'long':
            # Long rest - restore all HP
            character.current_hit_points = character.max_hit_points
            character.temporary_hit_points = 0
        elif rest_type == 'short':
            # Short rest - restore some HP based on hit dice (simplified)
            hit_dice = character.character_class.hit_die
            constitution_mod = character.constitution_modifier
            healing = max(1, hit_dice // 2 + constitution_mod)
            character.current_hit_points = min(
                character.max_hit_points,
                character.current_hit_points + healing
            )
        else:
            return Response(
                {'error': 'Invalid rest type. Use "short" or "long"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        character.save()
        
        return Response({
            'message': f'{rest_type.title()} rest completed',
            'current_hp': character.current_hit_points,
            'max_hp': character.max_hit_points,
            'temp_hp': character.temporary_hit_points
        })
    
    @action(detail=True, methods=['post'])
    def take_damage(self, request, pk=None):
        """Apply damage to a character."""
        character = self.get_object()
        damage = request.data.get('damage', 0)
        damage_type = request.data.get('damage_type', 'untyped')
        
        try:
            damage = int(damage)
            if damage < 0:
                return Response(
                    {'error': 'Damage must be positive'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid damage value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Apply damage (temp HP first)
        remaining_damage = damage
        if character.temporary_hit_points > 0:
            temp_damage = min(character.temporary_hit_points, remaining_damage)
            character.temporary_hit_points -= temp_damage
            remaining_damage -= temp_damage
        
        if remaining_damage > 0:
            character.current_hit_points = max(0, character.current_hit_points - remaining_damage)
        
        character.save()
        
        return Response({
            'damage_taken': damage,
            'damage_type': damage_type,
            'current_hp': character.current_hit_points,
            'temp_hp': character.temporary_hit_points,
            'is_unconscious': character.current_hit_points == 0
        })
    
    @action(detail=True, methods=['post'])
    def heal(self, request, pk=None):
        """Heal a character."""
        character = self.get_object()
        healing = request.data.get('healing', 0)
        
        try:
            healing = int(healing)
            if healing < 0:
                return Response(
                    {'error': 'Healing must be positive'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid healing value'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        character.current_hit_points = min(
            character.max_hit_points,
            character.current_hit_points + healing
        )
        character.save()
        
        return Response({
            'healing_applied': healing,
            'current_hp': character.current_hit_points,
            'max_hp': character.max_hit_points
        })
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get detailed character statistics."""
        character = self.get_object()
        
        return Response({
            'name': character.name,
            'level': character.level,
            'species': character.species.name,
            'class': character.character_class.name,
            'background': character.background.name,
            'ability_scores': {
                'strength': {
                    'score': character.total_strength,
                    'modifier': character.strength_modifier
                },
                'dexterity': {
                    'score': character.total_dexterity,
                    'modifier': character.dexterity_modifier
                },
                'constitution': {
                    'score': character.total_constitution,
                    'modifier': character.constitution_modifier
                },
                'intelligence': {
                    'score': character.total_intelligence,
                    'modifier': character.intelligence_modifier
                },
                'wisdom': {
                    'score': character.total_wisdom,
                    'modifier': character.wisdom_modifier
                },
                'charisma': {
                    'score': character.total_charisma,
                    'modifier': character.charisma_modifier
                }
            },
            'derived_stats': {
                'armor_class': character.armor_class,
                'initiative': character.initiative,
                'speed': character.speed,
                'proficiency_bonus': character.proficiency_bonus,
                'hit_points': {
                    'current': character.current_hit_points,
                    'maximum': character.max_hit_points,
                    'temporary': character.temporary_hit_points
                }
            },
            'proficiencies': {
                'skills': [skill.name for skill in character.skill_proficiencies.all()],
                'skill_expertises': [skill.name for skill in character.skill_expertises.all()],
                'saving_throws': character.saving_throw_proficiencies
            }
        })
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get all public characters."""
        public_characters = Character.objects.filter(is_public=True).select_related(
            'species', 'character_class', 'background', 'user'
        )
        
        serializer = self.get_serializer(public_characters, many=True)
        return Response(serializer.data)


class CharacterSpellViewSet(viewsets.ModelViewSet):
    """API endpoints for character spell management."""
    
    serializer_class = CharacterSpellSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter to current user's character spells."""
        return CharacterSpell.objects.filter(
            character__user=self.request.user
        ).select_related('character', 'spell')
    
    def perform_create(self, serializer):
        """Ensure character belongs to current user."""
        character = serializer.validated_data['character']
        if character.user != self.request.user:
            raise serializers.ValidationError("You can only add spells to your own characters")
        serializer.save()
