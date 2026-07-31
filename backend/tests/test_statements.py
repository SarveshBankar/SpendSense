import io

import pytest


def test_upload_statement(test_client, auth_headers):
    csv_content = b"Date,Description,Amount\n2024-01-01,Sample,100.00"
    response = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["statement"]["original_file_name"] == "test.csv"
    assert data["statement"]["status"] == "uploaded"


def test_upload_invalid_type(test_client, auth_headers):
    response = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_list_statements(test_client, auth_headers):
    response = test_client.get("/api/v1/statements", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "statements" in data
    assert "total" in data


def test_list_statements_no_auth(test_client):
    response = test_client.get("/api/v1/statements")
    assert response.status_code == 401


def test_upload_then_parse_and_delete(test_client, auth_headers):
    csv_content = b"Date,Description,Amount\n2024-01-01,Sample Transaction,100.00"
    upload_resp = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("parse_test.csv", io.BytesIO(csv_content), "text/csv")},
        headers=auth_headers,
    )
    assert upload_resp.status_code == 201
    stmt_id = upload_resp.json()["statement"]["id"]

    parse_resp = test_client.post(
        f"/api/v1/statements/{stmt_id}/parse",
        headers=auth_headers,
    )
    assert parse_resp.status_code == 200

    delete_resp = test_client.delete(
        f"/api/v1/statements/{stmt_id}",
        headers=auth_headers,
    )
    assert delete_resp.status_code == 200
