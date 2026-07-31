def test_register_user(test_client):
    response = test_client.post(
        "/api/v1/auth/register",
        json={"full_name": "New User", "email": "new@example.com", "password": "Strong@123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "new@example.com"


def test_register_duplicate_email(test_client, user_token):
    _, user = user_token
    response = test_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Duplicate", "email": "test@example.com", "password": "Strong@123"},
    )
    assert response.status_code == 409


def test_register_weak_password(test_client):
    response = test_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Weak", "email": "weak@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login(test_client, user_token):
    response = test_client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "Test@1234"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password(test_client):
    response = test_client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "WrongPass@1"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user(test_client):
    response = test_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "SomePass@1"},
    )
    assert response.status_code == 401


def test_refresh_token(test_client, user_token):
    token, _ = user_token
    response = test_client.post(
        "/api/v1/auth/register",
        json={"full_name": "Refresh Tester", "email": "refresh@test.com", "password": "Strong@123"},
    )
    data = response.json()
    refresh_token = data["refresh_token"]

    response = test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_refresh_invalid_token(test_client):
    response = test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid-token"},
    )
    assert response.status_code == 401


def test_me(test_client, auth_headers):
    response = test_client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


def test_me_no_auth(test_client):
    response = test_client.get("/api/v1/auth/me")
    assert response.status_code == 401
