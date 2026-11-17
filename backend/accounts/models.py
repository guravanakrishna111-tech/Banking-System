import random
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal


def generate_account_number():
    """Generates a unique 12-digit account number starting with 1001"""
    return f"1001{random.randint(10000000, 99999999)}"


class User(AbstractUser):
    ROLE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('ADMIN', 'Administrator'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    id_proof_number = models.CharField(max_length=50, blank=True, help_text="Aadhar/SSN/Passport ID")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_bank_admin(self):
        return self.role == 'ADMIN' or self.is_superuser or self.is_staff


class BankAccount(models.Model):
    ACCOUNT_TYPE_CHOICES = (
        ('SAVINGS', 'Savings Account'),
        ('CURRENT', 'Current Account'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bank_accounts')
    account_number = models.CharField(max_length=20, unique=True, default=generate_account_number, db_index=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='SAVINGS')
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    ifsc_code = models.CharField(max_length=15, default='OBMS0001234')
    currency = models.CharField(max_length=10, default='USD')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account_number} - {self.user.get_full_name() or self.user.username} ({self.account_type})"


class Beneficiary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='beneficiaries')
    account_number = models.CharField(max_length=20)
    beneficiary_name = models.CharField(max_length=150)
    bank_name = models.CharField(max_length=100, default='Online Banking System')
    ifsc_code = models.CharField(max_length=15, default='OBMS0001234')
    nickname = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Beneficiaries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.beneficiary_name} ({self.account_number})"


class Notification(models.Model):
    TYPE_CHOICES = (
        ('TRANSFER', 'Money Transfer'),
        ('CREDIT', 'Money Received'),
        ('DEBIT', 'Money Deducted'),
        ('DEPOSIT', 'Deposit Successful'),
        ('WITHDRAWAL', 'Withdrawal Successful'),
        ('ACCOUNT', 'Account Update'),
        ('ANNOUNCEMENT', 'Admin Announcement'),
        ('SECURITY', 'Security Alert'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='ACCOUNT')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username if self.user else 'All'}"


class AuditLog(models.Model):
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50)
    target_id = models.CharField(max_length=50, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.CharField(max_length=45, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} by {self.admin.username if self.admin else 'System'} at {self.timestamp}"
