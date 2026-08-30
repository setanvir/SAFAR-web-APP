"""
SQLAlchemy Database Models for SAFAR Travel Marketplace.
Defines schemas for Users, Agencies, Packages, Bookings, Payments, Activity Logs, and Platform Settings.
"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, ForeignKey,
    DateTime, Index
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def utc_now():
    """Return timezone-aware current UTC time."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="traveler", nullable=False)  # 'admin', 'agency', 'traveler'
    status = Column(String(30), default="active", nullable=False)  # 'active', 'suspended'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="traveler", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="actor", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String(180), nullable=False)
    contact_person = Column(String(120), nullable=True)
    email = Column(String(180), nullable=False)
    phone = Column(String(50), nullable=True)
    verification_status = Column(String(30), default="pending", nullable=False)  # 'pending', 'verified', 'rejected'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="agency")
    packages = relationship("Package", back_populates="agency", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "contact_person": self.contact_person,
            "email": self.email,
            "phone": self.phone,
            "verification_status": self.verification_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(30), nullable=False)  # 'tour', 'hotel'
    title = Column(String(200), nullable=False)
    location = Column(String(180), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)
    duration_days = Column(Integer, default=5, nullable=True)
    room_type = Column(String(100), default="Standard Room", nullable=True)
    status = Column(String(30), default="active", nullable=False)  # 'active', 'archived'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    agency = relationship("Agency", back_populates="packages")
    bookings = relationship("Booking", back_populates="package")

    __table_args__ = (
        Index("idx_packages_type_status", "type", "status"),
        Index("idx_packages_location", "location"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "agency_id": self.agency_id,
            "agency": self.agency.company_name if self.agency else "SAFAR Verified",
            "type": self.type,
            "title": self.title,
            "location": self.location,
            "price": float(self.price),
            "description": self.description,
            "image_url": self.image_url,
            "duration_days": self.duration_days,
            "room_type": self.room_type,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    traveler_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id", ondelete="RESTRICT"), nullable=False)
    guests = Column(Integer, default=1, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    booking_status = Column(String(30), default="pending", nullable=False)  # 'pending', 'approved', 'rejected', 'cancelled'
    payment_status = Column(String(30), default="pending", nullable=False)  # 'pending', 'completed', 'refunded'
    booking_date = Column(String(30), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    traveler = relationship("User", back_populates="bookings")
    package = relationship("Package", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_bookings_status", "booking_status"),
        Index("idx_bookings_traveler", "traveler_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "traveler_id": self.traveler_id,
            "traveler_name": self.traveler.name if self.traveler else "Guest",
            "traveler_email": self.traveler.email if self.traveler else "",
            "package_id": self.package_id,
            "package_title": self.package.title if self.package else "Package",
            "listing_type": self.package.type if self.package else "tour",
            "agency_name": self.package.agency.company_name if (self.package and self.package.agency) else "SAFAR Verified",
            "guests": self.guests,
            "price": float(self.total_amount),
            "booking_date": self.booking_date,
            "status": self.booking_status,
            "payment_status": self.payment_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    method = Column(String(50), nullable=False)  # 'credit_card', 'crypto', 'demo'
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_id = Column(String(100), nullable=False, unique=True)
    status = Column(String(30), default="completed", nullable=False)  # 'completed', 'failed', 'refunded'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="payment")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "method": self.method,
            "amount": float(self.amount),
            "transaction_id": self.transaction_id,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(120), nullable=False)
    entity_type = Column(String(60), nullable=False)  # 'package', 'agency', 'booking', 'user', 'settings'
    entity_id = Column(String(60), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    actor = relationship("User", back_populates="activity_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "actor_user_id": self.actor_user_id,
            "actor_name": self.actor.name if self.actor else "System",
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "metadata_json": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
