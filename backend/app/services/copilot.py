import uuid
from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.repositories.transaction import TransactionRepository
from app.repositories.budget import BudgetRepository
from app.repositories.conversation import ConversationRepository
from app.services.analytics import AnalyticsService


class CopilotService:
    def __init__(self, db: Session):
        self.db = db
        self.tx_repo = TransactionRepository()
        self.budget_repo = BudgetRepository()
        self.conv_repo = ConversationRepository()
        self.analytics = AnalyticsService(db)

    def _get_txns(self, user_id: uuid.UUID) -> list[Transaction]:
        return self.tx_repo.list_by_user(self.db, user_id)

    def process_message(self, user_id: uuid.UUID, message: str) -> str:
        self.conv_repo.create(self.db, user_id, "user", message)
        reply = self._generate_reply(user_id, message)
        self.conv_repo.create(self.db, user_id, "assistant", reply)
        return reply

    def get_history(self, user_id: uuid.UUID) -> list:
        return self.conv_repo.list_by_user(self.db, user_id)

    def clear_history(self, user_id: uuid.UUID) -> None:
        self.conv_repo.clear_by_user(self.db, user_id)

    def _generate_reply(self, user_id: uuid.UUID, message: str) -> str:
        msg = message.lower().strip()

        if not msg:
            return "I didn't catch that. Try asking about your spending, savings, or budgets."

        if any(w in msg for w in ["hello", "hi ", "hey", "help", "what can"]):
            return (
                "I'm your AI Financial Copilot. Here's what I can help with:\n\n"
                "• Where did I spend the most this month?\n"
                "• How much did I save?\n"
                "• Compare this month with last month\n"
                "• Which subscriptions should I cancel?\n"
                "• Give me budgeting advice\n"
                "• Predict next month's expenses\n"
                "• Show unusual transactions\n"
                "• How can I reduce spending?"
            )

        txs = self._get_txns(user_id)
        if not txs:
            return "You don't have any transactions yet. Upload and parse a bank statement to get started."

        if any(w in msg for w in ["spend most", "top category", "highest spend", "where did i spend", "biggest category"]):
            return self._answer_top_category(txs)

        if any(w in msg for w in ["how much did i save", "savings", "net savings", "saved this month"]):
            return self._answer_savings(txs)

        if any(w in msg for w in ["compare", "vs", "versus", "last month", "previous month"]):
            return self._answer_compare_months(txs)

        if any(w in msg for w in ["subscription", "recurring", "cancel", "netflix", "spotify"]):
            return self._answer_subscriptions(txs)

        if any(w in msg for w in ["budget", "budgeting advice", "spending limit", "overspend"]):
            return self._answer_budget_advice(user_id, txs)

        if any(w in msg for w in ["predict", "next month", "forecast", "expected"]):
            return self._answer_prediction(txs)

        if any(w in msg for w in ["unusual", "anomaly", "suspicious", "large", "abnormal", "flag"]):
            return self._answer_anomalies(user_id, txs)

        if any(w in msg for w in ["reduce spend", "save money", "cut cost", "spend less", "reduce expense"]):
            return self._answer_reduce_spending(txs)

        if any(w in msg for w in ["income", "earned", "total income", "how much did i earn"]):
            return self._answer_income(txs)

        if any(w in msg for w in ["total expense", "total spend", "how much did i spend", "total spending"]):
            return self._answer_total_expense(txs)

        if any(w in msg for w in ["category", "breakdown", "where my money"]):
            return self._answer_category_breakdown(txs)

        if any(w in msg for w in ["health", "score", "grade", "financial health", "how healthy"]):
            return self._answer_health_score(txs)

        return (
            "I can help you understand your finances. Try asking:\n\n"
            "• Where did I spend the most this month?\n"
            "• How much did I save?\n"
            "• Compare this month with last month\n"
            "• Which subscriptions should I cancel?\n"
            "• Predict next month's expenses\n"
            "• Show unusual transactions"
        )

    def _answer_top_category(self, txs: list[Transaction]) -> str:
        expenses = [t for t in txs if t.transaction_type == "debit"]
        if not expenses:
            return "No expense transactions found."

        cat_spend: dict[str, float] = defaultdict(float)
        for t in expenses:
            cat_spend[t.category or "Others"] += t.amount

        sorted_cats = sorted(cat_spend.items(), key=lambda x: -x[1])
        top_cat, top_amt = sorted_cats[0]

        lines = [f"Your top spending category is **{top_cat}** at ₹{top_amt:,.0f}.\n"]
        lines.append("\nHere's your full breakdown:\n")
        for cat, amt in sorted_cats[:6]:
            pct = (amt / sum(cat_spend.values()) * 100)
            lines.append(f"• {cat}: ₹{amt:,.0f} ({pct:.1f}%)")
        return "\n".join(lines)

    def _answer_savings(self, txs: list[Transaction]) -> str:
        income = sum(t.amount for t in txs if t.transaction_type == "credit")
        expense = sum(t.amount for t in txs if t.transaction_type == "debit")
        net = income - expense
        rate = (net / income * 100) if income > 0 else 0

        status = "great" if rate >= 20 else "okay" if rate >= 10 else "needs improvement"
        return (
            f"📊 **Savings Summary**\n\n"
            f"• Income: ₹{income:,.0f}\n"
            f"• Expenses: ₹{expense:,.0f}\n"
            f"• Net Savings: ₹{net:,.0f}\n"
            f"• Savings Rate: {rate:.1f}%\n\n"
            f"Your savings rate is **{status}**. "
            + ("Aim for at least 20%. Try cutting discretionary spending." if rate < 20
               else "Keep up the good work!" if rate >= 20
               else "Consider reducing non-essential expenses.")
        )

    def _answer_compare_months(self, txs: list[Transaction]) -> str:
        expenses = [t for t in txs if t.transaction_type == "debit"]
        monthly: dict[str, float] = defaultdict(float)
        for t in expenses:
            monthly[t.date[:7]] += t.amount

        sorted_months = sorted(monthly.items())
        if len(sorted_months) < 2:
            return "Not enough data to compare months. You need at least 2 months of transactions."

        curr_month, curr_amt = sorted_months[-1]
        prev_month, prev_amt = sorted_months[-2]
        change = ((curr_amt - prev_amt) / prev_amt * 100) if prev_amt > 0 else 0

        direction = "increased" if change > 0 else "decreased"
        emoji = "📈" if change > 0 else "📉"

        curr_income = sum(t.amount for t in txs if t.transaction_type == "credit" and t.date[:7] == curr_month)
        prev_income = sum(t.amount for t in txs if t.transaction_type == "credit" and t.date[:7] == prev_month)

        return (
            f"{emoji} **Month Comparison**\n\n"
            f"**{prev_month}** vs **{curr_month}**\n\n"
            f"Expenses: ₹{prev_amt:,.0f} → ₹{curr_amt:,.0f} ({change:+.1f}%)\n"
            f"Income: ₹{prev_income:,.0f} → ₹{curr_income:,.0f}\n\n"
            + ("Your spending has gone up. Review discretionary categories." if change > 5
               else "Your spending is under control." if change < -5
               else "Your spending is relatively stable.")
        )

    def _answer_subscriptions(self, txs: list[Transaction]) -> str:
        expenses = [t for t in txs if t.transaction_type == "debit"]
        merchant_counts: dict[str, list[float]] = defaultdict(list)
        for t in expenses:
            key = t.merchant or t.description.strip().lower()
            merchant_counts[key].append((t.amount, t.description, t.category))

        subs = []
        for merchant, entries in merchant_counts.items():
            if len(entries) >= 2:
                amounts = [e[0] for e in entries]
                avg = sum(amounts) / len(amounts)
                if all(abs(a - avg) / avg <= 0.35 for a in amounts):
                    subs.append({
                        "merchant": merchant,
                        "amount": round(avg, 2),
                        "count": len(entries),
                        "category": entries[0][2] or "Unknown",
                    })

        if not subs:
            return "No recurring subscriptions detected. Try uploading more transaction data."

        subs.sort(key=lambda x: -x["count"])
        total = round(sum(s["amount"] for s in subs), 2)
        annual = round(total * 12, 2)

        lines = [f"**Recurring Subscriptions Detected** ({len(subs)} found)\n"]
        for s in subs:
            lines.append(f"• {s['merchant'][:40]}: ₹{s['amount']:,.0f}/mo ({s['category']})")
        lines.append(f"\nTotal: ₹{total:,.0f}/month | ₹{annual:,.0f}/year")

        non_essential = [s for s in subs if s['category'] not in (
            "Bills", "Rent", "Healthcare", "Education", "Insurance"
        )]
        if non_essential:
            lines.append(f"\n💡 Potential savings: Cancel non-essential subscriptions "
                        f"(₹{sum(s['amount'] for s in non_essential):,.0f}/mo)")

        return "\n".join(lines)

    def _answer_budget_advice(self, user_id: uuid.UUID, txs: list[Transaction]) -> str:
        expenses = [t for t in txs if t.transaction_type == "debit"]
        total_expense = sum(t.amount for t in expenses)
        total_income = sum(t.amount for t in txs if t.transaction_type == "credit")

        budgets = self.budget_repo.list_by_user(self.db, user_id)
        cat_spend: dict[str, float] = defaultdict(float)
        for t in expenses:
            cat_spend[t.category or "Others"] += t.amount

        lines = ["**Budgeting Advice**\n"]

        if total_income > 0:
            lines.append(f"Your income is ₹{total_income:,.0f} and expenses are ₹{total_expense:,.0f}.")
            lines.append(f"That's {(total_expense / total_income * 100):.1f}% of your income.\n")

        lines.append("**Recommended Budget Split (50/30/20 Rule):**\n")
        if total_income > 0:
            needs = total_income * 0.5
            wants = total_income * 0.3
            savings_target = total_income * 0.2
            lines.append(f"• Needs (50%): ₹{needs:,.0f}/mo")
            lines.append(f"• Wants (30%): ₹{wants:,.0f}/mo")
            lines.append(f"• Savings (20%): ₹{savings_target:,.0f}/mo\n")

        if budgets:
            lines.append("**Current Budgets:**\n")
            for b in budgets:
                spent = cat_spend.get(b.category or "", 0)
                pct = (spent / b.monthly_budget * 100) if b.monthly_budget > 0 else 0
                status = "✅ On track" if pct <= 80 else "⚠️ Near limit" if pct <= 100 else "🚨 Exceeded"
                lines.append(f"• {b.category or 'Overall'}: ₹{spent:,.0f} / ₹{b.monthly_budget:,.0f} ({pct:.0f}%) {status}")

        return "\n".join(lines)

    def _answer_prediction(self, txs: list[Transaction]) -> str:
        months = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
        for t in txs:
            month = t.date[:7]
            if t.transaction_type == "credit":
                months[month]["income"] += t.amount
            else:
                months[month]["expense"] += t.amount

        if len(months) < 2:
            return "Not enough data to make predictions. At least 2 months of data needed."

        sorted_m = sorted(months.items())
        expenses_vals = [v["expense"] for _, v in sorted_m]

        avg_expense = sum(expenses_vals) / len(expenses_vals)
        if len(expenses_vals) >= 3:
            recent_3 = expenses_vals[-3:]
            trend = (recent_3[-1] - recent_3[0]) / recent_3[0] * 100 if recent_3[0] > 0 else 0
        else:
            trend = 0

        last_month = sorted_m[-1][1]
        predicted_expense = avg_expense * (1 + trend / 100 * 0.5)
        predicted_income = last_month["income"] * 1.02
        predicted_savings = predicted_income - predicted_expense

        risk = "low" if predicted_savings > 0 else "high"

        last_key = sorted_m[-1][0]
        y, m = last_key.split("-")
        next_m = int(m) + 1
        next_y = int(y)
        if next_m > 12:
            next_m = 1
            next_y += 1
        next_label = f"{next_y:04d}-{next_m:02d}"

        return (
            f"🔮 **Spending Prediction for {next_label}**\n\n"
            f"Based on your last {len(expenses_vals)} months of data:\n\n"
            f"• Predicted Income: ₹{predicted_income:,.0f}\n"
            f"• Predicted Expenses: ₹{predicted_expense:,.0f}\n"
            f"• Predicted Savings: ₹{predicted_savings:,.0f}\n"
            f"• Confidence: {'High' if len(months) >= 4 else 'Medium' if len(months) >= 3 else 'Low'}\n"
            f"• Budget Risk: **{risk.upper()}**\n\n"
            + ("📉 Your spending trend is decreasing. Great!" if trend < -5
               else "📈 Your spending trend is increasing. Consider setting stricter budgets." if trend > 5
               else "📊 Your spending is stable. Keep monitoring.")
        )

    def _answer_anomalies(self, user_id: uuid.UUID, txs: list[Transaction]) -> str:
        self.analytics._get_transactions = lambda uid: txs
        insights_data = self.analytics.generate_insights(user_id)
        suspicious_cards = [c for c in insights_data.get("insights", []) if c.get("type") == "suspicious"]

        expenses = [t for t in txs if t.transaction_type == "debit"]

        lines = ["**Unusual Transactions & Anomalies**\n"]

        if suspicious_cards:
            sc = suspicious_cards[0]
            lines.append(f"⚠️ {sc['label']}: {sc['value']}")
            lines.append(f"   {sc['detail']}\n")

        thresholds = {
            "Food": 3000, "Groceries": 5000, "Shopping": 10000,
            "Entertainment": 3000, "Fuel": 5000, "Bills": 15000,
        }

        for cat, threshold in thresholds.items():
            large = [t for t in expenses if t.category == cat and t.amount > threshold]
            if large:
                lines.append(f"🚩 Large {cat} transactions (>{threshold:,.0f}):")
                for t in large[:3]:
                    lines.append(f"   • ₹{t.amount:,.0f} — {t.description[:50]} ({t.date})")

        if len(expenses) > 10:
            avg = sum(t.amount for t in expenses) / len(expenses)
            outliers = [t for t in expenses if t.amount > avg * 3]
            if outliers:
                lines.append(f"\n⚡ Statistically significant outliers ({len(outliers)}):")
                for t in outliers[:3]:
                    lines.append(f"   • ₹{t.amount:,.0f} — {t.description[:50]} ({t.date})")

        if len(lines) < 2:
            lines.append("No suspicious transactions detected. Your spending looks normal.")

        return "\n".join(lines)

    def _answer_reduce_spending(self, txs: list[Transaction]) -> str:
        expenses = [t for t in txs if t.transaction_type == "debit"]
        total = sum(t.amount for t in expenses)

        cat_spend: dict[str, float] = defaultdict(float)
        for t in expenses:
            cat_spend[t.category or "Others"] += t.amount
        sorted_cats = sorted(cat_spend.items(), key=lambda x: -x[1])

        lines = ["💡 **Ways to Reduce Spending**\n"]

        if sorted_cats:
            lines.append(f"Your total expenses are ₹{total:,.0f}.\n")
            lines.append("**Top categories to review:**\n")
            for cat, amt in sorted_cats[:5]:
                pct = (amt / total * 100)
                lines.append(f"• {cat}: ₹{amt:,.0f} ({pct:.1f}%)")

        non_essential = {k: v for k, v in cat_spend.items() if k in (
            "Shopping", "Entertainment", "Food", "Dining"
        )}
        if non_essential:
            ne_total = sum(non_essential.values())
            lines.append(f"\n**Discretionary spending:** ₹{ne_total:,.0f}")
            lines.append(f"Reducing this by 20% would save ₹{ne_total * 0.2:,.0f} per month "
                        f"(₹{ne_total * 0.2 * 12:,.0f}/year)")

        lines.append("\n**Quick tips:**\n")
        lines.append("• Set category budgets to track limits")
        lines.append("• Review subscriptions for unused services")
        lines.append("• Cook at home more often")
        lines.append("• Look for cheaper alternatives for recurring bills")

        return "\n".join(lines)

    def _answer_income(self, txs: list[Transaction]) -> str:
        income_txns = [t for t in txs if t.transaction_type == "credit"]
        total = sum(t.amount for t in income_txns)
        count = len(income_txns)

        by_source: dict[str, float] = defaultdict(float)
        for t in income_txns:
            by_source[t.description[:50] or "Unknown"] += t.amount
        top_sources = sorted(by_source.items(), key=lambda x: -x[1])[:3]

        lines = [f"💰 **Income Summary**\n"]
        lines.append(f"Total income: ₹{total:,.0f} across {count} transactions\n")
        if top_sources:
            lines.append("Top sources:\n")
            for src, amt in top_sources:
                lines.append(f"• {src}: ₹{amt:,.0f}")

        return "\n".join(lines)

    def _answer_total_expense(self, txs: list[Transaction]) -> str:
        expense_txns = [t for t in txs if t.transaction_type == "debit"]
        total = sum(t.amount for t in expense_txns)
        count = len(expense_txns)
        avg = total / count if count > 0 else 0

        cat_spend: dict[str, float] = defaultdict(float)
        for t in expense_txns:
            cat_spend[t.category or "Others"] += t.amount

        lines = [f"💳 **Expense Summary**\n"]
        lines.append(f"Total expenses: ₹{total:,.0f} across {count} transactions")
        lines.append(f"Average transaction: ₹{avg:,.0f}\n")
        lines.append("By category:\n")
        for cat, amt in sorted(cat_spend.items(), key=lambda x: -x[1])[:6]:
            pct = (amt / total * 100)
            lines.append(f"• {cat}: ₹{amt:,.0f} ({pct:.1f}%)")

        return "\n".join(lines)

    def _answer_category_breakdown(self, txs: list[Transaction]) -> str:
        expenses = [t for t in txs if t.transaction_type == "debit"]
        if not expenses:
            return "No expense transactions found."

        cat_spend: dict[str, float] = defaultdict(float)
        for t in expenses:
            cat_spend[t.category or "Others"] += t.amount

        total = sum(cat_spend.values())
        lines = ["**Category Breakdown**\n"]
        for cat, amt in sorted(cat_spend.items(), key=lambda x: -x[1]):
            pct = (amt / total * 100)
            bar = "█" * int(pct / 5) + "░" * max(0, 20 - int(pct / 5))
            lines.append(f"{bar} {cat}: ₹{amt:,.0f} ({pct:.1f}%)")

        return "\n".join(lines)

    def _answer_health_score(self, txs: list[Transaction]) -> str:
        self.analytics._get_transactions = lambda uid: txs
        data = self.analytics.generate_insights(uuid.UUID(int=0))
        score_data = data.get("financial_score", {})
        score = score_data.get("score", 0)

        if score >= 80: grade, label = "A", "Excellent"
        elif score >= 65: grade, label = "B", "Good"
        elif score >= 50: grade, label = "C", "Fair"
        elif score >= 35: grade, label = "D", "Needs Work"
        else: grade, label = "F", "Critical"

        breakdown = score_data.get("breakdown", {})

        return (
            f"🏆 **Financial Health Score: {score}/100 (Grade {grade} — {label})**\n\n"
            f"Breakdown:\n"
            f"• Savings Rate: {breakdown.get('savings_rate', 0)}%\n"
            f"• Expense Ratio: {breakdown.get('expense_ratio', 0)}%\n"
            f"• Categorized: {breakdown.get('categorized_pct', 0):.0f}%\n"
            f"• Transactions: {breakdown.get('total_transactions', 0)}\n\n"
            + (
                "✅ You're in excellent financial shape. Keep it up!"
                if score >= 80 else
                "👍 Your finances are healthy. Focus on increasing savings."
                if score >= 65 else
                "📊 Your finances are average. Set budgets and track spending."
                if score >= 50 else
                "⚠️ Several areas need improvement. Start with creating a budget."
                if score >= 35 else
                "🚨 Your finances need significant attention. Review all categories."
            )
        )

    def get_suggested_prompts(self) -> list[dict]:
        return [
            {"label": "Where did I spend most?", "query": "Where did I spend the most this month?"},
            {"label": "How much did I save?", "query": "How much did I save this month?"},
            {"label": "Compare months", "query": "Compare this month with last month"},
            {"label": "Subscriptions", "query": "Which subscriptions should I cancel?"},
            {"label": "Budgeting advice", "query": "Give me budgeting advice"},
            {"label": "Predict next month", "query": "Predict next month's expenses"},
            {"label": "Unusual transactions", "query": "Show unusual transactions"},
            {"label": "Reduce spending", "query": "How can I reduce spending?"},
        ]


def get_copilot_service(db: Session) -> CopilotService:
    return CopilotService(db)
