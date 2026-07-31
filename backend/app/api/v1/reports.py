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


@router.get(
    "/list",
    response_model=ReportListResponse,
    summary="List available report periods",
    description="Returns the list of months and years that have transaction data "
    "available for report generation.",
    responses={
        200: {"description": "Available periods retrieved"},
        401: {"description": "Authentication required"},
    },
)
def list_reports(
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.list_available(current_user)


@router.get(
    "/monthly",
    response_model=ReportResponse,
    summary="Generate monthly report",
    description="Generates a detailed financial report for a specific month and year. "
    "Includes summary stats, category breakdown, merchant breakdown, daily trends, "
    "and personalized recommendations.",
    responses={
        200: {"description": "Report generated"},
        401: {"description": "Authentication required"},
    },
)
def monthly_report(
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    year: int = Query(..., ge=2020, description="Year (e.g. 2024)"),
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.monthly(current_user, month, year)


@router.get(
    "/yearly",
    response_model=ReportResponse,
    summary="Generate yearly report",
    description="Generates a comprehensive yearly financial report including "
    "monthly breakdown, category analysis, and year-over-year comparisons.",
    responses={
        200: {"description": "Report generated"},
        401: {"description": "Authentication required"},
    },
)
def yearly_report(
    year: int = Query(..., ge=2020, description="Year (e.g. 2024)"),
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.yearly(current_user, year)


@router.get(
    "/custom",
    response_model=ReportResponse,
    summary="Generate custom date range report",
    description="Generates a financial report for an arbitrary date range specified "
    "by start and end dates.",
    responses={
        200: {"description": "Report generated"},
        401: {"description": "Authentication required"},
    },
)
def custom_report(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends(_get_report_service),
):
    return service.custom(current_user, start_date, end_date)


@router.get(
    "/export/csv",
    summary="Export transactions as CSV",
    description="Downloads transaction data as a CSV file. Optionally filter by "
    "month and year. Content-Disposition header is set for file download.",
    responses={
        200: {
            "description": "CSV file download",
            "content": {"text/csv": {}},
        },
        401: {"description": "Authentication required"},
    },
)
def export_csv(
    month: int | None = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: int | None = Query(None, ge=2020, description="Filter by year"),
    current_user: User = Depends(get_current_user),
    service: ExportService = Depends(_get_export_service),
):
    csv_content = service.export_csv(current_user, month, year)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=spendsense_export_{month or ''}_{year or ''}.csv"
        },
    )


@router.get(
    "/export/excel",
    summary="Export report as Excel",
    description="Downloads a formatted Excel (.xlsx) report with Transactions and "
    "Summary sheets. Optionally filter by month and year.",
    responses={
        200: {
            "description": "Excel file download",
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}
            },
        },
        401: {"description": "Authentication required"},
    },
)
def export_excel(
    month: int | None = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: int | None = Query(None, ge=2020, description="Filter by year"),
    current_user: User = Depends(get_current_user),
    service: ExportService = Depends(_get_export_service),
):
    data = service.export_excel(current_user, month, year)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=spendsense_report_{month or ''}_{year or ''}.xlsx"
        },
    )


@router.get(
    "/export/pdf",
    summary="Export report as PDF",
    description="Downloads a professionally formatted PDF report with financial summary, "
    "category breakdown, health score, and recommendations. Optionally filter by month and year.",
    responses={
        200: {
            "description": "PDF file download",
            "content": {"application/pdf": {}},
        },
        401: {"description": "Authentication required"},
    },
)
def export_pdf(
    month: int | None = Query(None, ge=1, le=12, description="Filter by month (1-12)"),
    year: int | None = Query(None, ge=2020, description="Filter by year"),
    current_user: User = Depends(get_current_user),
    service: ExportService = Depends(_get_export_service),
):
    data = service.export_pdf(current_user, month, year)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=spendsense_report_{month or ''}_{year or ''}.pdf"
        },
    )
