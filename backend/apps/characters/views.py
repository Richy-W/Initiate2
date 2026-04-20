from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.http import HttpResponse
from django.utils.text import slugify
from drf_spectacular.utils import extend_schema

from .models import Character, CharacterSpell
from .serializers import CharacterSerializer, CharacterDetailSerializer, CharacterCreateSerializer, CharacterSpellSerializer
from .pdf_export import render_character_sheet_pdf
from apps.content.models import Species, CharacterClass, Background


@extend_schema(tags=['characters'])
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
        # Guard for drf-spectacular schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Character.objects.none()
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

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        """Export the character sheet as a PDF file."""
        character = self.get_object()
        try:
            pdf_bytes = render_character_sheet_pdf(character, base_url=request.build_absolute_uri('/'))
        except RuntimeError as error:
            return Response(
                {'error': str(error)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        file_slug = slugify(character.name) or f"character-{character.id}"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{file_slug}-sheet.pdf"'
        return response
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add a simple item entry to the character inventory."""
        character = self.get_object()
        item_name = str(request.data.get('name', '')).strip()
        quantity = request.data.get('quantity', 1)

        if not item_name:
            return Response(
                {'error': 'name is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {'error': 'quantity must be positive'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid quantity'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        equipment = character.equipment or []
        if not isinstance(equipment, list):
            equipment = []

        existing = next(
            (
                item
                for item in equipment
                if isinstance(item, dict) and str(item.get('name', '')).strip().lower() == item_name.lower()
            ),
            None,
        )

        if existing:
            existing['quantity'] = int(existing.get('quantity', 1) or 1) + quantity
        else:
            equipment.append({'name': item_name, 'quantity': quantity})

        character.equipment = equipment
        character.save(update_fields=['equipment'])
        character.refresh_from_db()

        serializer = CharacterDetailSerializer(character)
        return Response({
            'success': True,
            'message': f'Added {quantity} x {item_name}',
            'character': serializer.data,
        })

    @action(detail=True, methods=['post'])
    def equip_item(self, request, pk=None):
        """Equip an item to a character slot."""
        character = self.get_object()
        equipment_id = request.data.get('equipment_id')
        slot = request.data.get('slot')  # Optional - will auto-determine if not provided
        
        if not equipment_id:
            return Response(
                {'error': 'equipment_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success, message = character.equip_item(equipment_id, slot)
            
            if success:
                # Refresh character data to get updated equipped items
                character.refresh_from_db()
                serializer = CharacterDetailSerializer(character)
                return Response({
                    'success': True,
                    'message': message,
                    'character': serializer.data
                })
            else:
                return Response(
                    {'success': False, 'error': message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def unequip_item(self, request, pk=None):
        """Unequip an item from a character slot."""
        character = self.get_object()
        slot = request.data.get('slot')
        
        if not slot:
            return Response(
                {'error': 'slot is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success, message = character.unequip_item(slot)
            
            if success:
                # Refresh character data to get updated equipped items
                character.refresh_from_db()
                serializer = CharacterDetailSerializer(character)
                return Response({
                    'success': True,
                    'message': message,
                    'character': serializer.data
                })
            else:
                return Response(
                    {'success': False, 'error': message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def equipped_items(self, request, pk=None):
        """Get detailed information about equipped items."""
        character = self.get_object()
        equipped_details = character.get_equipped_items_details()
        
        return Response({
            'equipped_items': equipped_details,
            'calculated_ac': character.calculated_armor_class,
            'armor_class': character.armor_class
        })
    
    @action(detail=True, methods=['post'])
    def add_currency(self, request, pk=None):
        """Add currency to a character."""
        character = self.get_object()
        currency_type = request.data.get('currency_type')
        amount = request.data.get('amount')
        
        if not currency_type or currency_type not in ['cp', 'sp', 'ep', 'gp', 'pp']:
            return Response(
                {'error': 'Valid currency_type (cp, sp, ep, gp, pp) is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = int(amount)
            if amount <= 0:
                return Response(
                    {'error': 'Amount must be positive'},
                    status=status.HTTP_400_BAD_REQUEST 
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            character.add_currency(currency_type, amount)
            character.refresh_from_db()
            
            return Response({
                'success': True,
                'message': f'Added {amount} {currency_type}',
                'currency': character.currency,
                'total_gp_value': character.get_currency_total_gp_value()
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post']) 
    def remove_currency(self, request, pk=None):
        """Remove currency from a character."""
        character = self.get_object()
        currency_type = request.data.get('currency_type')
        amount = request.data.get('amount')
        
        if not currency_type or currency_type not in ['cp', 'sp', 'ep', 'gp', 'pp']:
            return Response(
                {'error': 'Valid currency_type (cp, sp, ep, gp, pp) is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = int(amount)
            if amount <= 0:
                return Response(
                    {'error': 'Amount must be positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success, message = character.remove_currency(currency_type, amount)
            
            if success:
                character.refresh_from_db()
                return Response({
                    'success': True,
                    'message': message,
                    'currency': character.currency,
                    'total_gp_value': character.get_currency_total_gp_value()
                })
            else:
                return Response(
                    {'success': False, 'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def set_currency(self, request, pk=None):
        """Set absolute currency values for all coin types."""
        character = self.get_object()
        payload = request.data or {}

        allowed_types = ['cp', 'sp', 'ep', 'gp', 'pp']
        existing_currency = character.currency or {}
        next_currency = {
            key: int(existing_currency.get(key, 0) or 0)
            for key in allowed_types
        }

        for currency_type in allowed_types:
            if currency_type not in payload:
                continue

            try:
                value = int(payload.get(currency_type, 0))
            except (TypeError, ValueError):
                return Response(
                    {'error': f'Invalid value for {currency_type}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if value < 0:
                return Response(
                    {'error': f'{currency_type} must be 0 or greater'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            next_currency[currency_type] = value

        character.currency = next_currency
        character.save(update_fields=['currency'])
        character.refresh_from_db()

        return Response({
            'success': True,
            'currency': character.currency,
            'total_gp_value': character.get_currency_total_gp_value(),
        })
    
    @action(detail=True, methods=['post'])
    def convert_currency(self, request, pk=None):
        """Convert currency from one type to another."""
        character = self.get_object()
        from_type = request.data.get('from_type')
        to_type = request.data.get('to_type')
        amount = request.data.get('amount')
        
        if not all([from_type, to_type, amount]):
            return Response(
                {'error': 'from_type, to_type, and amount are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = int(amount)
            if amount <= 0:
                return Response(
                    {'error': 'Amount must be positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success, converted_amount, message = character.convert_currency(from_type, to_type, amount)
            
            if success:
                character.refresh_from_db()
                return Response({
                    'success': True,
                    'message': message,
                    'converted_amount': converted_amount,
                    'currency': character.currency,
                    'total_gp_value': character.get_currency_total_gp_value()
                })
            else:
                return Response(
                    {'success': False, 'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def pay_cost(self, request, pk=None):
        """Pay a cost using the character's currency."""
        character = self.get_object()
        cost = request.data.get('cost')  # Expected format: {'gp': 50, 'sp': 25}
        auto_convert = request.data.get('auto_convert', True)
        
        if not cost or not isinstance(cost, dict):
            return Response(
                {'error': 'cost dict is required (e.g., {"gp": 50, "sp": 25})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success, message = character.pay_cost(cost, auto_convert)
            
            if success:
                character.refresh_from_db()
                return Response({
                    'success': True,
                    'message': message,
                    'currency': character.currency,
                    'total_gp_value': character.get_currency_total_gp_value()
                })
            else:
                return Response(
                    {'success': False, 'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def public(self, request):
        """Get all public characters."""
        public_characters = Character.objects.filter(is_public=True).select_related(
            'species', 'character_class', 'background', 'user'
        )
        
        serializer = self.get_serializer(public_characters, many=True)
        return Response(serializer.data)


@extend_schema(tags=['characters'])
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
