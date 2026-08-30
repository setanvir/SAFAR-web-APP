"""
Comprehensive Tests for Package API Endpoints and Filters.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestPackagesAPI:
    """Tests for package listing, filtering, search, and detail lookups."""

    def test_list_all_packages(self):
        res = client.get("/api/packages")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 20
        assert len(data["listings"]) >= 20

    def test_filter_by_max_price(self):
        res = client.get("/api/packages?max_price=1000")
        assert res.status_code == 200
        for item in res.json()["listings"]:
            assert item["price"] <= 1000

    def test_get_package_by_id_success(self):
        res = client.get("/api/packages/1")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == 1
        assert "title" in data
        assert "location" in data

    def test_get_package_by_id_not_found(self):
        res = client.get("/api/packages/99999")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()
