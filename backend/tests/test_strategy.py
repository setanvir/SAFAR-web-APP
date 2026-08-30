"""
Unit Tests for Strategy Pattern (Payment Strategies).
"""
import pytest
from app.strategies.payment_strategy import (
    CreditCardPaymentStrategy,
    CryptoPaymentStrategy,
    DemoWalletPaymentStrategy,
    PaymentContext,
)


class TestPaymentStrategies:
    """Tests to verify the Strategy pattern applies correct pricing and payment logic."""

    def test_credit_card_adds_fee(self):
        ctx = PaymentContext(CreditCardPaymentStrategy())
        # 100 * 2 = 200 + 2.5% fee (5) = 205.0
        assert ctx.calculate(100.0, 2) == 205.0

    def test_credit_card_payment_success(self):
        ctx = PaymentContext(CreditCardPaymentStrategy())
        result = ctx.execute_payment(205.0, {"card_number": "4111111111111234"})
        assert result["status"] == "success"
        assert result["method"] == "Credit Card"
        assert "1234" in result["message"]

    def test_crypto_gives_discount(self):
        ctx = PaymentContext(CryptoPaymentStrategy())
        # 100 * 2 = 200 - 5% discount (10) = 190.0
        assert ctx.calculate(100.0, 2) == 190.0

    def test_crypto_payment_success(self):
        ctx = PaymentContext(CryptoPaymentStrategy())
        result = ctx.execute_payment(190.0, {"wallet_address": "0xABCDEF123456"})
        assert result["status"] == "success"
        assert "Cryptocurrency" in result["method"]

    def test_demo_wallet_no_fee(self):
        ctx = PaymentContext(DemoWalletPaymentStrategy())
        assert ctx.calculate(300.0, 1) == 300.0

    def test_demo_wallet_payment_success(self):
        ctx = PaymentContext(DemoWalletPaymentStrategy())
        result = ctx.execute_payment(300.0, {})
        assert result["status"] == "success"
        assert result["method"] == "SAFAR Demo Wallet"

    def test_strategy_swap_at_runtime(self):
        """Strategy can be changed at runtime via set_strategy."""
        ctx = PaymentContext(DemoWalletPaymentStrategy())
        assert ctx.calculate(100.0, 1) == 100.0
        ctx.set_strategy(CreditCardPaymentStrategy())
        assert ctx.calculate(100.0, 1) == 102.5
