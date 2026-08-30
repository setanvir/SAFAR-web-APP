"""
Singleton Pattern Implementation for Database Management.
Ensures a single, thread-safe database engine and session factory instance.
"""
import os
import threading
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()


class DatabaseManager:
    """
    Singleton Pattern: Guarantees only ONE database connection pool exists
    across the entire application lifecycle, preventing resource leaks.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, db_url: str = None):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(DatabaseManager, cls).__new__(cls)
                    url = db_url or os.getenv(
                        "DATABASE_URL",
                        "sqlite:///./safar_app.db"
                    )
                    # Support postgres:// URL format compatibility
                    if url.startswith("postgres://"):
                        url = url.replace("postgres://", "postgresql://", 1)

                    connect_args = {"check_same_thread": False} if "sqlite" in url else {}
                    cls._instance.db_url = url
                    cls._instance.engine = create_engine(
                        url,
                        connect_args=connect_args,
                        pool_pre_ping=True
                    )
                    cls._instance.SessionFactory = sessionmaker(
                        autocommit=False,
                        autoflush=False,
                        bind=cls._instance.engine,
                    )
        return cls._instance

    @classmethod
    def get_instance(cls, db_url: str = None):
        """Class method to obtain the Singleton instance."""
        return cls(db_url)

    def get_session(self):
        """Provides a new database session from the single connection pool."""
        return self.SessionFactory()

    def create_all_tables(self):
        """Creates all registered database tables."""
        Base.metadata.create_all(bind=self.engine)

    def drop_all_tables(self):
        """Drops all tables (useful for isolated tests)."""
        Base.metadata.drop_all(bind=self.engine)

    @classmethod
    def reset_instance(cls):
        """Reset Singleton instance (useful for testing isolation)."""
        with cls._lock:
            if cls._instance:
                try:
                    cls._instance.engine.dispose()
                except Exception:
                    pass
            cls._instance = None


def get_db():
    """FastAPI Dependency for database session injection."""
    db_mgr = DatabaseManager.get_instance()
    session = db_mgr.get_session()
    try:
        yield session
    finally:
        session.close()
