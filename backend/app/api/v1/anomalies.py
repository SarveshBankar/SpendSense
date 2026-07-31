import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.anomaly import (
    AnomalyResponse,
    AnomalyListResponse,
    AnomalyResolveResponse,
    PredictionResponse,
    HealthScoreResponse,
)
from app.repositories.anomaly import AnomalyRepository
from app.services.prediction import get_prediction_service
from app.services.health_score import get_health_score_grader
from app.services.anomaly_scanner import get_anomaly_scanner

router = APIRouter(prefix="/anomalies", tags=["anomalies"])


@router.get(
    "",
    response_model=AnomalyListResponse,
    summary="List anomalies",
    description="Get all flagged anomaly transactions for the current user.",
)
def list_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    repo = AnomalyRepository()
    anomalies = repo.list_by_user(db, current_user.id, skip=skip, limit=limit)
    unresolved_count = repo.unresolved_count(db, current_user.id)
    total = repo.count_by_user(db, current_user.id)
    return AnomalyListResponse(
        anomalies=[
            AnomalyResponse(
                id=a.id,
                type=a.type,
                severity=a.severity,
                description=a.description,
                amount=a.amount,
                category=a.category,
                resolved=a.resolved,
                created_at=a.created_at,
            )
            for a in anomalies
        ],
        unresolved_count=unresolved_count,
        total=total,
    )


@router.patch(
    "/{anomaly_id}/resolve",
    response_model=AnomalyResolveResponse,
    summary="Resolve an anomaly",
    description="Mark a flagged anomaly transaction as resolved.",
)
def resolve_anomaly(
    anomaly_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = AnomalyRepository()
    anomaly = repo.get_by_id(db, anomaly_id)
    if not anomaly or str(anomaly.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anomaly not found")
    repo.resolve(db, anomaly_id)
    return AnomalyResolveResponse(message="Anomaly resolved.")


@router.post(
    "/resolve-all",
    response_model=AnomalyResolveResponse,
    summary="Resolve all anomalies",
    description="Mark all unresolved anomalies as resolved for the current user.",
)
def resolve_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scanner = get_anomaly_scanner(db)
    count = scanner.resolve_all(current_user.id)
    return AnomalyResolveResponse(message=f"{count} anomalies resolved.")


@router.get(
    "/predict",
    response_model=PredictionResponse,
    summary="Predict next month finances",
    description="Get AI-powered predictions for next month's income, expenses, and savings.",
)
def predict(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = get_prediction_service(db)
    result = service.predict_next_month(current_user.id)
    return PredictionResponse(**result)


@router.get(
    "/health-score",
    response_model=HealthScoreResponse,
    summary="Get financial health score",
    description="Calculate and return the user's financial health score with grade and suggestions.",
)
def health_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    grader = get_health_score_grader(db)
    result = grader.grade(current_user.id)
    return HealthScoreResponse(**result)
