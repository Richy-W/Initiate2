"""
Service functions for the campaigns domain.

These are the sanctioned way for other apps (e.g. combat) to query campaign
membership without importing campaigns models directly. Per the constitution,
direct model imports across app boundaries (outside of models.py ForeignKeys)
are a violation — call these service functions instead.
"""
from django.db.models import Q


def is_campaign_member(user, campaign) -> bool:
    """Return True if *user* is the DM or an active player in *campaign*."""
    from apps.campaigns.models import CampaignMembership

    if campaign.dm_id == user.pk:
        return True
    return CampaignMembership.objects.filter(
        campaign=campaign,
        player=user,
        status=CampaignMembership.Status.ACTIVE,
    ).exists()


def get_accessible_campaigns(user):
    """Return a queryset of all campaigns the user can access (as DM or active member)."""
    from apps.campaigns.models import Campaign, CampaignMembership

    return Campaign.objects.filter(
        Q(dm=user) | Q(memberships__player=user, memberships__status=CampaignMembership.Status.ACTIVE)
    ).distinct()
