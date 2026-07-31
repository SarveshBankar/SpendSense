import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.headers import SecureHeadersMiddleware
from app.core.logging import setup_logging
from app.core.rate_limit import RateLimitMiddleware

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger("spendsense")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SpendSense API v%s started", settings.version)
    yield
    logger.info("Shutting down SpendSense API")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Personal Finance Intelligence Platform — Production-ready SaaS backend",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={"name": "SpendSense Team", "url": "https://spendsense.app"},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.secure_headers_enabled:
    app.add_middleware(SecureHeadersMiddleware)

app.add_middleware(RateLimitMiddleware)


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


@app.get("/")
def root():
    return {"message": "SpendSense API", "version": settings.version}
