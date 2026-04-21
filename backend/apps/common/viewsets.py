from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .permissions import IsOwnerOrReadOnly, IsPublicContentOrAuthenticated
from .pagination import StandardResultsSetPagination


class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet with common functionality for all model viewsets.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """
        Override to add common query optimizations.
        """
        queryset = super().get_queryset()
        
        # Add select_related and prefetch_related if needed
        if hasattr(self, 'select_related_fields'):
            queryset = queryset.select_related(*self.select_related_fields)
        
        if hasattr(self, 'prefetch_related_fields'):
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)
        
        return queryset

    def perform_create(self, serializer):
        """
        Override to set owner automatically if the model has an owner field.
        """
        if hasattr(serializer.Meta.model, 'owner'):
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def get_serializer_context(self):
        """
        Add request to serializer context.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class UserOwnedModelViewSet(BaseModelViewSet):
    """
    ViewSet for models that have an owner field.
    Automatically filters queryset to show only user's objects.
    """
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        """
        Filter queryset to show only objects owned by the current user.
        """
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(owner=self.request.user)
        return queryset.none()


class ContentModelViewSet(BaseModelViewSet):
    """
    ViewSet for content models (spells, equipment, etc.) that are publicly readable.
    """
    permission_classes = [IsPublicContentOrAuthenticated]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Advanced search endpoint for content.
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query)
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def random(self, request):
        """
        Get random content items.
        """
        count = min(int(request.query_params.get('count', 5)), 20)  # Max 20 items
        queryset = self.get_queryset().order_by('?')[:count]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CampaignRelatedViewSet(BaseModelViewSet):
    """
    ViewSet for models that are related to campaigns.
    """
    
    def get_queryset(self):
        """
        Filter based on campaign access permissions.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # If there's a campaign_id in the URL, filter by that campaign
        campaign_id = self.kwargs.get('campaign_pk') or self.request.query_params.get('campaign')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        
        # Filter to campaigns where user is DM or player
        return queryset.filter(
            Q(campaign__dm=user) | Q(campaign__players=user)
        ).distinct()


class CharacterRelatedViewSet(BaseModelViewSet):
    """
    ViewSet for models that are related to characters.
    """
    
    def get_queryset(self):
        """
        Filter based on character ownership.
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        if not user.is_authenticated:
            return queryset.none()
        
        # If there's a character_id in the URL, filter by that character
        character_id = self.kwargs.get('character_pk') or self.request.query_params.get('character')
        if character_id:
            queryset = queryset.filter(character_id=character_id)
        
        # Filter to characters owned by the user or visible to user as DM
        return queryset.filter(
            Q(character__owner=user) | Q(character__campaigns__dm=user)
        ).distinct()


class ReadOnlyContentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for content that shouldn't be modified via API.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    pagination_class = StandardResultsSetPagination
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Override to add common query optimizations.
        """
        queryset = super().get_queryset()
        
        # Add select_related and prefetch_related if needed
        if hasattr(self, 'select_related_fields'):
            queryset = queryset.select_related(*self.select_related_fields)
        
        if hasattr(self, 'prefetch_related_fields'):
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)
        
        return queryset