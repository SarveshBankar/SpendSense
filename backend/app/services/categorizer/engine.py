import re
from dataclasses import dataclass, field

from app.services.categorizer.rules import get_rules


@dataclass
class CategorizationResult:
    category: str
    confidence_score: int
    matched_rule: str
    all_matches: list[tuple[str, int, str]] = field(default_factory=list)


def categorize_transaction(
    description: str,
    merchant: str | None,
    payment_mode: str | None,
) -> CategorizationResult:
    rules = get_rules()
    text = _prepare_text(description, merchant, payment_mode)

    matches: list[tuple[str, int, str]] = []

    for pattern, category, confidence, is_merchant in rules:
        if is_merchant and merchant:
            if _match_merchant(merchant, pattern):
                matches.append((category, confidence, f"merchant:{pattern}"))
        elif _match_keyword(text, pattern):
            matches.append((category, confidence, f"keyword:{pattern}"))

    if not matches:
        return CategorizationResult(
            category="Others",
            confidence_score=30,
            matched_rule="no_match",
        )

    best = max(matches, key=lambda m: m[1])
    category, score, rule = best

    top_two = sorted(matches, key=lambda m: m[1], reverse=True)[:2]
    same_category = all(m[0] == category for m in top_two)

    if same_category and len(top_two) > 1:
        score = min(100, score + 5)

    if score < 70:
        return CategorizationResult(
            category="Others",
            confidence_score=score,
            matched_rule=f"{rule} (confidence {score})",
            all_matches=matches,
        )

    return CategorizationResult(
        category=category,
        confidence_score=min(100, score),
        matched_rule=rule,
        all_matches=matches,
    )


def _prepare_text(
    description: str, merchant: str | None, payment_mode: str | None
) -> str:
    parts = [description or ""]
    if payment_mode:
        parts.append(payment_mode)
    return " ".join(parts).lower()


def _match_merchant(merchant: str, pattern: str) -> bool:
    m = merchant.lower().strip()
    p = pattern.lower().strip()
    return m == p or m.startswith(p) or m.endswith(p) or p in m


def _match_keyword(text: str, pattern: str) -> bool:
    return re.search(r"\b" + re.escape(pattern) + r"\b", text) is not None
