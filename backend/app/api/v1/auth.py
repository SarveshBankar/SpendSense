from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
def login(data: UserLogin, service: AuthService = Depends(get_auth_service)):
    return service.login(data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
def me(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: AuthService = Depends(get_auth_service),
):
    return service.get_current_user(credentials)
