from rest_framework import permissions
from rest_framework.permissions import BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Everyone can read (if they have basic permission), only owners can write.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for safe methods
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object
        return hasattr(obj, 'owner') and obj.owner == request.user


class IsOwner(BasePermission):
    """
    Custom permission to only allow access to owners of an object.
    """

    def has_object_permission(self, request, view, obj):
        # Only allow access to the owner
        return hasattr(obj, 'owner') and obj.owner == request.user


class IsCampaignDMOrPlayer(BasePermission):
    """
    Permission for campaign-related resources.
    - DMs have full access to their campaigns
    - Players have read access to campaigns they're part of
    - Write access requires DM status for the campaign
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Get the campaign from the object
        campaign = getattr(obj, 'campaign', obj)
        
        # DM has full access
        if campaign.dm == user:
            return True
        
        # Players can read if they're in the campaign
        if request.method in permissions.SAFE_METHODS:
            return campaign.players.filter(id=user.id).exists()
        
        # Write access only for DMs
        return False


class IsCampaignDM(BasePermission):
    """
    Permission that only allows campaign DMs to access/modify resources.
    """

    def has_object_permission(self, request, view, obj):
        # Get the campaign from the object
        campaign = getattr(obj, 'campaign', obj)
        return campaign.dm == request.user


class IsCharacterOwner(BasePermission):
    """
    Permission for character-related resources.
    Only the character owner can access their character.
    """

    def has_object_permission(self, request, view, obj):
        # Get the character from the object
        character = getattr(obj, 'character', obj)
        return character.owner == request.user


class IsCharacterOwnerOrCampaignDM(BasePermission):
    """
    Permission for character resources in campaign context.
    - Character owner has full access
    - Campaign DM has read access to characters in their campaigns
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        character = getattr(obj, 'character', obj)
        
        # Character owner has full access
        if character.owner == user:
            return True
        
        # Campaign DM has read access to characters in their campaigns
        if request.method in permissions.SAFE_METHODS:
            # Check if user is DM of any campaign containing this character
            return character.campaigns.filter(dm=user).exists()
        
        return False


class IsPublicContentOrAuthenticated(BasePermission):
    """
    Permission for content resources (spells, equipment, etc.).
    - Public content is readable by anyone
    - Authenticated users can access all content
    - Only staff can modify content
    """

    def has_permission(self, request, view):
        # Public content is readable by anyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write operations require staff permissions
        return request.user and request.user.is_authenticated and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        # Read access for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write access only for staff
        return request.user and request.user.is_staff