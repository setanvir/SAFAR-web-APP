"""
Public Packages Router for SAFAR.
Serves Tour and Hotel packages querying PostgreSQL and instantiated via Factory Method.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models import Package
from app.factories.package_factory import PackageFactoryProducer
from app.schemas import PackageListResponse, PackageResponse

router = APIRouter(prefix="/api/packages", tags=["Packages"])


@router.get("", response_model=PackageListResponse)
def list_packages(
    type: Optional[str] = Query(None, description="Filter by 'tour' or 'hotel'"),
    q: Optional[str] = Query(None, description="Search term for title, location, or agency"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    db: Session = Depends(get_db)
):
    """
    Returns active packages transformed through the Factory Method pattern.
    """
    query = db.query(Package).filter(Package.status == "active")

    if type and type.lower() not in ["all", "none"]:
        query = query.filter(Package.type == type.lower())

    if max_price:
        query = query.filter(Package.price <= max_price)

    packages = query.all()

    # Search filter
    if q and q.strip():
        search_term = q.strip().lower()
        packages = [
            p for p in packages
            if search_term in p.title.lower()
            or search_term in p.location.lower()
            or (p.agency and search_term in p.agency.company_name.lower())
            or search_term in p.description.lower()
        ]

    # Instantiate via Factory Method
    results = []
    for pkg in packages:
        factory = PackageFactoryProducer.get_factory(pkg.type)
        domain_listing = factory.create_listing(pkg.to_dict())
        details = domain_listing.get_details()
        details["status"] = pkg.status
        details["agency_id"] = pkg.agency_id
        details["created_at"] = pkg.created_at.isoformat() if pkg.created_at else None
        results.append(details)

    return {
        "listings": results,
        "total": len(results)
    }


@router.get("/{package_id}", response_model=PackageResponse)
def get_package_by_id(package_id: int, db: Session = Depends(get_db)):
    """
    Returns full details for a specific package ID.
    """
    pkg = db.query(Package).filter(Package.id == package_id, Package.status == "active").first()
    if not pkg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Package #{package_id} not found."
        )

    factory = PackageFactoryProducer.get_factory(pkg.type)
    domain_listing = factory.create_listing(pkg.to_dict())
    details = domain_listing.get_details()
    details["status"] = pkg.status
    details["agency_id"] = pkg.agency_id
    details["created_at"] = pkg.created_at.isoformat() if pkg.created_at else None
    return details
