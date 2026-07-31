from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.insight import InsightsResponse
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/insights", tags=["insights"])


def _get_service(db: Session = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get(
    "",
    response_model=InsightsResponse,
    summary="Generate financial insights",
    description="Analyzes all user transactions and generates a comprehensive set of "
    "financial insights including spending patterns, savings rate, category breakdown, "
    "top merchants, suspicious transactions, subscription detection, and personalized "
    "recommendations. Also computes a financial health score (0–100).",
    responses={
        200: {
            "description": "Insights generated successfully",
        },
        401: {"description": "Authentication required"},
    },
)
def get_insights(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(_get_service),
):
    return service.generate_insights(current_user.id)
