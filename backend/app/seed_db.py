"""
Deterministic Database Seeder for SAFAR.
Initializes tables and seeds users (Admin, Agencies, Travelers), the 30-package catalog,
sample bookings, payments, activity logs, and default platform settings.
"""
import os
from app.db.session import DatabaseManager
from app.models import User, Agency, Package, Booking, Payment, ActivityLog, PlatformSetting
from app.auth.security import get_password_hash


def seed_database(db_url: str = None):
    """Seed the database with complete deterministic sample records."""
    db_mgr = DatabaseManager.get_instance(db_url)
    db_mgr.create_all_tables()
    db = db_mgr.get_session()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@safar.com").first():
            print("Database already contains seed data.")
            return

        print("Seeding SAFAR database...")

        # 1. Users
        admin_user = User(
            name="Main Administrator",
            email="admin@safar.com",
            password_hash=get_password_hash("admin123"),
            role="admin",
            status="active"
        )
        agency_user_1 = User(
            name="Oceanic Adventures Co",
            email="agency@safar.com",
            password_hash=get_password_hash("agency123"),
            role="agency",
            status="active"
        )
        agency_user_2 = User(
            name="Alpine Horizons Ltd",
            email="elena@alpine.com",
            password_hash=get_password_hash("password123"),
            role="agency",
            status="active"
        )
        traveler_1 = User(
            name="John Traveler",
            email="traveler@safar.com",
            password_hash=get_password_hash("traveler123"),
            role="traveler",
            status="active"
        )
        traveler_2 = User(
            name="Sarah Jenkins",
            email="sarah@example.com",
            password_hash=get_password_hash("password123"),
            role="traveler",
            status="active"
        )
        db.add_all([admin_user, agency_user_1, agency_user_2, traveler_1, traveler_2])
        db.flush()

        # 2. Agencies
        agency_1 = Agency(
            user_id=agency_user_1.id,
            company_name="Oceanic Adventures Co",
            contact_person="David Miller",
            email="agency@safar.com",
            phone="+1 (555) 234-5678",
            verification_status="verified"
        )
        agency_2 = Agency(
            user_id=agency_user_2.id,
            company_name="Alpine Horizons Ltd",
            contact_person="Elena Rostova",
            email="elena@alpine.com",
            phone="+41 22 730 5900",
            verification_status="pending"
        )
        db.add_all([agency_1, agency_2])
        db.flush()

        # 3. 30-Package Catalog (20 Tours + 10 Hotels)
        raw_catalog = [
            # Tours
            {"type": "tour", "title": "Maldives Tropical Retreat", "location": "Maldives", "price": 1499.00, "description": "Experience the ultimate relaxation with our 7-day tropical paradise package. Crystal clear waters and pristine beaches await you.", "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", "duration_days": 7},
            {"type": "tour", "title": "Bali Sunrise & Waves", "location": "Bali, Indonesia", "price": 899.00, "description": "Discover the serene beaches and rich culture of Bali. Surf the best waves and relax in luxury resorts.", "image_url": "https://images.unsplash.com/photo-1507525428034-0a0f6c1e1e5c", "duration_days": 6},
            {"type": "tour", "title": "Caribbean Island Hop", "location": "Bahamas", "price": 2100.00, "description": "A wonderful 10-day island hopping experience across the beautiful Caribbean islands.", "image_url": "https://images.unsplash.com/photo-1493558103817-58b2924bce98", "duration_days": 10},
            {"type": "tour", "title": "Himalayan Base Camp Trek", "location": "Nepal", "price": 2100.00, "description": "Challenge yourself with a 14-day guided trek to the base of the world's highest peak.", "image_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470", "duration_days": 14},
            {"type": "tour", "title": "Swiss Alps Adventure", "location": "Switzerland", "price": 3200.00, "description": "A premium adventure package exploring the majestic Swiss Alps. Perfect for hiking enthusiasts.", "image_url": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", "duration_days": 8},
            {"type": "tour", "title": "Patagonia Wilderness", "location": "Argentina", "price": 2800.00, "description": "Explore dramatic landscapes, glaciers, and mountains of Patagonia on a 12-day expedition.", "image_url": "https://images.unsplash.com/photo-1472214103451-9374bd1c798e", "duration_days": 12},
            {"type": "tour", "title": "Tokyo City Explorer", "location": "Tokyo, Japan", "price": 1800.00, "description": "Immerse yourself in the bustling streets, rich history, and modern marvels of Tokyo.", "image_url": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=70", "duration_days": 7},
            {"type": "tour", "title": "New York Weekend Escapade", "location": "New York, USA", "price": 1200.00, "description": "A fast-paced weekend exploring the city that never sleeps. Times Square, Central Park, & more.", "image_url": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b", "duration_days": 4},
            {"type": "tour", "title": "Dubai Luxury Tour", "location": "Dubai, UAE", "price": 2500.00, "description": "Experience luxury at its finest with our exclusive 5-day Dubai city tour.", "image_url": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c", "duration_days": 5},
            {"type": "tour", "title": "Sahara Desert Expedition", "location": "Morocco", "price": 1350.00, "description": "A mesmerizing 5-day journey through the golden dunes of the Sahara with camel rides.", "image_url": "https://images.unsplash.com/photo-1509316785289-025f5b846b35", "duration_days": 5},
            {"type": "tour", "title": "Atacama Stargazing", "location": "Chile", "price": 1900.00, "description": "Discover the driest non-polar desert in the world and experience unparalleled stargazing.", "image_url": "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0", "duration_days": 6},
            {"type": "tour", "title": "Amazon Rainforest Safari", "location": "Brazil", "price": 2200.00, "description": "Deep dive into the lungs of the Earth. A guided 8-day eco-tour through the Amazon.", "image_url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", "duration_days": 8},
            {"type": "tour", "title": "Yosemite Nature Walk", "location": "California, USA", "price": 950.00, "description": "A peaceful 4-day retreat exploring towering sequoias and beautiful valleys of Yosemite.", "image_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b471", "duration_days": 4},
            {"type": "tour", "title": "Rome Historical Immersion", "location": "Rome, Italy", "price": 1600.00, "description": "Walk through history with our 6-day guided tour of Rome's most famous ancient ruins.", "image_url": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da", "duration_days": 6},
            {"type": "tour", "title": "Machu Picchu Discovery", "location": "Peru", "price": 2400.00, "description": "Uncover the mysteries of the Incas with an exclusive 7-day trek to Machu Picchu.", "image_url": "https://images.unsplash.com/photo-1477587458883-47145ed94245", "duration_days": 7},
            {"type": "tour", "title": "Kyoto Historical Tour", "location": "Kyoto, Japan", "price": 950.00, "description": "Immerse yourself in ancient traditions, stunning temples, and beautiful cherry gardens.", "image_url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e", "duration_days": 5},
            {"type": "tour", "title": "Santorini Island Hopping", "location": "Santorini, Greece", "price": 1400.00, "description": "Cruise the Aegean Sea and witness the most beautiful sunsets in the world.", "image_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800", "duration_days": 6},
            {"type": "tour", "title": "Northern Lights Safari", "location": "Tromsø, Norway", "price": 1600.00, "description": "Chase the magical Aurora Borealis across snowy Arctic landscapes.", "image_url": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&q=70", "duration_days": 5},
            {"type": "tour", "title": "Grand Canyon Rafting", "location": "Arizona, USA", "price": 750.00, "description": "An exhilarating white-water rafting experience through the iconic Grand Canyon.", "image_url": "https://images.unsplash.com/photo-1615551043360-33de8b5f410c?w=800&q=70", "duration_days": 4},
            {"type": "tour", "title": "Taj Mahal & Golden Triangle", "location": "Agra, India", "price": 680.00, "description": "A majestic tour of India's most iconic cultural and historical landmarks.", "image_url": "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=70", "duration_days": 5},

            # Hotels
            {"type": "hotel", "title": "The Plaza Hotel", "location": "New York City, USA", "price": 450.00, "description": "Luxury 5-star hotel offering iconic views of Central Park and world-class service.", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70", "room_type": "Presidential Suite"},
            {"type": "hotel", "title": "Burj Al Arab", "location": "Dubai, UAE", "price": 1200.00, "description": "Experience unparalleled luxury in the world's only 7-star hotel structure.", "image_url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=70", "room_type": "Royal Suite"},
            {"type": "hotel", "title": "Marina Bay Sands", "location": "Singapore", "price": 600.00, "description": "Iconic integrated resort featuring the world's largest rooftop Infinity Pool.", "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=70", "room_type": "Sands Premier Room"},
            {"type": "hotel", "title": "Ritz Paris", "location": "Paris, France", "price": 850.00, "description": "Classic elegance and sophisticated Parisian charm in the heart of the city.", "image_url": "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=70", "room_type": "Grand Deluxe Room"},
            {"type": "hotel", "title": "Atlantis The Palm", "location": "Dubai, UAE", "price": 550.00, "description": "Ocean-themed destination resort offering thrilling waterparks and marine habitats.", "image_url": "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=70", "room_type": "Underwater Suite"},
            {"type": "hotel", "title": "Aman Tokyo", "location": "Tokyo, Japan", "price": 900.00, "description": "A serene sanctuary high above the vibrant city, blending traditional and modern design.", "image_url": "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=70", "room_type": "Premier Suite"},
            {"type": "hotel", "title": "The Savoy", "location": "London, UK", "price": 500.00, "description": "Historic luxury hotel on the River Thames, redefining elegance for over a century.", "image_url": "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6", "room_type": "River View Deluxe"},
            {"type": "hotel", "title": "Four Seasons Bora Bora", "location": "Bora Bora, French Polynesia", "price": 1500.00, "description": "Overwater bungalows and pristine lagoons for the ultimate romantic escape.", "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2", "room_type": "Overwater Bungalow"},
            {"type": "hotel", "title": "Waldorf Astoria", "location": "Maldives", "price": 1800.00, "description": "Exclusive private island resort offering bespoke luxury and ocean views.", "image_url": "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6", "room_type": "Reef Villa"},
            {"type": "hotel", "title": "Amangiri Resort", "location": "Utah, USA", "price": 2000.00, "description": "A remote luxury retreat seamlessly integrated into the dramatic canyon landscape.", "image_url": "https://images.unsplash.com/photo-1517840901100-8179e982acb7", "room_type": "Desert Wing Suite"}
        ]

        created_packages = []
        for i, item in enumerate(raw_catalog):
            pkg = Package(
                agency_id=agency_1.id if i % 2 == 0 else None,
                type=item["type"],
                title=item["title"],
                location=item["location"],
                price=item["price"],
                description=item["description"],
                image_url=item["image_url"],
                duration_days=item.get("duration_days", 5),
                room_type=item.get("room_type", "Luxury Suite"),
                status="active"
            )
            created_packages.append(pkg)

        db.add_all(created_packages)
        db.flush()

        # 4. Bookings & Payments
        booking_1 = Booking(
            traveler_id=traveler_1.id,
            package_id=created_packages[0].id,
            guests=2,
            total_amount=2998.00,
            booking_status="approved",
            payment_status="completed",
            booking_date="2026-08-20"
        )
        booking_2 = Booking(
            traveler_id=traveler_1.id,
            package_id=created_packages[20].id,  # Plaza Hotel
            guests=1,
            total_amount=450.00,
            booking_status="pending",
            payment_status="completed",
            booking_date="2026-08-24"
        )
        booking_3 = Booking(
            traveler_id=traveler_2.id,
            package_id=created_packages[1].id,  # Bali
            guests=2,
            total_amount=1798.00,
            booking_status="approved",
            payment_status="completed",
            booking_date="2026-08-22"
        )
        db.add_all([booking_1, booking_2, booking_3])
        db.flush()

        payment_1 = Payment(
            booking_id=booking_1.id,
            method="credit_card",
            amount=2998.00,
            transaction_id="CC-TX-INIT-001",
            status="completed"
        )
        payment_2 = Payment(
            booking_id=booking_2.id,
            method="demo",
            amount=450.00,
            transaction_id="DEMO-TX-INIT-002",
            status="completed"
        )
        payment_3 = Payment(
            booking_id=booking_3.id,
            method="crypto",
            amount=1798.00,
            transaction_id="CRYPTO-0xINIT003",
            status="completed"
        )
        db.add_all([payment_1, payment_2, payment_3])

        # 5. Platform Settings
        setting_comm = PlatformSetting(key="commission_rate", value="12.5")
        setting_curr = PlatformSetting(key="system_currency", value="USD ($)")
        db.add_all([setting_comm, setting_curr])

        # 6. Activity Logs
        log_1 = ActivityLog(
            actor_user_id=admin_user.id,
            action="SYSTEM_INITIALIZED",
            entity_type="system",
            entity_id="1",
            metadata_json='{"status": "Database populated with enterprise seed data."}'
        )
        db.add(log_1)

        db.commit()
        print("Database successfully seeded with users, packages, bookings, payments, and settings!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
