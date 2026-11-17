from django.db import transaction
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from accounts.models import BankAccount, Notification
from .models import Transaction


def transfer_money(user, sender_account_id, receiver_account_number, amount, remarks=""):
    """
    Performs an atomic money transfer between two active accounts.
    Uses select_for_update() to prevent race conditions and overdrafts.
    """
    try:
        amount = Decimal(str(amount))
    except Exception:
        raise ValidationError({"amount": "Invalid transaction amount."})

    if amount <= Decimal('0.00'):
        raise ValidationError({"amount": "Transfer amount must be strictly greater than zero."})

    receiver_account_number = ''.join(c for c in str(receiver_account_number) if c.isalnum()).strip()

    # Database atomic block with row-locking
    with transaction.atomic():
        # 1. Lock and validate sender account
        try:
            sender = BankAccount.objects.select_for_update().get(id=sender_account_id, user=user)
        except BankAccount.DoesNotExist:
            raise ValidationError({"sender_account": "Sender bank account not found or access denied."})

        if not sender.is_active:
            raise ValidationError({"sender_account": "Your selected account is inactive or frozen. Transfers are disabled."})

        if sender.account_number == receiver_account_number:
            raise ValidationError({"receiver_account_number": "Cannot transfer money to the same account."})

        # 2. Lock and validate receiver account
        try:
            receiver = BankAccount.objects.select_for_update().get(account_number=receiver_account_number)
        except BankAccount.DoesNotExist:
            raise ValidationError({"receiver_account_number": "Beneficiary account not found. Please verify the account number."})

        if not receiver.is_active:
            raise ValidationError({"receiver_account_number": "The destination account is currently inactive or frozen."})

        # 3. Check sufficient balance
        if sender.balance < amount:
            raise ValidationError({
                "amount": f"Insufficient funds. Available balance: ${sender.balance:.2f}, transfer amount: ${amount:.2f}."
            })

        # 4. Perform atomic balance updates
        sender.balance -= amount
        receiver.balance += amount
        sender.save(update_fields=['balance', 'updated_at'])
        receiver.save(update_fields=['balance', 'updated_at'])

        # 5. Create Transaction record with both balances captured
        txn = Transaction.objects.create(
            sender_account=sender,
            receiver_account=receiver,
            transaction_type='TRANSFER',
            amount=amount,
            status='SUCCESS',
            remarks=remarks or f"Transfer from {sender.account_number} to {receiver.account_number}",
            sender_balance_after=sender.balance,
            receiver_balance_after=receiver.balance
        )

        # 6. Create Notifications for both parties
        sender_name = sender.user.get_full_name() or sender.user.username
        receiver_name = receiver.user.get_full_name() or receiver.user.username

        Notification.objects.create(
            user=sender.user,
            title="Money Sent",
            message=f"Successfully transferred ${amount:.2f} to {receiver_name} (A/C: {receiver.account_number}). Ref: {txn.transaction_id}",
            notification_type='TRANSFER'
        )

        Notification.objects.create(
            user=receiver.user,
            title="Money Received",
            message=f"Received ${amount:.2f} from {sender_name} (A/C: {sender.account_number}). Ref: {txn.transaction_id}",
            notification_type='CREDIT'
        )

        return txn


def deposit_money(user, account_id, amount, remarks=""):
    """
    Performs a simulated cash deposit into an active account.
    """
    try:
        amount = Decimal(str(amount))
    except Exception:
        raise ValidationError({"amount": "Invalid deposit amount."})

    if amount <= Decimal('0.00'):
        raise ValidationError({"amount": "Deposit amount must be greater than zero."})

    with transaction.atomic():
        try:
            account = BankAccount.objects.select_for_update().get(id=account_id, user=user)
        except BankAccount.DoesNotExist:
            raise ValidationError({"account": "Account not found or access denied."})

        if not account.is_active:
            raise ValidationError({"account": "This account is inactive. Deposits cannot be accepted."})

        account.balance += amount
        account.save(update_fields=['balance', 'updated_at'])

        txn = Transaction.objects.create(
            sender_account=None,
            receiver_account=account,
            transaction_type='DEPOSIT',
            amount=amount,
            status='SUCCESS',
            remarks=remarks or f"Simulated deposit into #{account.account_number}",
            receiver_balance_after=account.balance
        )

        Notification.objects.create(
            user=account.user,
            title="Deposit Successful",
            message=f"Deposited ${amount:.2f} into account #{account.account_number}. New balance: ${account.balance:.2f}. Ref: {txn.transaction_id}",
            notification_type='DEPOSIT'
        )

        return txn


def withdraw_money(user, account_id, amount, remarks=""):
    """
    Performs a simulated cash withdrawal from an active account.
    """
    try:
        amount = Decimal(str(amount))
    except Exception:
        raise ValidationError({"amount": "Invalid withdrawal amount."})

    if amount <= Decimal('0.00'):
        raise ValidationError({"amount": "Withdrawal amount must be greater than zero."})

    with transaction.atomic():
        try:
            account = BankAccount.objects.select_for_update().get(id=account_id, user=user)
        except BankAccount.DoesNotExist:
            raise ValidationError({"account": "Account not found or access denied."})

        if not account.is_active:
            raise ValidationError({"account": "This account is inactive. Withdrawals are disabled."})

        if account.balance < amount:
            raise ValidationError({
                "amount": f"Insufficient funds. Available balance: ${account.balance:.2f}, requested: ${amount:.2f}."
            })

        account.balance -= amount
        account.save(update_fields=['balance', 'updated_at'])

        txn = Transaction.objects.create(
            sender_account=account,
            receiver_account=None,
            transaction_type='WITHDRAWAL',
            amount=amount,
            status='SUCCESS',
            remarks=remarks or f"Simulated cash withdrawal from #{account.account_number}",
            sender_balance_after=account.balance
        )

        Notification.objects.create(
            user=account.user,
            title="Withdrawal Successful",
            message=f"Withdrew ${amount:.2f} from account #{account.account_number}. Remaining balance: ${account.balance:.2f}. Ref: {txn.transaction_id}",
            notification_type='WITHDRAWAL'
        )

        return txn
