"""
Comprehensive Tests for SAFAR Admin Control Suite Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def admin_token():
    res = client.post("/api/auth/login", json={
        "email": "admin@safar.com",
        "password": "admin123"
    })
    return res.json()["token"]


@pytest.fixture(scope="module")
def traveler_token():
    res = client.post("/api/auth/login", json={
        "email": "traveler@safar.com",
        "password": "traveler123"
    })
    return res.json()["token"]


class TestAdminEndpoints:
    """Tests for all Admin overview, moderation, CRUD, and settings endpoints."""

    def test_overview_unauthorized_fails(self):
        res = client.get("/api/admin/overview")
        assert res.status_code == 401

    def test_overview_forbidden_for_traveler(self, traveler_token):
        res = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {traveler_token}"})
        assert res.status_code == 403

    def test_overview_success_for_admin(self, admin_token):
        res = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        data = res.json()
        assert "kpis" in data
        assert "gross_revenue" in data["kpis"]
        assert "recent_bookings" in data

    def test_analytics_success_for_admin(self, admin_token):
        res = client.get("/api/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        data = res.json()
        assert "category_distribution" in data
        assert "revenue_by_type" in data

    def test_packages_crud_lifecycle(self, admin_token):
        # 1. Create Package
        create_res = client.post("/api/admin/packages", json={
            "type": "tour",
            "title": "Glacier National Park Expedition",
            "location": "Montana, USA",
            "price": 1850.00,
            "description": "7 days exploring breathtaking alpine trails and pristine glaciers.",
            "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
            "duration_days": 7
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert create_res.status_code == 201
        created_pkg = create_res.json()
        pkg_id = created_pkg["id"]
        assert created_pkg["title"] == "Glacier National Park Expedition"

        # 2. Update Package
        update_res = client.patch(f"/api/admin/packages/{pkg_id}", json={
            "price": 1950.00
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert update_res.status_code == 200
        assert update_res.json()["price"] == 1950.00

        # 3. Delete Package
        del_res = client.delete(f"/api/admin/packages/{pkg_id}", headers={"Authorization": f"Bearer {admin_token}"})
        assert del_res.status_code == 200

    def test_agencies_listing_and_verification(self, admin_token):
        # List agencies
        res = client.get("/api/admin/agencies", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        agencies = res.json()
        assert len(agencies) >= 1

        # Verify agency
        agency_id = agencies[0]["id"]
        verify_res = client.patch(
            f"/api/admin/agencies/{agency_id}/verification",
            json={"status": "verified"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["verification_status"] == "verified"

    def test_bookings_listing_and_moderation(self, admin_token):
        res = client.get("/api/admin/bookings", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        bookings = res.json()
        assert len(bookings) >= 1

        booking_id = bookings[0]["id"]
        status_res = client.patch(
            f"/api/admin/bookings/{booking_id}/status",
            json={"status": "approved"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert status_res.status_code == 200
        assert status_res.json()["status"] == "approved"

    def test_users_directory(self, admin_token):
        res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        users = res.json()
        assert len(users) >= 3

    def test_payments_ledger(self, admin_token):
        res = client.get("/api/admin/payments", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        payments = res.json()
        assert len(payments) >= 1

    def test_activity_logs(self, admin_token):
        res = client.get("/api/admin/activity", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        logs = res.json()
        assert len(logs) >= 1

    def test_platform_settings_read_and_update(self, admin_token):
        get_res = client.get("/api/admin/settings", headers={"Authorization": f"Bearer {admin_token}"})
        assert get_res.status_code == 200

        update_res = client.patch(
            "/api/admin/settings",
            json={"key": "commission_rate", "value": "15.0"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["value"] == "15.0"
