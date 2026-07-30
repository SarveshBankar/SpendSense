from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.statements import router as statements_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.insights import router as insights_router
from app.api.v1.budgets import router as budgets_router
from app.api.v1.goals import router as goals_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.profile import router as profile_router
from app.api.v1.settings import router as settings_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(statements_router)
api_router.include_router(transactions_router)
api_router.include_router(insights_router)
api_router.include_router(budgets_router)
api_router.include_router(goals_router)
api_router.include_router(analytics_router)
api_router.include_router(profile_router)
api_router.include_router(settings_router)
api_router.include_router(reports_router)
