"""
Data-access helpers for NIP-26 delegations.
"""

from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, insert
from synvya_sdk.models import Delegation

from app.db.session import async_session

delegations = sa.Table(
    "delegations",
    sa.MetaData(),
    sa.Column("merchant_pubkey", sa.String, primary_key=True),
    sa.Column("delegation_json", JSONB, nullable=False),
    sa.Column("expires_at", sa.Integer, nullable=False),
    sa.Column("created_at", sa.DateTime, default=datetime.utcnow),
)

# ---- High-level helpers (used by the router) ---------------------------- #


async def upsert(merchant_pubkey: str, event: dict[str, Any]) -> None:
    """
    Upsert a delegation into the database.

    Args:
        merchant_pubkey: The public key of the merchant
        event: The delegation event
    """
    # Parse the delegation to get the expires_at value properly
    deleg = Delegation.parse(event)

    async with async_session() as session:
        # Use PostgreSQL specific on_conflict_do_update
        stmt = insert(delegations).values(
            merchant_pubkey=merchant_pubkey,
            delegation_json=event,
            expires_at=deleg.expires_at,
        )

        stmt = stmt.on_conflict_do_update(
            index_elements=["merchant_pubkey"],
            set_=dict(
                delegation_json=stmt.excluded.delegation_json,
                expires_at=stmt.excluded.expires_at,
            ),
        )

        await session.execute(stmt)
        await session.commit()


async def get(merchant_pubkey: str) -> dict | None:
    """
    Get a delegation from the database.

    Args:
        merchant_pubkey: The public key of the merchant

    Returns:
        The delegation event
    """
    async with async_session() as session:
        result = await session.scalar(
            sa.select(delegations.c.delegation_json).where(
                delegations.c.merchant_pubkey == merchant_pubkey
            )
        )
        return result


async def delete(merchant_pubkey: str) -> None:
    """
    Delete a delegation from the database.

    Args:
        merchant_pubkey: The public key of the merchant
    """
    async with async_session() as session:
        await session.execute(
            sa.delete(delegations).where(
                delegations.c.merchant_pubkey == merchant_pubkey
            )
        )
        await session.commit()
