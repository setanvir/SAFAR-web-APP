"""
Strategy Pattern Implementation for Payment Processing.
Encapsulates interchangeable payment fee calculations and transaction execution algorithms.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
import uuid


class PaymentStrategy(ABC):
    """Abstract Strategy interface for calculating total and processing transactions."""

    @abstractmethod
    def calculate_total(self, base_price: float, travelers_count: int) -> float:
        """Calculates final amount including method-specific surcharges/discounts."""
        pass

    @abstractmethod
    def process_payment(self, amount: float, details: Dict[str, Any]) -> Dict[str, Any]:
        """Executes the transaction safely (never persisting sensitive card credentials)."""
        pass


class CreditCardPaymentStrategy(PaymentStrategy):
    """Concrete Strategy: Credit Card (adds 2.5% processing fee)."""

    def calculate_total(self, base_price: float, travelers_count: int) -> float:
        subtotal = float(base_price) * travelers_count
        return round(subtotal * 1.025, 2)

    def process_payment(self, amount: float, details: Dict[str, Any]) -> Dict[str, Any]:
        tx_id = f"CC-TX-{uuid.uuid4().hex[:12].upper()}"
        last4 = str(details.get("card_number", "4242"))[-4:]
        msg = f"Paid ${amount:.2f} via Credit Card ending in {last4}. TxID: {tx_id}"
        return {
            "status": "success",
            "method": "Credit Card",
            "amount": round(amount, 2),
            "fee_applied_percent": 2.5,
            "transaction_id": tx_id,
            "card_last4": last4,
            "message": msg,
            "gateway_message": "Authorized via Secure Card Network (Tokenized)",
        }


class CryptoPaymentStrategy(PaymentStrategy):
    """Concrete Strategy: Cryptocurrency (applies 5% instant discount)."""

    def calculate_total(self, base_price: float, travelers_count: int) -> float:
        subtotal = float(base_price) * travelers_count
        return round(subtotal * 0.95, 2)

    def process_payment(self, amount: float, details: Dict[str, Any]) -> Dict[str, Any]:
        tx_id = f"CRYPTO-0x{uuid.uuid4().hex[:16].lower()}"
        wallet = details.get("wallet_address", details.get("wallet", "0xABCDEF123456"))
        msg = f"Paid ${amount:.2f} via Cryptocurrency ({wallet}). TxID: {tx_id}"
        return {
            "status": "success",
            "method": "Cryptocurrency",
            "amount": round(amount, 2),
            "discount_applied_percent": 5.0,
            "transaction_id": tx_id,
            "wallet_type": wallet,
            "message": msg,
            "gateway_message": "Confirmed on Blockchain Ledger",
        }


class DemoWalletPaymentStrategy(PaymentStrategy):
    """Concrete Strategy: SAFAR Demo Wallet (0% fees, instant settlement)."""

    def calculate_total(self, base_price: float, travelers_count: int) -> float:
        return round(float(base_price) * travelers_count, 2)

    def process_payment(self, amount: float, details: Dict[str, Any]) -> Dict[str, Any]:
        tx_id = f"DEMO-TX-{uuid.uuid4().hex[:10].upper()}"
        msg = f"Paid ${amount:.2f} via SAFAR Demo Wallet. TxID: {tx_id}"
        return {
            "status": "success",
            "method": "SAFAR Demo Wallet",
            "amount": round(amount, 2),
            "fee_applied_percent": 0.0,
            "transaction_id": tx_id,
            "message": msg,
            "gateway_message": "Instant Demo Balance Settlement",
        }


class PaymentContext:
    """Context maintaining a reference to the active Strategy."""

    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: PaymentStrategy):
        self._strategy = strategy

    def calculate(self, base_price: float, travelers_count: int) -> float:
        return self._strategy.calculate_total(base_price, travelers_count)

    def execute_payment(self, amount: float, details: Dict[str, Any]) -> Dict[str, Any]:
        return self._strategy.process_payment(amount, details)
