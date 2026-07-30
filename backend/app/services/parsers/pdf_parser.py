import re
from pathlib import Path
from typing import Any

from pypdf import PdfReader

from app.services.parsers.base import (
    parse_date,
    parse_amount,
    detect_payment_mode,
    clean_value,
)

ParsedRow = dict[str, Any]

DATE_PATTERNS = re.compile(
    r"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\b"
)

AMOUNT_PATTERN = re.compile(
    r"[+-]?\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?"
)

ROW_LINE_PATTERN = re.compile(
    r"(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\s+"  # date
    r"(.+?)\s+"                                       # description (greedy but limited)
    r"([+-]?\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)"  # amount
)


def parse_pdf(file_path: Path) -> tuple[list[ParsedRow], list[str]]:
    rows: list[ParsedRow] = []
    errors: list[str] = []

    try:
        reader = PdfReader(str(file_path))
    except Exception as e:
        return rows, [f"Failed to open PDF: {e}"]

    all_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            all_text += text + "\n"

    if not all_text.strip():
        return rows, ["No extractable text found in PDF"]

    lines = all_text.split("\n")

    tx_lines = _find_transaction_lines(lines)

    for i, tx_line in enumerate(tx_lines):
        try:
            tx = _parse_transaction_line(tx_line, i)
            if tx:
                rows.append(tx)
        except Exception as e:
            errors.append(f"Row {i + 1}: {e}")

    return rows, errors


def _find_transaction_lines(lines: list[str]) -> list[str]:
    header_keywords = [
        "date", "transaction", "particulars", "description",
        "debit", "credit", "amount", "balance", "value",
    ]

    start_idx = 0
    for i, line in enumerate(lines):
        lc = line.lower().strip()
        if sum(1 for kw in header_keywords if kw in lc) >= 3:
            start_idx = i + 1
            break

    total_keywords = ["total", "balance", "grand total", "closing"]
    end_idx = len(lines)
    for i in range(start_idx, len(lines)):
        lc = lines[i].lower().strip()
        if lc.startswith("total") and len(lc) < 40:
            end_idx = i
            break

    return lines[start_idx:end_idx]


def _parse_transaction_line(line: str, index: int) -> ParsedRow | None:
    line = line.strip()
    if not line:
        return None

    date_match = DATE_PATTERNS.search(line)
    if not date_match:
        return None

    date_str = date_match.group(1)

    amounts = AMOUNT_PATTERN.findall(line)

    if not amounts:
        return None

    date = parse_date(date_str)

    amount_values = [parse_amount(a) for a in amounts]
    non_zero = [a for a in amount_values if a != 0]

    if len(non_zero) >= 2:
        amount = abs(non_zero[0])
        balance = abs(non_zero[1])
        transaction_type = "debit" if non_zero[0] < 0 else "credit"
        if amount == balance:
            transaction_type = "credit" if non_zero[-1] > non_zero[0] else "debit"
            amount = abs(non_zero[1] - non_zero[0]) if len(non_zero) > 1 else abs(non_zero[0])
            balance = abs(non_zero[-1])
    elif len(non_zero) == 1:
        amount = abs(non_zero[0])
        balance = None
        transaction_type = "debit" if non_zero[0] < 0 else "credit"
    else:
        return None

    desc_text = line[date_match.end():].strip()
    for am in amounts:
        idx = desc_text.rfind(am)
        if idx >= 0:
            desc_text = desc_text[:idx].strip()

    desc_text = re.sub(r"\s+", " ", desc_text).strip()

    for kw in ["dr", "cr", "db", "cr "] if transaction_type == "debit" else ["cr", "dr"]:
        desc_text = re.sub(rf"\b{kw}\b", "", desc_text, flags=re.IGNORECASE).strip()

    payment_mode = detect_payment_mode(desc_text)
    merchant = _guess_merchant(desc_text)

    return {
        "date": date,
        "description": desc_text or line,
        "amount": round(amount, 2),
        "balance": round(balance, 2) if balance is not None else None,
        "transaction_type": transaction_type,
        "merchant": merchant,
        "payment_mode": payment_mode,
        "reference_number": None,
        "raw_text": line,
        "row_index": index,
    }


def _guess_merchant(text: str) -> str | None:
    if not text:
        return None
    parts = [p.strip() for p in text.split() if p.strip()]
    for p in parts:
        if p.upper() == p and len(p) > 3:
            return p
    for p in parts:
        if len(p) > 3 and not any(
            kw in p.lower() for kw in ["ref", "txn", "bank", "transfer", "by", "to", "via"]
        ):
            return p
    return text[:50] if len(text) > 3 else None
