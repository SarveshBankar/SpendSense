from fastapi import APIRouter, Depends
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
    summary="Generate financial insights from user transactions",
)
def get_insights(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(_get_service),
):
    return service.generate_insights(current_user.id)
