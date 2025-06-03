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
    """Test profile endpoint behavior when NostrClient is not available."""
    test_key = "npub1test123"
    response = client.get(f"/api/profile/{test_key}")
    # During testing, NostrClient is not initialized, so we expect a 503
    assert response.status_code == 503
    data = response.json()
    assert "NostrClient not available" in data["detail"]
