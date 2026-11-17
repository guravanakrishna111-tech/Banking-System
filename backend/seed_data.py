import os
import django
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banking_core.settings')
django.setup()

from accounts.models import User, BankAccount, Beneficiary, Notification, AuditLog
from transactions.models import Transaction

def seed():
    print("Seeding database with initial users, bank accounts, and transactions...")

    # 1. Create Admin
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@onlinebank.com',
            'first_name': 'Bank',
            'last_name': 'Administrator',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'phone_number': '+1-800-555-0199',
            'address': 'Headquarters, 100 Financial Way, New York, NY'
        }
    )
    admin_user.set_password('admin123')
    admin_user.save()
    print(f"Admin user: {admin_user.username} (password: admin123)")

    # 2. Create Customers
    customers_data = [
        {
            'username': 'john_doe',
            'email': 'john@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'phone': '+1-555-0143',
            'address': '742 Evergreen Terrace, Springfield',
            'accounts': [
                {'acc_num': '100188234912', 'type': 'SAVINGS', 'balance': Decimal('14500.00')},
                {'acc_num': '100199341256', 'type': 'CURRENT', 'balance': Decimal('6200.00')}
            ]
        },
        {
            'username': 'alice_smith',
            'email': 'alice@example.com',
            'first_name': 'Alice',
            'last_name': 'Smith',
            'phone': '+1-555-0188',
            'address': '124 Conch Street, Bikini Bottom',
            'accounts': [
                {'acc_num': '100177452390', 'type': 'SAVINGS', 'balance': Decimal('9850.00')}
            ]
        },
        {
            'username': 'robert_brown',
            'email': 'robert@example.com',
            'first_name': 'Robert',
            'last_name': 'Brown',
            'phone': '+1-555-0122',
            'address': '221B Baker Street, London',
            'accounts': [
                {'acc_num': '100166348911', 'type': 'SAVINGS', 'balance': Decimal('4300.00')}
            ]
        }
    ]

    created_users = {}
    created_accounts = {}

    for c in customers_data:
        user, _ = User.objects.get_or_create(
            username=c['username'],
            defaults={
                'email': c['email'],
                'first_name': c['first_name'],
                'last_name': c['last_name'],
                'phone_number': c['phone'],
                'address': c['address'],
                'role': 'CUSTOMER',
                'id_proof_number': 'ID-' + c['username'].upper()
            }
        )
        user.set_password('password123')
        user.save()
        created_users[c['username']] = user

        for acc_info in c['accounts']:
            acc, _ = BankAccount.objects.get_or_create(
                account_number=acc_info['acc_num'],
                defaults={
                    'user': user,
                    'account_type': acc_info['type'],
                    'balance': acc_info['balance'],
                    'ifsc_code': 'OBMS0001234',
                    'is_active': True
                }
            )
            created_accounts[acc_info['acc_num']] = acc

    print(f"Created {len(created_users)} customers and {len(created_accounts)} bank accounts.")

    # 3. Create Beneficiaries
    john = created_users['john_doe']
    alice = created_users['alice_smith']
    robert = created_users['robert_brown']

    Beneficiary.objects.get_or_create(
        user=john,
        account_number='100177452390',
        defaults={
            'beneficiary_name': 'Alice Smith',
            'bank_name': 'Online Banking System',
            'ifsc_code': 'OBMS0001234',
            'nickname': 'Alice Business'
        }
    )
    Beneficiary.objects.get_or_create(
        user=john,
        account_number='100166348911',
        defaults={
            'beneficiary_name': 'Robert Brown',
            'bank_name': 'Online Banking System',
            'ifsc_code': 'OBMS0001234',
            'nickname': 'Robert Contractor'
        }
    )
    Beneficiary.objects.get_or_create(
        user=alice,
        account_number='100188234912',
        defaults={
            'beneficiary_name': 'John Doe',
            'bank_name': 'Online Banking System',
            'ifsc_code': 'OBMS0001234',
            'nickname': 'John Savings'
        }
    )

    # 4. Create Transactions with historical spread for Chart.js
    now = timezone.now()
    john_savings = created_accounts['100188234912']
    john_current = created_accounts['100199341256']
    alice_savings = created_accounts['100177452390']
    robert_savings = created_accounts['100166348911']

    txns_data = [
        {
            'type': 'DEPOSIT',
            'sender': None,
            'receiver': john_savings,
            'amount': Decimal('10000.00'),
            'remarks': 'Initial cash deposit',
            'days_ago': 6,
            'sender_bal': None,
            'receiver_bal': Decimal('10000.00')
        },
        {
            'type': 'DEPOSIT',
            'sender': None,
            'receiver': alice_savings,
            'amount': Decimal('8000.00'),
            'remarks': 'Payroll direct deposit',
            'days_ago': 5,
            'sender_bal': None,
            'receiver_bal': Decimal('8000.00')
        },
        {
            'type': 'TRANSFER',
            'sender': john_savings,
            'receiver': alice_savings,
            'amount': Decimal('1200.00'),
            'remarks': 'Consulting invoice payment #104',
            'days_ago': 4,
            'sender_bal': Decimal('8800.00'),
            'receiver_bal': Decimal('9200.00')
        },
        {
            'type': 'WITHDRAWAL',
            'sender': john_savings,
            'receiver': None,
            'amount': Decimal('500.00'),
            'remarks': 'ATM Cash Withdrawal',
            'days_ago': 3,
            'sender_bal': Decimal('8300.00'),
            'receiver_bal': None
        },
        {
            'type': 'TRANSFER',
            'sender': alice_savings,
            'receiver': john_current,
            'amount': Decimal('650.00'),
            'remarks': 'Shared project expense reimbursement',
            'days_ago': 2,
            'sender_bal': Decimal('8550.00'),
            'receiver_bal': Decimal('6200.00')
        },
        {
            'type': 'DEPOSIT',
            'sender': None,
            'receiver': john_savings,
            'amount': Decimal('6700.00'),
            'remarks': 'Client wire transfer',
            'days_ago': 1,
            'sender_bal': None,
            'receiver_bal': Decimal('15000.00')
        },
        {
            'type': 'TRANSFER',
            'sender': john_savings,
            'receiver': robert_savings,
            'amount': Decimal('500.00'),
            'remarks': 'Design retainer fee',
            'days_ago': 0,
            'sender_bal': Decimal('14500.00'),
            'receiver_bal': Decimal('4300.00')
        }
    ]

    for t in txns_data:
        txn = Transaction.objects.create(
            sender_account=t['sender'],
            receiver_account=t['receiver'],
            transaction_type=t['type'],
            amount=t['amount'],
            status='SUCCESS',
            remarks=t['remarks'],
            sender_balance_after=t['sender_bal'],
            receiver_balance_after=t['receiver_bal']
        )
        # Shift created_at for chart trends
        txn.created_at = now - timedelta(days=t['days_ago'], hours=2)
        txn.save(update_fields=['created_at'])

    # 5. Create Initial Notifications
    Notification.objects.get_or_create(
        user=john,
        title="Welcome to Online Banking",
        defaults={
            'message': "Your online banking accounts have been activated. You can now transfer funds, deposit, and manage beneficiaries.",
            'notification_type': 'ACCOUNT',
            'is_read': False
        }
    )
    Notification.objects.get_or_create(
        user=None, # Global Announcement
        title="System Maintenance Notice",
        defaults={
            'message': "Scheduled maintenance every Sunday 02:00 AM - 03:00 AM UTC. Simulated banking remains operational 24/7.",
            'notification_type': 'ANNOUNCEMENT',
            'is_read': False
        }
    )

    # 6. Create Initial Audit Logs
    AuditLog.objects.get_or_create(
        admin=admin_user,
        action="SYSTEM_INITIALIZED",
        defaults={
            'target_type': 'System',
            'target_id': '0',
            'details': 'Online Banking Management System seeded with test accounts and security rules.',
            'ip_address': '127.0.0.1'
        }
    )

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
