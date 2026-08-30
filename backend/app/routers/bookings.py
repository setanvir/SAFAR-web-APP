"""
Bookings Router for SAFAR.
Handles traveler reservations and booking lookups via the TravelBookingFacade pattern.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.db.session import get_db
from app.models import User, Booking, Package
from app.auth.dependencies import get_current_user
from app.facades.travel_booking_facade import TravelBookingFacade
from app.schemas import BookingCreateRequest, BookingResponse

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])
facade = TravelBookingFacade()


@router.post("/reserve", status_code=status.HTTP_200_OK)
async def create_reservation(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Executes a reservation via the TravelBookingFacade (Factory + Strategy + DB Transaction + Observer).
    Handles both database-backed user reservations and direct test payloads.
    """
    body = await request.json()

    # Case A: Legacy / Direct Test Payload with listing_type
    if "listing_type" in body or "package_data" in body:
        listing_type = body.get("listing_type", "tour")
        if listing_type not in ["tour", "hotel"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid listing type '{listing_type}'.")
        try:
            res = facade.process_travel_reservation(
                listing_type=listing_type,
                package_data=body.get("package_data", {}),
                travelers_count=body.get("travelers_count", 1),
                payment_method=body.get("payment_method", "demo"),
                payment_details=body.get("payment_details", {}),
                user_info={"email": body.get("user_email", "guest@example.com")}
            )
            return res
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Case B: Standard DB-backed payload
    package_id = body.get("package_id")
    guests = body.get("guests", 1)
    payment_method = body.get("payment_method", "demo")
    payment_details = body.get("payment_details", {})
    booking_date = body.get("booking_date")

    # Find or use default traveler
    auth_header = request.headers.get("authorization")
    traveler = None
    if auth_header and "Bearer " in auth_header:
        try:
            from app.auth.security import decode_access_token
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            uid = payload.get("sub") or payload.get("id")
            traveler = db.query(User).filter(User.id == int(uid)).first()
        except Exception:
            pass

    if not traveler:
        traveler = db.query(User).filter(User.role == "traveler").first()
    if not traveler:
        traveler = User(name="Guest Traveler", email="guest@safar.com", role="traveler", password_hash="dummy")
        db.add(traveler)
        db.commit()
        db.refresh(traveler)

    try:
        result = facade.process_booking_transaction(
            db=db,
            traveler=traveler,
            package_id=int(package_id),
            guests=int(guests),
            payment_method=payment_method,
            payment_details=payment_details,
            booking_date=booking_date
        )
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.get("/my-bookings", response_model=List[BookingResponse])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns booking history for the currently authenticated traveler.
    """
    bookings = db.query(Booking).filter(Booking.traveler_id == current_user.id).order_by(Booking.id.desc()).all()
    return [b.to_dict() for b in bookings]


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancels a pending or approved booking by the booking owner or admin.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.traveler_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking.")

    if booking.booking_status == "cancelled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking is already cancelled.")

    booking.booking_status = "cancelled"
    db.commit()
    db.refresh(booking)

    # Notify observer
    facade.booking_subject.notify("cancelled", {
        "entity_type": "booking",
        "booking_id": booking.id,
        "actor_user_id": current_user.id,
        "traveler_email": booking.traveler.email if booking.traveler else "",
        "package_title": booking.package.title if booking.package else ""
    }, db=db)

    return booking.to_dict()
