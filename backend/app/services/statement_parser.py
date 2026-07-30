import uuid
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.statement import Statement
from app.models.transaction import Transaction
from app.models.user import User
from app.repositories.statement import StatementRepository
from app.repositories.transaction import TransactionRepository
from app.schemas.transaction import ParseResultResponse, TransactionResponse
from app.services.parsers.csv_parser import parse_csv
from app.services.parsers.pdf_parser import parse_pdf
from app.utils.file_storage import get_file_path


class StatementParserService:
    def __init__(self, db: Session):
        self.db = db
        self.stmt_repo = StatementRepository()
        self.tx_repo = TransactionRepository()

    def parse(
        self, current_user: User, statement_id: uuid.UUID
    ) -> ParseResultResponse:
        statement = self.stmt_repo.get_by_id(self.db, statement_id)
        if not statement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statement not found",
            )
        if statement.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to parse this statement",
            )

        self.tx_repo.delete_by_statement(self.db, statement.id)

        file_path = get_file_path(
            str(current_user.id), statement.stored_file_name
        )
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statement file not found on disk",
            )

        if statement.file_type == "csv":
            parsed_rows, parse_errors = parse_csv(file_path)
        elif statement.file_type == "pdf":
            parsed_rows, parse_errors = parse_pdf(file_path)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {statement.file_type}",
            )

        successful = 0
        db_transactions: list[Transaction] = []
        for row in parsed_rows:
            try:
                tx = Transaction(
                    statement_id=statement.id,
                    date=row["date"],
                    description=row["description"],
                    amount=row["amount"],
                    balance=row["balance"],
                    transaction_type=row["transaction_type"],
                    merchant=row["merchant"],
                    payment_mode=row["payment_mode"],
                    reference_number=row["reference_number"],
                    raw_text=row["raw_text"],
                    row_index=row["row_index"],
                )
                db_transactions.append(tx)
                successful += 1
            except Exception as e:
                parse_errors.append(
                    f"Row {row.get('row_index', '?')}: {e}"
                )

        self.tx_repo.bulk_create(self.db, db_transactions)

        statement.status = "completed"
        self.db.commit()

        return ParseResultResponse(
            status="completed",
            total_rows=len(parsed_rows) + len(parse_errors),
            successful=successful,
            failed=len(parse_errors),
            errors=parse_errors[:100],
            transactions=[
                TransactionResponse.model_validate(t)
                for t in db_transactions
            ],
        )
