"""
Unit Tests for Facade Pattern and FastAPI Controller Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.facades.travel_booking_facade import TravelBookingFacade
from app.main import app


client = TestClient(app)


class TestTravelBookingFacade:
    """Tests to verify the Facade orchestrates Factory, Strategy, Observer correctly."""

    def test_facade_tour_booking_success(self):
        facade = TravelBookingFacade()
        result = facade.process_travel_reservation(
            listing_type="tour",
            package_data={"title": "Kyoto Tour", "price": 950.0, "agency_id": 5},
            travelers_count=2,
            payment_method="crypto",
            payment_details={"wallet_address": "0x1234567890abcdef"},
            user_info={"email": "tourist@safar.com"},
        )
        assert result["success"] is True
        assert result["booking"]["package_title"] == "Kyoto Tour"
        assert result["payment"]["status"] == "success"
        assert result["notifications"]["emails_sent"] >= 1

    def test_facade_hotel_booking_with_credit_card(self):
        facade = TravelBookingFacade()
        result = facade.process_travel_reservation(
            listing_type="hotel",
            package_data={"title": "Aman Tokyo", "price": 900.0, "agency_id": 3},
            travelers_count=1,
            payment_method="credit_card",
            payment_details={"card_number": "4222222222225555"},
            user_info={"email": "guest@aman.com"},
        )
        assert result["success"] is True
        assert result["listing"]["type"] == "hotel"

    def test_facade_demo_wallet_payment(self):
        facade = TravelBookingFacade()
        result = facade.process_travel_reservation(
            listing_type="tour",
            package_data={"title": "Demo Trip", "price": 500.0, "agency_id": 1},
            travelers_count=1,
            payment_method="demo",
            payment_details={},
            user_info={"email": "demo@test.com"},
        )
        assert result["payment"]["method"] == "SAFAR Demo Wallet"


class TestFastAPIEndpoints:
    """Tests to verify FastAPI controller routes return correct responses."""

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert any("Singleton" in p for p in data["design_patterns"])


    def test_packages_endpoint(self):
        response = client.get("/api/packages")
        assert response.status_code == 200
        data = response.json()
        assert len(data["listings"]) >= 20

    def test_packages_filter_by_type(self):
        response = client.get("/api/packages?type=tour")
        assert response.status_code == 200
        data = response.json()
        for listing in data["listings"]:
            assert listing["type"] == "tour"

        response_hotel = client.get("/api/packages?type=hotel")
        assert response_hotel.status_code == 200
        data_hotel = response_hotel.json()
        for listing in data_hotel["listings"]:
            assert listing["type"] == "hotel"

    def test_packages_filter_by_search_query(self):
        response = client.get("/api/packages?q=Tokyo")
        assert response.status_code == 200
        data = response.json()
        assert len(data["listings"]) >= 1
        for listing in data["listings"]:
            assert "tokyo" in listing["title"].lower() or "tokyo" in listing["location"].lower()

    def test_reserve_endpoint(self):
        payload = {
            "listing_type": "hotel",
            "package_data": {"title": "Aman Tokyo", "price": 900.0, "agency_id": 3},
            "travelers_count": 1,
            "payment_method": "credit_card",
            "payment_details": {"card_number": "4222222222225555"},
            "user_email": "guest@aman.com",
        }
        response = client.post("/api/bookings/reserve", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["booking"]["package_title"] == "Aman Tokyo"

    def test_reserve_invalid_type_returns_400(self):
        payload = {
            "listing_type": "cruise",
            "package_data": {"title": "Invalid"},
            "travelers_count": 1,
            "payment_method": "demo",
            "user_email": "x@x.com",
        }
        response = client.post("/api/bookings/reserve", json=payload)
        assert response.status_code == 400
