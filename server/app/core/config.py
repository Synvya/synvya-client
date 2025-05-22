
from pydantic_settings import BaseSettings
from typing import Optional

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
    square_application_id: Optional[str] = None
    square_access_token: Optional[str] = None
    shopify_api_key: Optional[str] = None
    shopify_api_secret: Optional[str] = None
    
    # Storage
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    s3_bucket_name: Optional[str] = None
    
    # Security
    secret_key: str = "your-secret-key-here"
    cors_origins: list = ["http://localhost:5173"]
    
    class Config:
        env_file = ".env"

settings = Settings()
