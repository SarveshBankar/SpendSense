def test_list_transactions(test_client, auth_headers):
    response = test_client.get("/api/v1/transactions", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "transactions" in data
    assert "total" in data


def test_get_insights(test_client, auth_headers):
    response = test_client.get("/api/v1/insights", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "financial_score" in data
    assert "summary" in data
    assert "recommendations" in data
    assert "insights" in data


def test_get_analytics(test_client, auth_headers):
    response = test_client.get("/api/v1/analytics", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "predictions" in data


def test_get_profile(test_client, auth_headers):
    response = test_client.get("/api/v1/profile", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"


def test_update_profile(test_client, auth_headers):
    response = test_client.put(
        "/api/v1/profile",
        json={"full_name": "Updated Name"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Profile updated successfully"


def test_change_password(test_client, auth_headers):
    response = test_client.put(
        "/api/v1/profile/password",
        json={"current_password": "Test@1234", "new_password": "NewStr0ng!@34"},
        headers=auth_headers,
    )
    assert response.status_code == 200


def test_change_password_wrong_current(test_client, auth_headers):
    response = test_client.put(
        "/api/v1/profile/password",
        json={"current_password": "WrongPass@1", "new_password": "NewStr0ng!@34"},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_get_settings(test_client, auth_headers):
    response = test_client.get("/api/v1/settings", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "currency" in data
    assert "theme" in data


def test_update_settings(test_client, auth_headers):
    response = test_client.put(
        "/api/v1/settings",
        json={"theme": "dark", "currency": "USD"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["settings"]["theme"] == "dark"


def test_budgets_crud(test_client, auth_headers):
    from datetime import datetime
    now = datetime.now()
    create_resp = test_client.post(
        "/api/v1/budgets",
        json={"category": "Food", "monthly_budget": 5000, "month": now.month, "year": now.year},
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    budget_id = create_resp.json()["id"]

    list_resp = test_client.get("/api/v1/budgets", headers=auth_headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    update_resp = test_client.put(
        f"/api/v1/budgets/{budget_id}",
        json={"monthly_budget": 6000},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200

    delete_resp = test_client.delete(
        f"/api/v1/budgets/{budget_id}",
        headers=auth_headers,
    )
    assert delete_resp.status_code == 200


def test_goals_crud(test_client, auth_headers):
    create_resp = test_client.post(
        "/api/v1/goals",
        json={"goal_name": "New Laptop", "target_amount": 100000, "target_date": "2024-12-31"},
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    goal_id = create_resp.json()["id"]

    list_resp = test_client.get("/api/v1/goals", headers=auth_headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    update_resp = test_client.put(
        f"/api/v1/goals/{goal_id}",
        json={"current_amount": 50000},
        headers=auth_headers,
    )
    assert update_resp.status_code == 200

    delete_resp = test_client.delete(
        f"/api/v1/goals/{goal_id}",
        headers=auth_headers,
    )
    assert delete_resp.status_code == 200


def test_reports_list(test_client, auth_headers):
    response = test_client.get("/api/v1/reports/list", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "available_months" in data
    assert "available_years" in data
