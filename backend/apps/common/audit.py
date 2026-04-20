from __future__ import annotations

from typing import Any

from .models import AuditLog


def _client_ip(request) -> str | None:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip() or None
    return request.META.get('REMOTE_ADDR')


def log_audit_event(
    *,
    request,
    action: str,
    target: Any | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """Create a normalized audit log event from request context."""
    target_type = ''
    target_id = ''

    if target is not None:
        target_type = target.__class__.__name__
        target_id = str(getattr(target, 'pk', ''))

    actor = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

    return AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata=metadata or {},
        ip_address=_client_ip(request),
        user_agent=(request.META.get('HTTP_USER_AGENT', '') or '')[:255],
    )
