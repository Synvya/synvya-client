"""
This module contains the API endpoints for the delegations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from synvya_sdk.models import Delegation

from app.db import delegations as deleg_repo
from app.dependencies import get_current_user, get_nostr_client, get_public_key
from app.schemas.signed_event import SignedEvent

router = APIRouter(prefix="/api/delegations", tags=["delegations"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def store_delegation(
    evt: SignedEvent,
    user_pubkey: str = Depends(
        get_current_user
    ),  # resolves to the logged-in merchant pubkey
    backend_pubkey: str = Depends(
        get_public_key
    ),  # resolves to the backend server's pubkey
    nostr_client=Depends(get_nostr_client),  # global NostrClient instance
) -> dict[str, str | list[int]]:
    """
    Store a delegation event in the database and add it to the global NostrClient.

    Args:
        evt: The signed event to store
        user_pubkey: The authenticated user's pubkey (delegator)
        backend_pubkey: The backend server's pubkey (delegatee)
        nostr_client: The global NostrClient instance
    """

    # Debug logging
    print(f"Backend received event: {evt.dict()}")
    print(f"Event kind: {evt.kind}")
    print(f"Event type: {type(evt.kind)}")

    # 1️⃣  Parse & verify the merchant's signature
    try:
        deleg = Delegation.parse(evt.dict())
    except ValueError as e:
        print(f"Delegation parse error: {e}")
        raise HTTPException(400, f"Invalid delegation: {e}") from e

    # 2️⃣  Make sure the pubkey in the event matches the logged-in user
    if deleg.author != user_pubkey:
        raise HTTPException(403, "Delegation author mismatch")

    # 3️⃣  Confirm this delegation *targets this server* via 'p' tag
    p_tags = [t for t in evt.tags if t and len(t) >= 2 and t[0] == "p"]
    if not any(t[1] == backend_pubkey for t in p_tags):
        raise HTTPException(400, "Delegation not addressed to this server")

    # 4️⃣  Verify delegation tag structure according to NIP-26
    delegation_tags = [
        t for t in evt.tags if t and len(t) >= 4 and t[0] == "delegation"
    ]
    if not delegation_tags:
        raise HTTPException(400, "No delegation tag found")

    delegation_tag = delegation_tags[0]  # Take the first delegation tag
    delegator_pubkey = delegation_tag[1]  # Second field should be delegator's pubkey

    # Verify that the delegator pubkey in the tag matches the authenticated user
    if delegator_pubkey != user_pubkey:
        raise HTTPException(400, "Delegation tag delegator pubkey mismatch")

    # 5️⃣  Add delegation to the global NostrClient for dynamic management
    try:
        await nostr_client.add_delegation(evt.dict())
        print(f"Added delegation to global NostrClient for merchant: {user_pubkey}")
    except Exception as e:
        print(f"Failed to add delegation to NostrClient: {e}")
        raise HTTPException(500, f"Failed to add delegation to client: {str(e)}") from e

    # 6️⃣  Save (upsert) in DB for persistence across server restarts
    await deleg_repo.upsert(user_pubkey, evt.dict())

    return {
        "status": "stored",
        "expires_at": str(deleg.expires_at),
        "allowed_kinds": list(sorted(deleg.allowed_kinds)),
    }
