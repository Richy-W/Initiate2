from __future__ import annotations

from rest_framework.parsers import DataAndFiles, FormParser, JSONParser, MultiPartParser

from .sanitization import sanitize_payload, sanitize_querydict


class SanitizingJSONParser(JSONParser):
    """Parse JSON payloads and sanitize string input recursively."""

    def parse(self, stream, media_type=None, parser_context=None):
        data = super().parse(stream, media_type=media_type, parser_context=parser_context)
        return sanitize_payload(data)


class SanitizingFormParser(FormParser):
    """Parse form data and sanitize all string values."""

    def parse(self, stream, media_type=None, parser_context=None):
        data = super().parse(stream, media_type=media_type, parser_context=parser_context)
        return sanitize_querydict(data)


class SanitizingMultiPartParser(MultiPartParser):
    """Parse multipart input and sanitize non-file form values."""

    def parse(self, stream, media_type=None, parser_context=None):
        parsed = super().parse(stream, media_type=media_type, parser_context=parser_context)
        sanitized_data = sanitize_querydict(parsed.data)
        return DataAndFiles(sanitized_data, parsed.files)
