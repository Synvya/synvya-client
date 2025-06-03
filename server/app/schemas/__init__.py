"""
Pydantic schemas for request/response validation.

TODO: Define schemas for:
- Product model (name, price, description, images, etc.)
- Profile model (merchant information)
- File upload models
- API response models
- Validation rules and constraints
"""

from .signed_event import SignedEvent  # re-export for easier imports

__all__ = ["SignedEvent"]
