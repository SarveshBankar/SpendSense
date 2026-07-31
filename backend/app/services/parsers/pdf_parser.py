import re
from pathlib import Path
from typing import Any

from app.services.parsers.base import (
    parse_date,
    parse_amount,
    detect_payment_mode,
)
from app.utils.pdf_security import (
    open_pdf,
    PDFPasswordRequiredError,
    PDFIncorrectPasswordError,
)

ParsedRow = dict[str, Any]

DATE_PATTERN = re.compile(r"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4})\b")

# Matches money values only: a value must carry comma grouping (western or Indian
# lakh/crore style such as 1,05,000.00) and/or exactly two decimals. This excludes
# bare integers, reference numbers and the digit components of dates from being
# mistaken for amounts.
AMOUNT_PATTERN = re.compile(
    r"[+-]?\s*(?:\d{1,3}(?:,\d{2,3})+(?:\.\d{2})?|\d+(?:\.\d{2}))"
)

HEADER_KEYWORDS = [
    "date", "transaction", "particulars", "description",
    "debit", "credit", "amount", "balance", "value",
    "narration", "withdrawal", "deposit",
]


def parse_pdf(
    file_path: Path, password: str | None = None
) -> tuple[list[ParsedRow], list[str]]:
    rows: list[ParsedRow] = []
    errors: list[str] = []

    try:
        reader = open_pdf(file_path, password)
    except (PDFPasswordRequiredError, PDFIncorrectPasswordError):
        raise
    except Exception as e:
        return rows, [f"Failed to open PDF: {e}"]

    all_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            all_text += text + "\n"

    if not all_text.strip():
        return rows, ["No extractable text found in PDF"]

    blocks = _extract_transaction_blocks(all_text)

    prev_balance: float | None = None
    for index, block in enumerate(blocks):
        try:
            tx = _parse_block(block, index, prev_balance)
            if tx:
                rows.append(tx)
                if tx["balance"] is not None:
                    prev_balance = tx["balance"]
        except Exception as e:
            errors.append(f"Row {index + 1}: {e}")

    return rows, errors


def _is_header_line(line: str) -> bool:
    lc = line.lower().strip()
    return sum(1 for kw in HEADER_KEYWORDS if kw in lc) >= 1


def _find_header_end(lines: list[str]) -> int:
    """Return the index just past the column-header block.

    Handles both single-line headers (``Date  Description  Amount  Balance``)
    and multi-line headers where every table cell is extracted on its own line.
    """
    i = 0
    n = len(lines)
    while i < n:
        if _is_header_line(lines[i]):
            j = i
            while j < n and _is_header_line(lines[j]):
                j += 1
            for k in range(j, min(j + 3, n)):
                if DATE_PATTERN.search(lines[k]):
                    return j
            i = j
        else:
            i += 1
    return 0


def _find_footer_start(lines: list[str], start: int) -> int:
    for i in range(start, len(lines)):
        lc = lines[i].lower().strip()
        if len(lc) < 60 and (
            lc.startswith("total")
            or lc.startswith("grand total")
            or lc.startswith("closing")
        ):
            return i
    return len(lines)


def _has_amount(line: str) -> bool:
    return bool(AMOUNT_PATTERN.search(DATE_PATTERN.sub(" ", line)))


def _extract_transaction_blocks(text: str) -> list[list[str]]:
    lines = [ln.strip() for ln in text.split("\n")]
    start = _find_header_end(lines)
    end = _find_footer_start(lines, start)

    blocks: list[list[str]] = []
    current: list[str] | None = None

    for ln in lines[start:end]:
        if not ln:
            continue
        if DATE_PATTERN.search(ln):
            if current is not None and _has_amount(current[-1]):
                blocks.append(current)
                current = None
            if current is None:
                current = []
            current.append(ln)
        else:
            if current is not None:
                current.append(ln)

    if current:
        blocks.append(current)

    return blocks


def _parse_block(
    block: list[str], index: int, prev_balance: float | None
) -> ParsedRow | None:
    if not block:
        return None

    first = block[0]
    date_match = DATE_PATTERN.search(first)
    if not date_match:
        return None

    narration_parts: list[str] = []
    amount_values: list[float] = []

    for ln in block:
        tail = DATE_PATTERN.sub(" ", ln)
        found = list(AMOUNT_PATTERN.finditer(tail))
        for m in found:
            amount_values.append(parse_amount(m.group(0)))
        text = AMOUNT_PATTERN.sub(" ", tail)
        if any(ch.isalpha() for ch in text):
            narration_parts.append(re.sub(r"\s+", " ", text).strip())
        elif not found:
            narration_parts.append(ln.strip())

    if not amount_values:
        return None

    balance = amount_values[-1]
    preceding = amount_values[:-1]
    signed_amount = preceding[-1] if preceding else balance
    amount = abs(signed_amount)

    narration = " ".join(
        p for p in narration_parts if p and not re.fullmatch(r"[\d/\-\s]+", p)
    ).strip()

    merchant = _guess_merchant(narration)
    payment_mode = detect_payment_mode(narration)
    transaction_type = _infer_type(signed_amount, balance, prev_balance, narration)

    return {
        "date": parse_date(date_match.group(1)),
        "description": narration or first.strip(),
        "amount": round(amount, 2),
        "balance": round(balance, 2) if balance is not None else None,
        "transaction_type": transaction_type,
        "merchant": merchant,
        "payment_mode": payment_mode,
        "reference_number": None,
        "raw_text": " ".join(block),
        "row_index": index,
    }


def _infer_type(
    signed_amount: float,
    balance: float | None,
    prev_balance: float | None,
    narration: str,
) -> str:
    if prev_balance is not None and balance is not None and prev_balance != balance:
        return "credit" if balance > prev_balance else "debit"
    up = narration.upper()
    if re.search(r"\b(CR|CREDIT)\b", up):
        return "credit"
    if re.search(r"\b(DR|DEBIT|WITHDRAWAL|ATM|PAID|POS)\b", up):
        return "debit"
    return "credit" if signed_amount > 0 else "debit"


def _guess_merchant(text: str) -> str | None:
    if not text:
        return None
    parts = [p.strip() for p in re.split(r"[/\s]", text) if p.strip()]
    for p in parts:
        if p.upper() == p and len(p) > 3 and not p.isdigit():
            return p
    for p in parts:
        if (
            len(p) > 3
            and not p.isdigit()
            and not any(
                kw in p.lower() for kw in ["ref", "txn", "bank", "transfer", "by", "to", "via"]
            )
        ):
            return p
    return text[:50] if len(text) > 3 else None
