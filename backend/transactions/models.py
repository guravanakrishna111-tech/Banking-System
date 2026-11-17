import uuid
from django.db import models
from django.utils import timezone
from decimal import Decimal
from accounts.models import BankAccount


def generate_transaction_id():
    """Generates a unique readable transaction ID: TXN-YYYYMMDD-HEX"""
    today_str = timezone.now().strftime('%Y%m%d')
    random_hex = uuid.uuid4().hex[:8].upper()
    return f"TXN{today_str}{random_hex}"


class Transaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('TRANSFER', 'Account Transfer'),
        ('DEPOSIT', 'Cash Deposit'),
        ('WITHDRAWAL', 'Cash Withdrawal'),
    )

    STATUS_CHOICES = (
        ('SUCCESS', 'Successful'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending'),
    )

    transaction_id = models.CharField(max_length=32, unique=True, default=generate_transaction_id, db_index=True)
    sender_account = models.ForeignKey(
        BankAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_transactions'
    )
    receiver_account = models.ForeignKey(
        BankAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUCCESS')
    remarks = models.CharField(max_length=255, blank=True)
    sender_balance_after = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    receiver_balance_after = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_id} | {self.transaction_type} | ${self.amount} | {self.status}"
