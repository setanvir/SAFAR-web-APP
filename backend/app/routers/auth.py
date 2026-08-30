"""
Authentication Router for SAFAR.
Handles database-backed login, public registration (traveler/agency only), logout, and profile retrieval.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User, Agency
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user against database password hash.
    Rejects unknown emails with 401 Unauthorized.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact support.",
        )

    token = create_access_token(data={"sub": str(user.id), "id": user.id, "email": user.email, "role": user.role})
    return {
        "success": True,
        "token": token,
        "user": user.to_dict()
    }


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    Restricted to 'traveler' or 'agency' roles only; admin escalation is strictly blocked.
    """
    email_clean = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # Force role to traveler or agency
    assigned_role = "agency" if payload.role == "agency" else "traveler"
    hashed_pwd = get_password_hash(payload.password)

    new_user = User(
        name=payload.name.strip(),
        email=email_clean,
        password_hash=hashed_pwd,
        role=assigned_role,
        status="active"
    )
    db.add(new_user)
    db.flush()

    # If agency, create agency record
    if assigned_role == "agency":
        agency = Agency(
            user_id=new_user.id,
            company_name=payload.company_name or payload.name.strip(),
            contact_person=payload.name.strip(),
            email=email_clean,
            phone=payload.phone or "",
            verification_status="pending"
        )
        db.add(agency)

    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "id": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "success": True,
        "token": token,
        "user": new_user.to_dict()
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Stateless JWT logout confirmation. Client clears the stored token.
    """
    return {"success": True, "message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns sanitized profile of the currently authenticated user.
    """
    return current_user.to_dict()
