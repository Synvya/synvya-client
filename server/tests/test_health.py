
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_products_endpoint():
    """Test products endpoint returns empty list initially."""
    response = client.get("/api/products/")
    assert response.status_code == 200
    assert response.json() == []

def test_profile_endpoint():
    """Test profile endpoint with mock public key."""
    test_key = "npub1test123"
    response = client.get(f"/api/profile/{test_key}")
    assert response.status_code == 200
    data = response.json()
    assert data["public_key"] == test_key
    assert "name" in data
    assert "display_name" in data
