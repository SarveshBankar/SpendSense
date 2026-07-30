import csv
import io
from pathlib import Path
from typing import Any

from app.services.parsers.base import (
    guess_column_mapping,
    parse_date,
    parse_amount,
    detect_payment_mode,
    clean_value,
)


ParsedRow = dict[str, Any]


def parse_csv(file_path: Path) -> tuple[list[ParsedRow], list[str]]:
    rows: list[ParsedRow] = []
    errors: list[str] = []

    with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
        raw = f.read()

    dialect = _detect_dialect(raw)
    reader = csv.DictReader(io.StringIO(raw), dialect=dialect)

    if not reader.fieldnames:
        return rows, ["No headers found in CSV"]

    mapping = guess_column_mapping(reader.fieldnames)

    if "date" not in mapping:
        return rows, ["Could not detect date column"]

    for i, row in enumerate(reader):
        try:
            tx = _normalize_row(row, mapping, i)
            rows.append(tx)
        except Exception as e:
            errors.append(f"Row {i + 2}: {e}")

    return rows, errors


def _detect_dialect(raw: str) -> csv.Dialect:
    sample = raw[:4096]
    sniffer = csv.Sniffer()
    try:
        return sniffer.sniff(sample)
    except csv.Error:
        class _Comma(csv.Dialect):
            delimiter = ","
            quotechar = '"'
            doublequote = True
            skipinitialspace = True
            lineterminator = "\n"
            quoting = csv.QUOTE_MINIMAL
        return _Comma()


def _normalize_row(
    row: dict[str, str], mapping: dict[str, str], index: int
) -> ParsedRow:
    raw_text = " | ".join(clean_value(v) for v in row.values())

    date = parse_date(row[mapping["date"]])

    raw_desc = ""
    if "description" in mapping:
        raw_desc = clean_value(row[mapping["description"]])

    amount = 0.0
    transaction_type = "debit"
    balance = None

    if "debit" in mapping and "credit" in mapping:
        debit_str = clean_value(row[mapping["debit"]])
        credit_str = clean_value(row[mapping["credit"]])
        if debit_str:
            amount = parse_amount(debit_str)
            transaction_type = "debit"
        elif credit_str:
            amount = parse_amount(credit_str)
            transaction_type = "credit"

        bal_str = clean_value(row.get(mapping.get("balance", ""), ""))
        if bal_str:
            balance = parse_amount(bal_str)

    elif "amount" in mapping:
        amt_str = clean_value(row[mapping["amount"]])
        amount = abs(parse_amount(amt_str))
        orig = parse_amount(amt_str)
        transaction_type = "credit" if orig >= 0 else "debit"

        if "balance" in mapping:
            bal_str = clean_value(row[mapping["balance"]])
            if bal_str:
                balance = parse_amount(bal_str)

    else:
        for col_name, val in row.items():
            cl = col_name.lower().strip()
            v = clean_value(val)
            if v and any(kw in cl for kw in ["debit", "withdrawal", "dr"]):
                amount = parse_amount(v)
                transaction_type = "debit"
                break
            elif v and any(kw in cl for kw in ["credit", "deposit", "cr"]):
                amount = parse_amount(v)
                transaction_type = "credit"
                break
        else:
            raise ValueError("Could not determine amount column")

    merchant = _guess_merchant(raw_desc)
    payment_mode = detect_payment_mode(raw_desc)

    ref = ""
    if "reference" in mapping:
        ref = clean_value(row[mapping["reference"]])

    return {
        "date": date,
        "description": raw_desc,
        "amount": round(amount, 2),
        "balance": round(balance, 2) if balance is not None else None,
        "transaction_type": transaction_type,
        "merchant": merchant,
        "payment_mode": payment_mode,
        "reference_number": ref or None,
        "raw_text": raw_text,
        "row_index": index,
    }


def _guess_merchant(description: str) -> str | None:
    desc = description.strip()
    if not desc:
        return None
    parts = [p.strip() for p in desc.split("/") if p.strip()]
    for p in parts:
        if p.upper() != p and len(p) > 3 and not any(
            kw in p.lower() for kw in ["ref", "txn", "bank", "transfer"]
        ):
            return p
    for p in parts:
        if len(p) > 3:
            return p
    return desc[:50] if len(desc) > 3 else None
