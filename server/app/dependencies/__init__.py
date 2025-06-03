"""
This module contains the dependencies for the API endpoints.
"""

from .dependencies import (
    get_current_user,  # re-export for easier imports
    get_nostr_client,
    get_private_key,
    get_private_key_bech32,
    get_public_key,
)

__all__ = [
    "get_current_user",
    "get_public_key",
    "get_private_key",
    "get_private_key_bech32",
    "get_nostr_client",
]
