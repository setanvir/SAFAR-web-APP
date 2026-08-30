"""
Comprehensive Tests for Database-Backed Bookings and Cancellation Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def traveler_auth_header():
    res = client.post("/api/auth/login", json={
        "email": "traveler@safar.com",
        "password": "traveler123"
    })
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def admin_auth_header():
    res = client.post("/api/auth/login", json={
        "email": "admin@safar.com",
        "password": "admin123"
    })
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}


class TestBookingsAPI:
    """Tests for database-backed booking reservation and cancellation."""

    def test_database_backed_reservation_flow(self, traveler_auth_header):
        payload = {
            "package_id": 1,
            "guests": 2,
            "payment_method": "credit_card",
            "payment_details": {"card_number": "4111222233334444"},
            "booking_date": "2026-09-15"
        }
        res = client.post("/api/bookings/reserve", json=payload, headers=traveler_auth_header)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["booking"]["guests"] == 2
        assert "payment" in data

    def test_reservation_invalid_package_fails(self, traveler_auth_header):
        payload = {
            "package_id": 99999,
            "guests": 1,
            "payment_method": "demo"
        }
        res = client.post("/api/bookings/reserve", json=payload, headers=traveler_auth_header)
        assert res.status_code == 404

    def test_my_bookings_authenticated(self, traveler_auth_header):
        res = client.get("/api/bookings/my-bookings", headers=traveler_auth_header)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_my_bookings_unauthorized_fails(self):
        res = client.get("/api/bookings/my-bookings")
        assert res.status_code == 401

    def test_cancel_booking_success(self, traveler_auth_header):
        # Create booking to cancel
        res = client.post("/api/bookings/reserve", json={
            "package_id": 2,
            "guests": 1,
            "payment_method": "demo"
        }, headers=traveler_auth_header)
        b_id = res.json()["booking"]["id"]

        # Cancel it
        cancel_res = client.patch(f"/api/bookings/{b_id}/cancel", headers=traveler_auth_header)
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "cancelled"

        # Cancel again fails with conflict
        dup_res = client.patch(f"/api/bookings/{b_id}/cancel", headers=traveler_auth_header)
        assert dup_res.status_code == 409

    def test_cancel_nonexistent_booking(self, traveler_auth_header):
        res = client.patch("/api/bookings/999999/cancel", headers=traveler_auth_header)
        assert res.status_code == 404
