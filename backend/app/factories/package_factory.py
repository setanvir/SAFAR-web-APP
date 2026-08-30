"""
Factory Method Pattern Implementation.
Creates TourPackage and HotelListing domain objects from raw dictionaries or SQLAlchemy models.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any


class TravelListing(ABC):
    """Abstract Base Product representing a Travel Listing."""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id")
        self.title = data.get("title", "Untitled Listing")
        self.location = data.get("location", "Unknown")
        self.price = float(data.get("price", 0.0))
        self.description = data.get("description", "")
        self.image_url = data.get("image_url", "")
        self.agency = data.get("agency", "SAFAR Verified")

    @abstractmethod
    def get_details(self) -> Dict[str, Any]:
        """Return full details dictionary specific to the listing product."""
        pass


class TourPackage(TravelListing):
    """Concrete Product: Tour Package."""

    def __init__(self, data: Dict[str, Any]):
        super().__init__(data)
        self.duration_days = int(data.get("duration_days", 5))

    def get_details(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "tour",
            "title": self.title,
            "location": self.location,
            "price": self.price,
            "description": self.description,
            "image_url": self.image_url,
            "duration_days": self.duration_days,
            "agency": self.agency,
        }


class HotelListing(TravelListing):
    """Concrete Product: Luxury Hotel."""

    def __init__(self, data: Dict[str, Any]):
        super().__init__(data)
        self.room_type = data.get("room_type", "Luxury Suite")
        self.amenities = data.get("amenities", "Pool, Spa, WiFi, Breakfast")

    def get_details(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": "hotel",
            "title": self.title,
            "location": self.location,
            "price": self.price,
            "description": self.description,
            "image_url": self.image_url,
            "room_type": self.room_type,
            "amenities": self.amenities,
            "agency": self.agency,
        }


class PackageFactory(ABC):
    """Abstract Creator declaring the Factory Method."""

    @abstractmethod
    def create_listing(self, data: Dict[str, Any]) -> TravelListing:
        """Factory Method to create a TravelListing instance."""
        pass


class TourFactory(PackageFactory):
    """Concrete Creator for Tour Packages."""

    def create_listing(self, data: Dict[str, Any]) -> TourPackage:
        return TourPackage(data)


class HotelFactory(PackageFactory):
    """Concrete Creator for Luxury Hotels."""

    def create_listing(self, data: Dict[str, Any]) -> HotelListing:
        return HotelListing(data)


# Aliases for backwards compatibility with tests
TourPackageFactory = TourFactory
HotelListingFactory = HotelFactory


class PackageFactoryProducer:
    """Producer resolving the correct Concrete Factory by listing type."""

    @staticmethod
    def get_factory(listing_type: str) -> PackageFactory:
        t = (listing_type or "").lower()
        if t == "tour":
            return TourFactory()
        elif t == "hotel":
            return HotelFactory()
        else:
            raise ValueError(f"Unknown listing type '{listing_type}'. Must be 'tour' or 'hotel'.")
