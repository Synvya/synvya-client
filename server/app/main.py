"""
Main entry point for the Synvya Retail API.
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from app.api import delegations, products, profile
from app.dependencies import get_public_key
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from synvya_sdk import KeyEncoding, NostrClient, NostrKeys, generate_keys

DEFAULT_RELAYS = ["wss://relay.primal.net"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan for the FastAPI app.

    This function is called when the app starts and when it shuts down.
    It initializes the Synvya SDK and yields the app.

    Args:
    """
    # Startup
    script_dir = Path(__file__).parent
    load_dotenv(script_dir / ".env")

    # Check if we have an existing private key, otherwise generate new ones
    existing_key = os.getenv("BACKEND_PRIVATE_KEY")
    if existing_key:
        # Load existing keys
        keys: NostrKeys = NostrKeys(existing_key)
        print(f"Loaded existing backend key: {keys.get_public_key(KeyEncoding.HEX)}")
    else:
        # Generate new keys and save them
        keys: NostrKeys = generate_keys(
            env_var="BACKEND_PRIVATE_KEY", env_path=script_dir / ".env"
        )
        print(f"Generated new backend key: {keys.get_public_key(KeyEncoding.HEX)}")

    # Store keys in different formats
    app.state.private_key = keys.get_private_key(KeyEncoding.HEX)
    app.state.public_key = keys.get_public_key(KeyEncoding.HEX)

    # Create global NostrClient for non-delegated operations

    try:
        app.state.nostr_client = await NostrClient.create(
            DEFAULT_RELAYS, app.state.private_key
        )
        app.state.nostr_client.set_logger(logging.DEBUG)
        print("Global NostrClient created successfully")

    except Exception as e:
        print(f"Failed to create global NostrClient: {e}")
        app.state.nostr_client = None

    yield

    # Shutdown - close client connections if needed
    if hasattr(app.state, "nostr_client") and app.state.nostr_client:
        try:
            # Add any cleanup logic here if the SDK provides it
            print("Shutting down NostrClient")
        except Exception as e:
            print(f"Error during NostrClient shutdown: {e}")


app = FastAPI(title="Synvya Retail API", version="0.0.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    """
    Health check endpoint.

    Returns:
        dict[str, str]: A dictionary with a status key set to "ok".
    """
    return {"status": "ok"}


@app.get("/api/public_key", tags=["meta"])
async def get_backend_public_key(
    public_key: str = Depends(get_public_key),
) -> dict[str, str]:
    """
    Get the backend server's public key.

    Returns:
        dict[str, str]: A dictionary with the npub key.
    """
    return {"public_key": public_key}


app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(delegations.router, tags=["delegations"])
