from django.conf import settings
from django.db import models
from apps.content.models import JSONField


class AuditLog(models.Model):
    """Persistent audit trail for sensitive/admin actions."""

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=120)
    target_type = models.CharField(max_length=120, blank=True, default='')
    target_id = models.CharField(max_length=64, blank=True, default='')
    metadata = JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['target_type', 'target_id']),
        ]

    def __str__(self) -> str:
        return f"{self.action} ({self.target_type}:{self.target_id})"
