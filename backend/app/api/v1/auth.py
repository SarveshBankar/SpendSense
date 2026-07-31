from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services.auth import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Creates a new user with full name, email, and password. "
    "Password must be at least 8 characters with uppercase, lowercase, "
    "digit, and special character. Returns JWT access + refresh tokens.",
    responses={
        201: {"description": "User created successfully"},
        409: {"description": "User with this email already exists"},
        422: {"description": "Validation error (weak password, invalid email)"},
    },
)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate with email and password",
    description="Validates credentials and returns JWT access + refresh tokens. "
    "Access token expires in 60 minutes, refresh token in 7 days.",
    responses={
        200: {"description": "Login successful"},
        401: {"description": "Invalid email or password"},
        403: {"description": "Account is deactivated"},
    },
)
def login(data: UserLogin, service: AuthService = Depends(get_auth_service)):
    return service.login(data)


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access token + new refresh token. "
    "Use this when the access token expires to maintain the session.",
    responses={
        200: {"description": "Tokens refreshed successfully"},
        401: {"description": "Invalid or expired refresh token"},
    },
)
def refresh(
    data: RefreshTokenRequest, service: AuthService = Depends(get_auth_service)
):
    return service.refresh(data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
    description="Returns the profile information of the currently authenticated user "
    "based on the Bearer token provided.",
    responses={
        200: {"description": "User profile retrieved"},
        401: {"description": "Invalid or expired token"},
    },
)
def me(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: AuthService = Depends(get_auth_service),
):
    return service.get_current_user(credentials)
