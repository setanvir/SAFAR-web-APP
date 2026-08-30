"""
Pydantic Schemas for SAFAR API Request/Response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any


# ── Auth Schemas ──────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = Field("traveler", pattern="^(traveler|agency)$")
    company_name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    created_at: Optional[str] = None


class TokenResponse(BaseModel):
    success: bool = True
    token: str
    user: UserResponse


# ── Package Schemas ───────────────────────────────────────
class PackageCreate(BaseModel):
    type: str = Field(..., pattern="^(tour|hotel)$")
    title: str = Field(..., min_length=3, max_length=200)
    location: str = Field(..., min_length=2, max_length=180)
    price: float = Field(..., gt=0)
    description: str = Field(..., min_length=10)
    image_url: str = Field(..., min_length=5)
    duration_days: Optional[int] = Field(5, ge=1)
    room_type: Optional[str] = "Deluxe Suite"
    agency_id: Optional[int] = None


class PackageUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(tour|hotel)$")
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    location: Optional[str] = Field(None, min_length=2, max_length=180)
    price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    image_url: Optional[str] = None
    duration_days: Optional[int] = None
    room_type: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|archived)$")


class PackageResponse(BaseModel):
    id: int
    agency_id: Optional[int] = None
    agency: Optional[str] = "SAFAR Verified"
    type: str
    title: str
    location: str
    price: float
    description: str
    image_url: str
    duration_days: Optional[int] = 5
    room_type: Optional[str] = "Deluxe Suite"
    status: str
    created_at: Optional[str] = None


class PackageListResponse(BaseModel):
    listings: List[PackageResponse]
    total: int


# ── Agency Schemas ────────────────────────────────────────
class AgencyResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    contact_person: Optional[str] = None
    email: str
    phone: Optional[str] = None
    verification_status: str
    created_at: Optional[str] = None


class AgencyVerificationUpdate(BaseModel):
    status: str = Field(..., pattern="^(verified|rejected|pending)$")


# ── Booking Schemas ───────────────────────────────────────
class BookingCreateRequest(BaseModel):
    package_id: int
    guests: int = Field(1, ge=1, le=50)
    booking_date: Optional[str] = None
    payment_method: str = Field("demo", pattern="^(credit_card|crypto|demo)$")
    payment_details: Optional[Dict[str, Any]] = {}


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected|cancelled|pending)$")


class BookingResponse(BaseModel):
    id: int
    traveler_id: int
    traveler_name: str
    traveler_email: str
    package_id: int
    package_title: str
    listing_type: str
    agency_name: str
    guests: int
    price: float
    booking_date: str
    status: str
    payment_status: str
    created_at: Optional[str] = None


# ── Payment & Activity Schemas ────────────────────────────
class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    method: str
    amount: float
    transaction_id: str
    status: str
    created_at: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = "System"
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: Optional[str] = None


# ── Platform Settings & Admin Overview Schemas ───────────
class SettingUpdate(BaseModel):
    key: str
    value: str


class PlatformSettingResponse(BaseModel):
    key: str
    value: str
    updated_at: Optional[str] = None


class AdminOverviewKPI(BaseModel):
    gross_revenue: float
    revenue_growth_pct: float
    total_bookings: int
    approved_bookings: int
    pending_bookings: int
    rejected_bookings: int
    active_inventory: int
    total_tours: int
    total_hotels: int
    verified_agencies: int
    pending_agencies: int
    total_users: int


class AdminOverviewResponse(BaseModel):
    kpis: AdminOverviewKPI
    recent_bookings: List[BookingResponse]
    pending_agencies: List[AgencyResponse]


class AdminAnalyticsResponse(BaseModel):
    category_distribution: Dict[str, Any]
    status_breakdown: Dict[str, int]
    revenue_by_type: Dict[str, float]
