from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsResponse
from app.services.analytics_service import AdvancedAnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _get_service(db: Session = Depends(get_db)) -> AdvancedAnalyticsService:
    return AdvancedAnalyticsService(db)


@router.get(
    "",
    response_model=AnalyticsResponse,
    summary="Advanced analytics dashboard",
    description="Returns comprehensive analytics data including KPIs, monthly/weekly/daily "
    "trends, category growth, merchant spending, subscription detection, income sources, "
    "spending distribution, cash flow analysis, spending predictions, and a calendar heatmap. "
    "Supports filtering by date range, month, year, category, and merchant.",
    responses={
        200: {"description": "Analytics data retrieved"},
        401: {"description": "Authentication required"},
    },
)
def get_analytics(
    start_date: str | None = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    month: int | None = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: int | None = Query(None, ge=2020, le=2100, description="Filter by year"),
    category: str | None = Query(None, description="Filter by category name"),
    merchant: str | None = Query(None, description="Filter by merchant name"),
    current_user: User = Depends(get_current_user),
    service: AdvancedAnalyticsService = Depends(_get_service),
):
    return service.generate(
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        month=month,
        year=year,
        category=category,
        merchant=merchant,
    )
