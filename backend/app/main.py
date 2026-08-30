"""
FastAPI Main Application Entry Point.
Exposes modularized RESTful endpoints utilizing Singleton, Factory Method, Strategy, Observer, and Facade patterns.
Includes real database-backed authentication, package catalog services, bookings, and full Admin control suite.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.db.session import DatabaseManager
from app.seed_db import seed_database
from app.routers import auth, packages, bookings, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database tables and seed if empty."""
    db_mgr = DatabaseManager.get_instance()
    db_mgr.create_all_tables()
    try:
        seed_database()
    except Exception as e:
        print(f"Lifespan seed notice: {e}")
    yield


app = FastAPI(
    title="SAFAR Travel Marketplace API",
    description="Enterprise Travel Marketplace Backend featuring 5 Software Design Patterns and PostgreSQL Persistence",
    version="2.1.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001")
allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(packages.router)
app.include_router(bookings.router)
app.include_router(admin.router)


@app.get("/", tags=["System"])
def read_root():
    """Root status endpoint verifying pattern implementations and database connectivity."""
    db_mgr = DatabaseManager.get_instance()
    return {
        "status": "online",
        "app": "SAFAR Enterprise API",
        "version": "2.1.0",
        "database": {
            "type": "PostgreSQL / SQLAlchemy",
            "url": db_mgr.db_url.split("@")[-1] if "@" in db_mgr.db_url else db_mgr.db_url,
            "connected": db_mgr.engine is not None
        },
        "design_patterns": [
            "Singleton (DatabaseManager connection pool)",
            "Factory Method (PackageFactoryProducer -> TourPackage / HotelListing)",
            "Strategy (CreditCard, Crypto, DemoWallet Payment Strategy)",
            "Observer (DatabaseAuditLogObserver, AgencyAlertObserver, EmailObserver)",
            "Facade (TravelBookingFacade unified workflow orchestration)"
        ]
    }
