import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.session import engine

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger("spendsense")

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Personal Finance Intelligence Platform",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


register_exception_handlers(app)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created (if not existing)")


@app.on_event("shutdown")
def on_shutdown():
    logger.info("Shutting down SpendSense API")


@app.get("/")
def root():
    return {"message": "SpendSense API"}
