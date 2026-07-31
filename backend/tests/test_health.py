def test_health_check(test_client):
    response = test_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "SpendSense" in data["message"]


def test_root(test_client):
    response = test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_api_docs(test_client):
    response = test_client.get("/api/docs")
    assert response.status_code in (200, 307)
