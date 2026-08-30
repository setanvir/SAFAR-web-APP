"""
Unit Tests for Singleton Pattern (DatabaseManager).
"""
import pytest
from app.db.session import DatabaseManager


class TestDatabaseManagerSingleton:
    """Tests to verify the Singleton pattern guarantees a single DB instance."""

    def test_singleton_instance_uniqueness(self):
        """Two calls to get_instance must return the exact same object."""
        db1 = DatabaseManager.get_instance("sqlite:///:memory:")
        db2 = DatabaseManager.get_instance("sqlite:///:memory:")
        assert db1 is db2, "Singleton must return the exact same object reference"

    def test_singleton_session_creation(self):
        """get_session must return a usable SQLAlchemy session."""
        db = DatabaseManager.get_instance()
        session = db.get_session()
        assert session is not None
        session.close()

    def test_singleton_engine_exists(self):
        """The singleton must expose an SQLAlchemy engine."""
        db = DatabaseManager.get_instance()
        assert db.engine is not None

    def test_singleton_session_factory_exists(self):
        """The singleton must expose a SessionFactory."""
        db = DatabaseManager.get_instance()
        assert db.SessionFactory is not None
