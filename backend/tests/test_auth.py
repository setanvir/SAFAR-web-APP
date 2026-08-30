"""
Comprehensive Tests for Authentication Endpoints and Security Helpers.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token
)

client = TestClient(app)


class TestSecurityUtilities:
    """Tests for bcrypt password hashing and JWT token handling."""

    def test_password_hash_and_verification(self):
        pwd = "SecretPassword123!"
        hashed = get_password_hash(pwd)
        assert hashed != pwd
        assert verify_password(pwd, hashed) is True
        assert verify_password("WrongPassword", hashed) is False

    def test_verify_password_empty_handling(self):
        assert verify_password("", "hash") is False
        assert verify_password("pass", "") is False
        assert verify_password(None, None) is False

    def test_jwt_create_and_decode(self):
        data = {"sub": "1", "email": "test@safar.com", "role": "admin"}
        token = create_access_token(data)
        assert isinstance(token, str)
        decoded = decode_access_token(token)
        assert decoded["sub"] == "1"
        assert decoded["email"] == "test@safar.com"
        assert decoded["role"] == "admin"


class TestAuthEndpoints:
    """Tests for login, registration, and profile endpoints."""

    def test_login_admin_success(self):
        response = client.post("/api/auth/login", json={
            "email": "admin@safar.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data
        assert data["user"]["role"] == "admin"

    def test_login_wrong_password_fails(self):
        response = client.post("/api/auth/login", json={
            "email": "admin@safar.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]

    def test_login_unknown_email_fails(self):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@safar.com",
            "password": "password123"
        })
        assert response.status_code == 401

    def test_register_traveler_success(self):
        import uuid
        unique_email = f"traveler_{uuid.uuid4().hex[:8]}@example.com"
        response = client.post("/api/auth/register", json={
            "name": "New Traveler",
            "email": unique_email,
            "password": "securepassword123",
            "role": "traveler"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["user"]["role"] == "traveler"

    def test_register_agency_success(self):
        import uuid
        unique_email = f"agency_{uuid.uuid4().hex[:8]}@example.com"
        response = client.post("/api/auth/register", json={
            "name": "Summit Travel Agency",
            "email": unique_email,
            "password": "securepassword123",
            "role": "agency",
            "company_name": "Summit Travel Ltd",
            "phone": "+1 555 123 4567"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["role"] == "agency"

    def test_register_blocks_admin_escalation(self):
        import uuid
        unique_email = f"attacker_{uuid.uuid4().hex[:8]}@example.com"
        response = client.post("/api/auth/register", json={
            "name": "Hacker",
            "email": unique_email,
            "password": "password123",
            "role": "admin"  # Attempt to create admin
        })
        # Validation error (schema pattern) or forced to traveler
        assert response.status_code in [422, 201]
        if response.status_code == 201:
            assert response.json()["user"]["role"] == "traveler"

    def test_get_current_user_profile(self):
        # Login first
        login_res = client.post("/api/auth/login", json={
            "email": "admin@safar.com",
            "password": "admin123"
        })
        token = login_res.json()["token"]

        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "admin@safar.com"

    def test_get_profile_unauthorized_fails(self):
        res = client.get("/api/auth/me")
        assert res.status_code == 401
