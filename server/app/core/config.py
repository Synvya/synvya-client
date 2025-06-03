from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings and configuration.

    TODO: Add configuration for:
    - Database connection strings
    - Cloud storage credentials (AWS S3, etc.)
    - External API keys (Square, Shopify)
    - JWT/session configuration
    - CORS origins for production
    """

    # Database
    database_url: str = "sqlite:///./synvya.db"

    # External APIs
    square_application_id: str | None = None
    square_access_token: str | None = None
    shopify_api_key: str | None = None
    shopify_api_secret: str | None = None

    # Storage
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    s3_bucket_name: str | None = None

    # Security
    secret_key: str = "your-secret-key-here"
    cors_origins: list = ["http://localhost:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
