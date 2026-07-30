import re
from datetime import datetime
from typing import Any


DATE_FORMATS = [
    "%d-%m-%Y", "%Y-%m-%d", "%m-%d-%Y",
    "%d/%m/%Y", "%Y/%m/%d", "%m/%d/%Y",
    "%d-%b-%Y", "%d-%b-%y",
    "%d %b %Y", "%d %B %Y",
    "%Y%m%d",
]

FIELD_KEYWORDS = {
    "date": [
        "date", "transaction date", "posting date", "value date",
        "trade date", "trans date", "txn date",
    ],
    "description": [
        "description", "particulars", "narration", "details",
        "memo", "transaction details", "merchant", "remarks",
        "transaction description", "trans details", "narrative",
    ],
    "debit": [
        "debit", "withdrawal", "dr", "withdrawals",
        "debit amount", "withdrawl", "money out", "payment",
    ],
    "credit": [
        "credit", "deposit", "cr", "deposits",
        "credit amount", "deposit amount", "money in", "refund",
    ],
    "amount": [
        "amount", "value", "sum", "transaction amount",
        "txn amount", "trans amount",
    ],
    "balance": [
        "balance", "running balance", "available balance",
        "closing balance", "closing balance",
    ],
    "reference": [
        "reference", "ref no", "transaction id", "ref",
        "cheque no", "cheque number", "chq no", "transaction ref",
        "utr", "utr no", "rrn",
    ],
}

PAYMENT_MODE_KEYWORDS = [
    (r"\bupi\b", "UPI"),
    (r"\bneft\b", "NEFT"),
    (r"\brtgs\b", "RTGS"),
    (r"\bimps\b", "IMPS"),
    (r"\bdebit\s*card\b", "Debit Card"),
    (r"\bcredit\s*card\b", "Credit Card"),
    (r"\bcard\b", "Card"),
    (r"\bcheque\b", "Cheque"),
    (r"\bcash\b", "Cash"),
    (r"\bnet\s*banking\b", "Net Banking"),
    (r"\bpos\b", "POS"),
    (r"\bwallet\b", "Wallet"),
]


def guess_column_mapping(headers: list[str]) -> dict[str, str]:
    header_lower = [h.lower().strip() for h in headers]
    scores: dict[str, dict[str, int]] = {}

    for i, hl in enumerate(header_lower):
        scores[headers[i]] = {}
        for field, keywords in FIELD_KEYWORDS.items():
            score = 0
            for kw in keywords:
                if hl == kw:
                    score += 3
                elif hl.startswith(kw) or hl.endswith(kw):
                    score += 2
                elif kw in hl:
                    score += 1
            scores[headers[i]][field] = score

    mapping: dict[str, str] = {}
    used_fields: set[str] = set()

    for header in sorted(scores, key=lambda h: max(scores[h].values()), reverse=True):
        best_field = max(scores[header], key=scores[header].get)
        best_score = scores[header][best_field]
        if best_score > 0 and best_field not in used_fields:
            mapping[best_field] = header
            used_fields.add(best_field)

    return mapping


def parse_date(value: str) -> str:
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(value.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except (ValueError, IndexError):
            continue
    return value.strip()


def parse_amount(value: str) -> float:
    cleaned = re.sub(r"[^0-9.\-]", "", value.strip().replace(",", ""))
    if not cleaned:
        return 0.0
    return float(cleaned)


def detect_payment_mode(text: str) -> str | None:
    if not text:
        return None
    text_lower = text.lower()
    for pattern, mode in PAYMENT_MODE_KEYWORDS:
        if re.search(pattern, text_lower):
            return mode
    return None


def clean_value(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()
