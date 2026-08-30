"""
Observer Pattern Implementation for Booking & System Events.
Maintains a 1-to-many dependency relationship notifying subscribers of state changes.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import json
from sqlalchemy.orm import Session
from app.models import ActivityLog


class BookingObserver(ABC):
    """Abstract Subscriber interface for event notifications."""

    @abstractmethod
    def update(self, event_type: str, data: Dict[str, Any], db: Optional[Session] = None):
        """Callback invoked when the Subject emits an event."""
        pass


class DatabaseAuditLogObserver(BookingObserver):
    """Concrete Observer: Persists system audit log records into PostgreSQL."""

    def __init__(self):
        self.memory_logs: List[Dict[str, Any]] = []

    @property
    def audit_logs(self):
        return self.memory_logs

    def update(self, event_type: str, data: Dict[str, Any], db: Optional[Session] = None):
        entry = {
            "event": event_type,
            "booking_id": data.get("booking_id") or data.get("id"),
            "entity_type": data.get("entity_type", "booking"),
            "entity_id": str(data.get("booking_id") or data.get("id") or "0"),
            "actor_id": data.get("actor_user_id"),
            "action": f"{data.get('entity_type', 'booking').upper()}_{str(event_type).upper()}",
            "metadata": json.dumps(data, default=str),
        }
        self.memory_logs.append(entry)

        if db:
            try:
                log_record = ActivityLog(
                    actor_user_id=data.get("actor_user_id"),
                    action=entry["action"],
                    entity_type=entry["entity_type"],
                    entity_id=entry["entity_id"],
                    metadata_json=entry["metadata"]
                )
                db.add(log_record)
                db.commit()
            except Exception:
                db.rollback()


AuditLogObserver = DatabaseAuditLogObserver


class EmailNotificationObserver(BookingObserver):
    """Concrete Observer: Generates and dispatches email confirmations to travelers."""

    def __init__(self):
        self.sent_emails: List[Dict[str, Any]] = []

    @property
    def notifications_sent(self):
        return self.sent_emails

    def update(self, event_type: str, data: Dict[str, Any], db: Optional[Session] = None):
        recipient = data.get("traveler_email", "guest@example.com")
        title = data.get("package_title", "Destination Experience")
        email_record = {
            "to": recipient,
            "recipient": recipient,
            "subject": f"SAFAR Reservation Update [{str(event_type).upper()}]: {title}",
            "booking_id": data.get("booking_id"),
            "amount": data.get("total_price"),
            "event": event_type,
        }
        self.sent_emails.append(email_record)


class AgencyAlertObserver(BookingObserver):
    """Concrete Observer: Alerts the provider agency when a reservation is placed."""

    def __init__(self):
        self.alerts: List[Dict[str, Any]] = []

    @property
    def agency_alerts(self):
        return self.alerts

    def update(self, event_type: str, data: Dict[str, Any], db: Optional[Session] = None):
        agency_id = data.get("agency_id")
        alert = {
            "agency_id": agency_id,
            "booking_id": data.get("booking_id"),
            "package_title": data.get("package_title"),
            "guests": data.get("travelers_count", 1),
            "event": event_type,
        }
        self.alerts.append(alert)


class BookingSubject:
    """Subject maintaining list of Observers and broadcasting state notifications."""

    def __init__(self):
        self._observers: List[BookingObserver] = []

    def attach(self, observer: BookingObserver):
        if observer not in self._observers:
            self._observers.append(observer)

    def detach(self, observer: BookingObserver):
        if observer in self._observers:
            self._observers.remove(observer)

    def notify(self, arg1: Any, arg2: Any = None, db: Optional[Session] = None):
        """
        Supports both notify(event_type, data, db) and legacy notify(data, event_type).
        """
        if isinstance(arg1, str) and isinstance(arg2, dict):
            event_type, data = arg1, arg2
        elif isinstance(arg1, dict) and isinstance(arg2, str):
            data, event_type = arg1, arg2
        elif isinstance(arg1, str):
            event_type, data = arg1, {}
        else:
            data, event_type = arg1 or {}, "event"

        for observer in self._observers:
            observer.update(event_type, data, db=db)
