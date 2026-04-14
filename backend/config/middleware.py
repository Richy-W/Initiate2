"""
Custom middleware for error handling and API response formatting.
"""

import json
import logging
from django.http import JsonResponse
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import IntegrityError
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError as DRFValidationError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    Returns formatted error responses for consistent API behavior.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the response format
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'errors': None,
            'status_code': response.status_code
        }

        # Handle different types of errors
        if isinstance(exc, DRFValidationError):
            custom_response_data['message'] = 'Validation failed'
            custom_response_data['errors'] = response.data
        elif hasattr(response.data, 'get'):
            # Handle standard DRF errors
            if 'detail' in response.data:
                custom_response_data['message'] = response.data['detail']
            elif 'non_field_errors' in response.data:
                custom_response_data['message'] = response.data['non_field_errors'][0]
                custom_response_data['errors'] = response.data
            else:
                custom_response_data['errors'] = response.data
        else:
            custom_response_data['errors'] = response.data

        response.data = custom_response_data

    return response


class ErrorHandlingMiddleware:
    """
    Middleware to catch and format unhandled exceptions.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as exc:
            return self.handle_exception(request, exc)

    def handle_exception(self, request, exc):
        """
        Handle various types of exceptions and return appropriate JSON responses.
        """
        # Log the exception
        logger.error(f"Unhandled exception in middleware: {exc}", exc_info=True)

        # Determine if this is an API request
        is_api_request = (
            request.path.startswith('/api/') or 
            request.content_type == 'application/json' or
            'application/json' in request.META.get('HTTP_ACCEPT', '')
        )

        if not is_api_request:
            # For non-API requests, let Django handle it normally
            raise exc

        # Handle specific exception types
        if isinstance(exc, ValidationError):
            return JsonResponse({
                'error': True,
                'message': 'Validation error',
                'errors': exc.message_dict if hasattr(exc, 'message_dict') else str(exc),
                'status_code': 400
            }, status=400)

        elif isinstance(exc, PermissionDenied):
            return JsonResponse({
                'error': True,
                'message': 'Permission denied',
                'errors': None,
                'status_code': 403
            }, status=403)

        elif isinstance(exc, IntegrityError):
            return JsonResponse({
                'error': True,
                'message': 'Database integrity error',
                'errors': str(exc) if settings.DEBUG else None,
                'status_code': 400
            }, status=400)

        else:
            # Generic server error
            return JsonResponse({
                'error': True,
                'message': 'Internal server error',
                'errors': str(exc) if settings.DEBUG else None,
                'status_code': 500
            }, status=500)


class CORSMiddleware:
    """
    Custom CORS middleware for development.
    In production, use django-cors-headers package.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add CORS headers for development
        if settings.DEBUG:
            response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            response['Access-Control-Allow-Credentials'] = 'true'

        return response

    def process_request(self, request):
        """
        Handle preflight OPTIONS requests.
        """
        if request.method == 'OPTIONS' and settings.DEBUG:
            response = JsonResponse({}, status=200)
            response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
        return None


class RequestLoggingMiddleware:
    """
    Middleware to log API requests for debugging.
    Only active in DEBUG mode.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.DEBUG and request.path.startswith('/api/'):
            logger.info(f"API Request: {request.method} {request.path}")
            if request.body:
                try:
                    body = json.loads(request.body)
                    # Don't log sensitive information
                    if 'password' in body:
                        body['password'] = '[REDACTED]'
                    logger.info(f"Request body: {body}")
                except (json.JSONDecodeError, UnicodeDecodeError):
                    logger.info("Request body: [Binary or invalid JSON]")

        response = self.get_response(request)

        if settings.DEBUG and request.path.startswith('/api/'):
            logger.info(f"API Response: {response.status_code}")

        return response


class SecurityHeadersMiddleware:
    """
    Add security headers to responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Only add HSTS in production with HTTPS
        if not settings.DEBUG and request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        return response