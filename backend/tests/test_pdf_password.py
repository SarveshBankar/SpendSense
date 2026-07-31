import io

import pytest
from pypdf import PdfReader, PdfWriter

from app.utils.pdf_security import (
    is_pdf_encrypted,
    open_pdf,
    PDFPasswordRequiredError,
    PDFIncorrectPasswordError,
)


def _build_statement_pdf(password: str | None = None) -> bytes:
    """Create a simple bank-statement PDF (optionally encrypted)."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.drawString(15 * mm, 270 * mm, "Date  Description  Amount  Balance")
    c.drawString(15 * mm, 260 * mm, "01/01/2024  AMAZON INDIA  -1,250.00  10,000.00")
    c.drawString(15 * mm, 250 * mm, "02/01/2024  SALARY CREDIT  +50,000.00  60,000.00")
    c.save()
    raw = buf.getvalue()

    if password:
        reader = PdfReader(io.BytesIO(raw))
        writer = PdfWriter()
        writer.append_pages_from_reader(reader)
        out = io.BytesIO()
        writer.encrypt(password)
        writer.write(out)
        return out.getvalue()
    return raw


ENCRYPTED_PDF = _build_statement_pdf(password="bank@123")


def test_pdf_security_detection(tmp_path):
    plain_path = tmp_path / "plain.pdf"
    plain_path.write_bytes(_build_statement_pdf())
    enc_path = tmp_path / "enc.pdf"
    enc_path.write_bytes(_build_statement_pdf(password="bank@123"))

    assert is_pdf_encrypted(plain_path) is False
    assert is_pdf_encrypted(enc_path) is True


def test_open_pdf_requires_password(tmp_path):
    enc_path = tmp_path / "enc.pdf"
    enc_path.write_bytes(_build_statement_pdf(password="bank@123"))

    with pytest.raises(PDFPasswordRequiredError):
        open_pdf(enc_path)


def test_open_pdf_wrong_password(tmp_path):
    enc_path = tmp_path / "enc.pdf"
    enc_path.write_bytes(_build_statement_pdf(password="bank@123"))

    with pytest.raises(PDFIncorrectPasswordError):
        open_pdf(enc_path, password="nope")


def test_open_pdf_correct_password(tmp_path):
    enc_path = tmp_path / "enc.pdf"
    enc_path.write_bytes(_build_statement_pdf(password="bank@123"))

    reader = open_pdf(enc_path, password="bank@123")
    text = "".join((p.extract_text() or "") for p in reader.pages)
    assert "AMAZON INDIA" in text


def test_upload_encrypted_pdf_detects_password(test_client, auth_headers):
    response = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("enc.pdf", io.BytesIO(ENCRYPTED_PDF), "application/pdf")},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["statement"]["password_protected"] is True
    assert "password protected" in (data.get("warning") or "").lower()


def test_upload_plain_pdf_not_protected(test_client, auth_headers):
    plain = _build_statement_pdf()
    response = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("plain.pdf", io.BytesIO(plain), "application/pdf")},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["statement"]["password_protected"] is False


def test_parse_encrypted_pdf_without_password(test_client, auth_headers):
    upload = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("enc.pdf", io.BytesIO(ENCRYPTED_PDF), "application/pdf")},
        headers=auth_headers,
    )
    statement_id = upload.json()["statement"]["id"]

    response = test_client.post(
        f"/api/v1/statements/{statement_id}/parse",
        headers=auth_headers,
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "PASSWORD_REQUIRED"


def test_parse_encrypted_pdf_with_wrong_password(test_client, auth_headers):
    upload = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("enc.pdf", io.BytesIO(ENCRYPTED_PDF), "application/pdf")},
        headers=auth_headers,
    )
    statement_id = upload.json()["statement"]["id"]

    response = test_client.post(
        f"/api/v1/statements/{statement_id}/parse",
        json={"password": "wrong-pass"},
        headers=auth_headers,
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "INCORRECT_PASSWORD"


def test_parse_encrypted_pdf_with_correct_password(test_client, auth_headers):
    upload = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("enc.pdf", io.BytesIO(ENCRYPTED_PDF), "application/pdf")},
        headers=auth_headers,
    )
    statement_id = upload.json()["statement"]["id"]

    response = test_client.post(
        f"/api/v1/statements/{statement_id}/parse",
        json={"password": "bank@123"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["successful"] > 0


def test_parse_encrypted_pdf_keeps_old_data_on_wrong_password(
    test_client, auth_headers
):
    upload = test_client.post(
        "/api/v1/statements/upload",
        files={"file": ("enc.pdf", io.BytesIO(ENCRYPTED_PDF), "application/pdf")},
        headers=auth_headers,
    )
    statement_id = upload.json()["statement"]["id"]

    ok = test_client.post(
        f"/api/v1/statements/{statement_id}/parse",
        json={"password": "bank@123"},
        headers=auth_headers,
    )
    assert ok.status_code == 200
    first_count = ok.json()["successful"]
    assert first_count > 0

    bad = test_client.post(
        f"/api/v1/statements/{statement_id}/parse",
        json={"password": "wrong"},
        headers=auth_headers,
    )
    assert bad.status_code == 400

    txs = test_client.get("/api/v1/transactions", headers=auth_headers)
    assert txs.status_code == 200
    assert txs.json()["total"] == first_count
