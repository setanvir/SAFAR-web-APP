"""
Unit Tests for SQLAlchemy Models and Serialization.
"""
import pytest
from app.models import User, Agency, Package, Booking, Payment, ActivityLog, PlatformSetting


class TestSQLAlchemyModels:
    """Tests for model dictionary conversions and property representations."""

    def test_user_to_dict_never_exposes_password(self):
        user = User(
            id=10,
            name="Alice",
            email="alice@example.com",
            role="traveler",
            password_hash="secret_hashed_value",
            status="active"
        )
        d = user.to_dict()
        assert d["id"] == 10
        assert d["email"] == "alice@example.com"
        assert "password" not in d
        assert "password_hash" not in d

    def test_package_to_dict(self):
        pkg = Package(
            id=1,
            type="tour",
            title="Tokyo Sakura Tour",
            location="Tokyo, Japan",
            price=1200.00,
            description="Cherry blossom immersion",
            image_url="https://images.unsplash.com/sakura",
            duration_days=6,
            status="active"
        )
        d = pkg.to_dict()
        assert d["type"] == "tour"
        assert d["duration_days"] == 6
        assert d["price"] == 1200.00

    def test_booking_to_dict_with_relations(self):
        traveler = User(id=2, name="Bob", email="bob@test.com", role="traveler")
        pkg = Package(id=5, title="Desert Trek", type="tour", price=500.0)
        booking = Booking(
            id=101,
            traveler_id=2,
            package_id=5,
            guests=3,
            total_amount=1500.00,
            booking_status="approved",
            payment_status="completed",
            booking_date="2026-09-01"
        )
        booking.traveler = traveler
        booking.package = pkg
        d = booking.to_dict()
        assert d["traveler_name"] == "Bob"
        assert d["package_title"] == "Desert Trek"
        assert d["price"] == 1500.00

    def test_payment_to_dict(self):
        payment = Payment(
            id=99,
            booking_id=101,
            method="credit_card",
            amount=1500.00,
            transaction_id="CC-TX-12345",
            status="completed"
        )
        d = payment.to_dict()
        assert d["transaction_id"] == "CC-TX-12345"
        assert d["amount"] == 1500.00
