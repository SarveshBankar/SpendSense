from fastapi import APIRouter

router = APIRouter()


@router.get(
    "/health",
    summary="Health check endpoint",
    description="Returns the current health status of the API. Use this endpoint "
    "for monitoring and load balancer health checks.",
    tags=["health"],
    responses={
        200: {
            "description": "API is healthy",
            "content": {
                "application/json": {
                    "example": {"status": "ok", "message": "SpendSense API is running"}
                }
            },
        }
    },
)
def health_check():
    return {
        "status": "ok",
        "message": "SpendSense API is running",
    }
