"""
Async SQLAlchemy session factory for the synvya‑client backend.

Other modules should **import only `async_session`** (and optionally `Base`)
instead of constructing engines directly. Centralising the engine keeps
pooling, echo flags, and env‑based configuration in one place.
"""

from typing import AsyncGenerator

from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base


class _Settings(BaseSettings):
    """
    Database settings pulled from environment variables.

    Examples
    --------
    export DATABASE_URL="postgresql+asyncpg://synvya:secret@localhost:5432/synvya"
    export SQL_ECHO="1"
    """

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/synvya"
    SQL_ECHO: bool = False

    class Config:
        env_file = ".env"
        env_prefix = ""  # use bare DATABASE_URL=...


settings = _Settings()  # reads env now


# --------------------------------------------------------------------------- #
# SQLAlchemy engine & sessionmaker
# --------------------------------------------------------------------------- #
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.SQL_ECHO,
    future=True,
    pool_pre_ping=True,
)

async_session: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)

# --------------------------------------------------------------------------- #
# Declarative base (for models if/when needed)
# --------------------------------------------------------------------------- #
Base = declarative_base()


# --------------------------------------------------------------------------- #
# Optional FastAPI dependency helper
# --------------------------------------------------------------------------- #
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an *async* database session.

    Usage
    -----
    @router.get("/things")
    async def list_things(db: AsyncSession = Depends(get_db)):
        ...
    """
    async with async_session() as session:
        yield session
