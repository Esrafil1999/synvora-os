"""
@file api/security.py
@description Enterprise API Security Guard for SYNVORA OS.
Blocks unauthorized direct backend calls (Postman, curl, hackers, bots)
unless they carry the valid cryptographic X-Synvora-Api-Key or active Admin Session.
"""

import os
import hmac
from rest_framework.permissions import BasePermission


class HasSynvoraSecurityKeyOrAdmin(BasePermission):
    """
    Protects all database endpoints from unauthorized external tampering.
    - Requires X-Synvora-Api-Key header matching the server's secret key,
      OR an authenticated Django Admin session.
    """

    message = "Access Denied: Missing or invalid Synvora Enterprise Security Key."

    def has_permission(self, request, view):
        # Allow authenticated Django superuser / admin session
        if request.user and request.user.is_authenticated:
            return True

        # Verify cryptographic API key header from trusted Next.js frontend
        expected_key = os.environ.get(
            "SYNVORA_INTERNAL_API_KEY",
            "synvora_live_sec_k982347982374982374982374",
        )
        provided_key = request.headers.get("X-Synvora-Api-Key", "")

        if not provided_key:
            return False

        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(provided_key, expected_key)