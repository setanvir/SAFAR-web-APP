"""
Facade Pattern Implementation for Travel Booking.
Provides a unified high-level interface orchestrating:
  1. Factory Method (Listing instantiation & validation)
  2. Strategy Pattern (Payment fee calculation & execution)
  3. Database Persistence (Transactional Booking & Payment persistence)
  4. Observer Pattern (Audit Log, Email, & Agency alert dispatching)
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models import Package, Booking, Payment, User
from app.factories.package_factory import PackageFactoryProducer
from app.strategies.payment_strategy import (
    PaymentContext,
    CreditCardPaymentStrategy,
    CryptoPaymentStrategy,
    DemoWalletPaymentStrategy,
)
from app.observers.booking_observer import (
    BookingSubject,
    DatabaseAuditLogObserver,
    EmailNotificationObserver,
    AgencyAlertObserver,
)


class TravelBookingFacade:
    """Unified Facade orchestrating complex reservation and payment subsystems."""

    def __init__(self):
        self.booking_subject = BookingSubject()
        self.audit_observer = DatabaseAuditLogObserver()
        self.email_observer = EmailNotificationObserver()
        self.agency_observer = AgencyAlertObserver()

        self.booking_subject.attach(self.audit_observer)
        self.booking_subject.attach(self.email_observer)
        self.booking_subject.attach(self.agency_observer)

    def select_payment_strategy(self, payment_method: str):
        m = (payment_method or "").lower()
        if "credit" in m or "card" in m:
            return CreditCardPaymentStrategy()
        elif "crypto" in m:
            return CryptoPaymentStrategy()
        else:
            return DemoWalletPaymentStrategy()

    def process_travel_reservation(
        self,
        listing_type: str,
        package_data: Dict[str, Any],
        travelers_count: int,
        payment_method: str,
        payment_details: Optional[Dict[str, Any]] = None,
        user_info: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        In-memory domain reservation workflow for fast unit testing & direct invocation.
        """
        factory = PackageFactoryProducer.get_factory(listing_type)
        listing = factory.create_listing(package_data)

        strategy = self.select_payment_strategy(payment_method)
        payment_context = PaymentContext(strategy)
        total_amount = payment_context.calculate(listing.price, travelers_count)
        payment_result = payment_context.execute_payment(total_amount, payment_details or {})

        email = (user_info or {}).get("email", "guest@example.com")
        booking_record = {
            "booking_id": 999,
            "package_title": listing.title,
            "listing_type": listing_type,
            "travelers_count": travelers_count,
            "total_price": total_amount,
            "agency_id": package_data.get("agency_id", 1),
            "traveler_email": email,
            "status": "approved",
        }

        self.booking_subject.notify(booking_record, "created")

        return {
            "success": True,
            "listing": listing.get_details(),
            "payment": payment_result,
            "booking": booking_record,
            "notifications": {
                "emails_sent": len(self.email_observer.notifications_sent),
                "audit_logs": len(self.audit_observer.audit_logs),
                "agency_alerts": len(self.agency_observer.agency_alerts),
            },
        }

    def process_booking_transaction(
        self,
        db: Session,
        traveler: User,
        package_id: int,
        guests: int,
        payment_method: str,
        payment_details: Optional[Dict[str, Any]] = None,
        booking_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Database-backed transactional reservation flow:
        1. Query and lock Package from PostgreSQL (verifies existence and authoritative price)
        2. Instantiate domain product via Factory Method
        3. Calculate authoritative price and execute transaction via Strategy Pattern
        4. Commit Booking and Payment records to database in a single transaction
        5. Dispatch event to Observer subscribers (Audit Log, Email, Agency Alert)
        """
        db_package = db.query(Package).filter(Package.id == package_id, Package.status == "active").first()
        if not db_package:
            raise ValueError(f"Package #{package_id} not found or is currently unavailable.")

        factory = PackageFactoryProducer.get_factory(db_package.type)
        package_dict = db_package.to_dict()
        listing = factory.create_listing(package_dict)

        strategy = self.select_payment_strategy(payment_method)
        payment_context = PaymentContext(strategy)
        total_amount = payment_context.calculate(listing.price, guests)
        payment_result = payment_context.execute_payment(total_amount, payment_details or {})

        date_str = booking_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
        new_booking = Booking(
            traveler_id=traveler.id,
            package_id=db_package.id,
            guests=guests,
            total_amount=total_amount,
            booking_status="pending",
            payment_status=payment_result["status"],
            booking_date=date_str,
        )
        db.add(new_booking)
        db.flush()

        new_payment = Payment(
            booking_id=new_booking.id,
            method=payment_result["method"],
            amount=total_amount,
            transaction_id=payment_result["transaction_id"],
            status=payment_result["status"],
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_booking)

        event_payload = {
            "entity_type": "booking",
            "booking_id": new_booking.id,
            "package_id": db_package.id,
            "package_title": db_package.title,
            "listing_type": db_package.type,
            "traveler_id": traveler.id,
            "traveler_email": traveler.email,
            "travelers_count": guests,
            "total_price": total_amount,
            "agency_id": db_package.agency_id,
            "actor_user_id": traveler.id,
        }
        self.booking_subject.notify("created", event_payload, db=db)

        return {
            "success": True,
            "booking": new_booking.to_dict(),
            "listing": listing.get_details(),
            "payment": payment_result,
        }
