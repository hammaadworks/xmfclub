from abc import ABC, abstractmethod
from typing import Dict, Any
import razorpay
from app.core.config import settings

class PaymentProvider(ABC):
    @abstractmethod
    async def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def verify_signature(self, body: str, signature: str) -> bool:
        pass

class RazorpayProvider(PaymentProvider):
    def __init__(self):
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    async def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any]):
        data = {
            "amount": int(amount * 100),
            "currency": currency,
            "receipt": receipt,
            "notes": notes
        }
        return self.client.order.create(data=data)

    async def verify_signature(self, body: str, signature: str):
        return self.client.utility.verify_webhook_signature(body, signature, settings.RAZORPAY_WEBHOOK_SECRET)

class PhonePeProvider(PaymentProvider):
    async def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any]):
        # Implementation for PhonePe API
        return {"status": "phonepe_order_simulated"}

    async def verify_signature(self, body: str, signature: str):
        return True

class CashfreeProvider(PaymentProvider):
    async def create_order(self, amount: float, currency: str, receipt: str, notes: Dict[str, Any]):
        # Implementation for Cashfree API
        return {"status": "cashfree_order_simulated"}

    async def verify_signature(self, body: str, signature: str):
        return True

class PaymentOrchestrator:
    def __init__(self):
        self._providers = {
            "razorpay": RazorpayProvider(),
            "phonepe": PhonePeProvider(),
            "cashfree": CashfreeProvider()
        }

    def get_provider(self, name: str) -> PaymentProvider:
        provider = self._providers.get(name.lower())
        if not provider:
            raise ValueError(f"Provider {name} not supported")
        return provider
