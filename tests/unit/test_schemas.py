from app.api.schemas.endpoint import EndpointCreate
from app.api.schemas.user import UserLogin


def test_endpoint_schema_validates_method_and_url() -> None:
    payload = EndpointCreate(
        name="API",
        url="https://example.com/health",
        method="GET",
        check_interval=30,
        is_active=True,
    )

    assert payload.method == "GET"
    assert str(payload.url) == "https://example.com/health"


def test_user_login_schema_accepts_email_pattern() -> None:
    payload = UserLogin(email="user@example.com", password="secret123")
    assert payload.email == "user@example.com"
