"""
Unit Tests for Factory Method Pattern (PackageFactory).
"""
import pytest
from app.factories.package_factory import (
    PackageFactoryProducer,
    TourPackage,
    HotelListing,
    TourPackageFactory,
    HotelListingFactory,
)


class TestPackageFactory:
    """Tests to verify the Factory Method pattern creates correct listing types."""

    def test_tour_factory_returns_correct_type(self):
        factory = PackageFactoryProducer.get_factory("tour")
        assert isinstance(factory, TourPackageFactory)

    def test_hotel_factory_returns_correct_type(self):
        factory = PackageFactoryProducer.get_factory("hotel")
        assert isinstance(factory, HotelListingFactory)

    def test_tour_package_creation(self):
        factory = PackageFactoryProducer.get_factory("tour")
        listing = factory.create_listing({
            "title": "Safari Expedition",
            "location": "Kenya",
            "price": 950.0,
            "description": "Wilderness adventure",
        })
        assert isinstance(listing, TourPackage)
        details = listing.get_details()
        assert details["type"] == "tour"
        assert details["title"] == "Safari Expedition"
        assert details["price"] == 950.0

    def test_hotel_listing_creation(self):
        factory = PackageFactoryProducer.get_factory("hotel")
        listing = factory.create_listing({
            "title": "Grand Hyatt",
            "location": "Tokyo",
            "price": 400.0,
            "description": "Luxury downtown hotel",
        })
        assert isinstance(listing, HotelListing)
        details = listing.get_details()
        assert details["type"] == "hotel"
        assert details["title"] == "Grand Hyatt"

    def test_tour_package_has_duration(self):
        factory = PackageFactoryProducer.get_factory("tour")
        listing = factory.create_listing({"title": "Trek", "price": 100, "duration_days": 10})
        assert listing.get_details()["duration_days"] == 10

    def test_hotel_listing_has_amenities(self):
        factory = PackageFactoryProducer.get_factory("hotel")
        listing = factory.create_listing({"title": "Inn", "price": 80, "amenities": "Pool, Gym"})
        assert listing.get_details()["amenities"] == "Pool, Gym"

    def test_invalid_factory_type_raises(self):
        with pytest.raises(ValueError):
            PackageFactoryProducer.get_factory("cruise")
