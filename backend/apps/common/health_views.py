"""
Health check and metrics endpoints for monitoring and observability.

Endpoints:
    GET /api/v1/health/         - liveness probe (always fast)
    GET /api/v1/health/ready/   - readiness probe (checks DB + cache)
    GET /api/v1/metrics/        - basic app metrics (authenticated, staff only)
"""

import time
import logging
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiTypes

logger = logging.getLogger(__name__)

_START_TIME = time.time()


# ---------------------------------------------------------------------------
# Liveness probe — minimal, does no DB I/O
# ---------------------------------------------------------------------------

@extend_schema(
    tags=['monitoring'],
    responses={200: OpenApiTypes.OBJECT},
    summary="Liveness probe",
    description="Returns 200 if the application process is running. Use as a Kubernetes liveness probe.",
)
@api_view(['GET'])
@permission_classes([AllowAny])
def health_live(request):
    """Liveness probe — confirms the process is alive."""
    return Response({
        'status': 'ok',
        'uptime_seconds': round(time.time() - _START_TIME),
        'timestamp': timezone.now().isoformat(),
    })


# ---------------------------------------------------------------------------
# Readiness probe — checks DB and cache
# ---------------------------------------------------------------------------

@extend_schema(
    tags=['monitoring'],
    responses={200: OpenApiTypes.OBJECT, 503: OpenApiTypes.OBJECT},
    summary="Readiness probe",
    description="Returns 200 when all critical dependencies are healthy. Use as a Kubernetes readiness probe.",
)
@api_view(['GET'])
@permission_classes([AllowAny])
def health_ready(request):
    """Readiness probe — checks database and cache connectivity."""
    checks = {}
    overall_ok = True

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = {'status': 'ok'}
    except Exception as exc:
        checks['database'] = {'status': 'error', 'detail': str(exc)}
        overall_ok = False
        logger.error("Health readiness: database check failed", exc_info=True)

    # Cache check
    try:
        probe_key = '_health_probe_'
        cache.set(probe_key, 'ok', timeout=5)
        if cache.get(probe_key) == 'ok':
            checks['cache'] = {'status': 'ok'}
        else:
            checks['cache'] = {'status': 'error', 'detail': 'cache read/write mismatch'}
            overall_ok = False
    except Exception as exc:
        # Cache failures are degraded, not fatal (app can run without cache)
        checks['cache'] = {'status': 'degraded', 'detail': str(exc)}
        logger.warning("Health readiness: cache check failed", exc_info=True)

    http_status = status.HTTP_200_OK if overall_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response({
        'status': 'ok' if overall_ok else 'error',
        'checks': checks,
        'timestamp': timezone.now().isoformat(),
    }, status=http_status)


# ---------------------------------------------------------------------------
# Metrics — staff-only aggregated counts
# ---------------------------------------------------------------------------

@extend_schema(
    tags=['monitoring'],
    responses={200: OpenApiTypes.OBJECT},
    summary="Application metrics",
    description="Returns aggregated usage metrics. Requires staff authentication.",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def app_metrics(request):
    """Aggregated application metrics for staff/admin monitoring."""
    from apps.users.models import User
    from apps.characters.models import Character
    from apps.campaigns.models import Campaign

    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)

    try:
        metrics = {
            'users': {
                'total': User.objects.count(),
                'active_last_24h': User.objects.filter(last_login__gte=last_24h).count(),
                'active_last_7d': User.objects.filter(last_login__gte=last_7d).count(),
                'new_last_7d': User.objects.filter(date_joined__gte=last_7d).count(),
            },
            'characters': {
                'total': Character.objects.count(),
                'created_last_7d': Character.objects.filter(created_at__gte=last_7d).count(),
            },
            'campaigns': {
                'total': Campaign.objects.count(),
                'active': Campaign.objects.filter(is_active=True).count(),
                'created_last_7d': Campaign.objects.filter(created_at__gte=last_7d).count(),
            },
            'system': {
                'uptime_seconds': round(time.time() - _START_TIME),
                'debug_mode': settings.DEBUG,
            },
            'timestamp': now.isoformat(),
        }
    except Exception as exc:
        logger.error("Metrics collection failed", exc_info=True)
        return Response(
            {'error': 'Metrics collection failed', 'detail': str(exc) if settings.DEBUG else None},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(metrics)
