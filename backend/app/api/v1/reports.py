from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import ReportResponse, ReportListResponse
from app.services.report import ReportService
from app.services.export import ExportService

router = APIRouter(prefix="/reports", tags=["reports"])


def _get_report_service(db: Session = Depends(get_db)) -> ReportService:
    return ReportService(db)


def _get_export_service(db: Session = Depends(get_db)) -> ExportService:
    return ExportService(db)


@router.get("/list", response_model=ReportListResponse, summary="List available months/years")
def list_reports(
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.list_available(current_user)


@router.get("/monthly", response_model=ReportResponse, summary="Monthly report")
def monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.monthly(current_user, month, year)


@router.get("/yearly", response_model=ReportResponse, summary="Yearly report")
def yearly_report(
    year: int = Query(..., ge=2020),
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.yearly(current_user, year)


@router.get("/custom", response_model=ReportResponse, summary="Custom date range report")
def custom_report(
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.custom(current_user, start_date, end_date)


# ------------------------------------------------------------------ #
#  Exports
# ------------------------------------------------------------------ #
@router.get("/export/csv", summary="Export CSV")
def export_csv(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020),
    current_user: User = Depends(get_current_user),
    service: ExportService = Depends(_get_export_service),
):
    csv_content = service.export_csv(current_user, month, year)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=spendsense_export_{month or ''}_{year or ''}.csv"},
    )


@router.get("/export/excel", summary="Export Excel")
def export_excel(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020),
    current_user: User = Depends(get_current_user),
    service: ExportService = Depends(_get_export_service),
):
    data = service.export_excel(current_user, month, year)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=spendsense_report_{month or ''}_{year or ''}.xlsx"},
    )


@router.get("/export/pdf", summary="Export PDF")
def export_pdf(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2020),
    current_user: User = Depends(get_current_user),
    service: ExportService = Depends(_get_export_service),
):
    data = service.export_pdf(current_user, month, year)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=spendsense_report_{month or ''}_{year or ''}.pdf"},
    )
