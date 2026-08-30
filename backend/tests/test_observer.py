"""
Unit Tests for Observer Pattern (Booking Event System).
"""
import pytest
from app.observers.booking_observer import (
    BookingSubject,
    EmailNotificationObserver,
    AuditLogObserver,
    AgencyAlertObserver,
)


SAMPLE_BOOKING = {
    "booking_id": 501,
    "package_title": "Bali Retreat",
    "status": "approved",
    "traveler_email": "user@example.com",
    "agency_id": 12,
}


class TestObserverPattern:
    """Tests to verify Observer pattern notifies all attached subscribers."""

    def test_all_observers_receive_notification(self):
        subject = BookingSubject()
        email = EmailNotificationObserver()
        audit = AuditLogObserver()
        agency = AgencyAlertObserver()
        subject.attach(email)
        subject.attach(audit)
        subject.attach(agency)

        subject.notify(SAMPLE_BOOKING, "approved")

        assert len(email.notifications_sent) == 1
        assert len(audit.audit_logs) == 1
        assert len(agency.agency_alerts) == 1

    def test_email_observer_stores_recipient(self):
        subject = BookingSubject()
        email = EmailNotificationObserver()
        subject.attach(email)
        subject.notify(SAMPLE_BOOKING, "created")
        assert email.notifications_sent[0]["recipient"] == "user@example.com"

    def test_audit_observer_stores_booking_id(self):
        subject = BookingSubject()
        audit = AuditLogObserver()
        subject.attach(audit)
        subject.notify(SAMPLE_BOOKING, "created")
        assert audit.audit_logs[0]["booking_id"] == 501

    def test_agency_observer_stores_agency_id(self):
        subject = BookingSubject()
        agency = AgencyAlertObserver()
        subject.attach(agency)
        subject.notify(SAMPLE_BOOKING, "created")
        assert agency.agency_alerts[0]["agency_id"] == 12

    def test_detached_observer_receives_nothing(self):
        subject = BookingSubject()
        email = EmailNotificationObserver()
        subject.attach(email)
        subject.detach(email)
        subject.notify(SAMPLE_BOOKING, "canceled")
        assert len(email.notifications_sent) == 0

    def test_multiple_notifications(self):
        subject = BookingSubject()
        audit = AuditLogObserver()
        subject.attach(audit)
        subject.notify(SAMPLE_BOOKING, "created")
        subject.notify(SAMPLE_BOOKING, "approved")
        assert len(audit.audit_logs) == 2
