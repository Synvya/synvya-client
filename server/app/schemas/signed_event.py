from typing import Literal

from pydantic import BaseModel


class SignedEvent(BaseModel):
    """
    A signed event is a Nostr event that has been signed by the private key of the
    event's author.

    Args:
        id: The ID of the event
        kind: The kind of event (22242 for auth, 30078 for delegation)
        pubkey: The public key of the event's author
        created_at: The timestamp of the event
        tags: The tags of the event
        sig: The signature of the event
        content: The content of the event
    """

    id: str
    kind: Literal[22242] | Literal[30078]  # Auth events and delegation events
    pubkey: str
    created_at: int
    tags: list[list[str]]
    sig: str
    content: str
