import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banking_core.settings')
django.setup()

from django.test import Client
from accounts.models import User, BankAccount, AuditLog
from transactions.models import Transaction

def run_tests():
    c = Client()
    print('--- 1. Testing Customer Registration ---')
    # Clean previous test user if exists
    User.objects.filter(username='test_customer').delete()

    reg_res = c.post('/api/accounts/auth/register/', {
        'username': 'test_customer',
        'password': 'BankSecure@2026!',
        'confirm_password': 'BankSecure@2026!',
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'phone_number': '+1-555-9988',
        'initial_account_type': 'SAVINGS',
        'initial_deposit': '2500.00'
    }, content_type='application/json')
    assert reg_res.status_code == 201, f'Reg failed: {reg_res.json()}'
    test_token = reg_res.json()['token']
    print('Customer registered successfully. Token received.')

    print('--- 2. Testing Customer Accounts & New Account Creation ---')
    accs_res = c.get('/api/accounts/my-accounts/', HTTP_AUTHORIZATION=f'Token {test_token}')
    accs_data = accs_res.json().get('results', accs_res.json()) if isinstance(accs_res.json(), dict) else accs_res.json()
    assert len(accs_data) >= 1
    sender_acc = accs_data[0]
    print(f"Initial Account: #{sender_acc['account_number']} Balance: ${sender_acc['balance']}")

    new_acc_res = c.post('/api/accounts/my-accounts/', {
        'account_type': 'CURRENT',
        'initial_deposit': '1000.00'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert new_acc_res.status_code == 201
    print('Second account created successfully.')

    print('--- 3. Testing Atomic Money Transfer ---')
    john_acc = BankAccount.objects.get(account_number='100188234912')
    initial_john_bal = john_acc.balance

    # Try overdraft
    fail_transfer = c.post('/api/transactions/transfer/', {
        'sender_account_id': sender_acc['id'],
        'receiver_account_number': john_acc.account_number,
        'amount': '999999.00',
        'remarks': 'Overdraft test'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert fail_transfer.status_code == 400
    print('Overdraft correctly prevented with 400 Bad Request.')

    # Valid transfer
    ok_transfer = c.post('/api/transactions/transfer/', {
        'sender_account_id': sender_acc['id'],
        'receiver_account_number': john_acc.account_number,
        'amount': '500.00',
        'remarks': 'Valid test transfer'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert ok_transfer.status_code == 201
    txn_id = ok_transfer.json()['transaction']['transaction_id']
    print(f'Transfer succeeded. Transaction ID: {txn_id}')

    john_acc.refresh_from_db()
    assert john_acc.balance == initial_john_bal + 500, 'Receiver balance mismatch'
    print(f'Receiver balance verified: ${john_acc.balance}')

    print('--- 4. Testing PDF Receipt Generation ---')
    receipt_res = c.get(f'/api/transactions/receipt/{txn_id}/', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert receipt_res.status_code == 200
    assert receipt_res['Content-Type'] == 'application/pdf'
    assert receipt_res.content.startswith(b'%PDF'), 'Not valid PDF bytes'
    print('PDF Receipt generated successfully with ReportLab.')

    print('--- 5. Testing Simulated Deposit & Withdrawal ---')
    dep_res = c.post('/api/transactions/deposit/', {
        'account_id': sender_acc['id'],
        'amount': '300.00',
        'remarks': 'Test deposit'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert dep_res.status_code == 201
    print('Deposit succeeded.')

    with_res = c.post('/api/transactions/withdraw/', {
        'account_id': sender_acc['id'],
        'amount': '150.00',
        'remarks': 'Test withdrawal'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert with_res.status_code == 201
    print('Withdrawal succeeded.')

    print('--- 6. Testing Admin Portal & Operations ---')
    admin_login = c.post('/api/accounts/auth/admin-login/', {
        'username_or_email': 'admin',
        'password': 'admin123'
    }, content_type='application/json')
    assert admin_login.status_code == 200
    admin_token = admin_login.json()['token']

    # Freeze account
    toggle_acc = c.post(f"/api/accounts/admin/accounts/{sender_acc['id']}/toggle-status/", HTTP_AUTHORIZATION=f'Token {admin_token}')
    assert toggle_acc.status_code == 200
    assert toggle_acc.json()['is_active'] is False
    print('Account successfully frozen by Admin.')

    # Verify that frozen account cannot transfer
    fail_frozen = c.post('/api/transactions/transfer/', {
        'sender_account_id': sender_acc['id'],
        'receiver_account_number': john_acc.account_number,
        'amount': '50.00'
    }, content_type='application/json', HTTP_AUTHORIZATION=f'Token {test_token}')
    assert fail_frozen.status_code == 400
    print('Frozen account transfer prevented correctly.')

    # Unfreeze account
    unfreeze_acc = c.post(f"/api/accounts/admin/accounts/{sender_acc['id']}/toggle-status/", HTTP_AUTHORIZATION=f'Token {admin_token}')
    assert unfreeze_acc.status_code == 200 and unfreeze_acc.json()['is_active'] is True
    print('Account un-frozen successfully.')

    # Verify audit log recorded the operations
    latest_audit = AuditLog.objects.filter(admin__username='admin').first()
    assert latest_audit is not None
    print(f'Audit log verified: {latest_audit.action} on {latest_audit.target_type}')

    # CSV Export verification
    csv_res = c.get('/api/analytics/export-csv/?type=transactions', HTTP_AUTHORIZATION=f'Token {admin_token}')
    assert csv_res.status_code == 200 and 'Transaction ID' in csv_res.content.decode('utf-8')
    print('CSV Export verified.')

    # Clean up test user
    User.objects.filter(username='test_customer').delete()

    print('\n=============================================')
    print('ALL 6 END-TO-END VERIFICATION SUITES PASSED!')
    print('=============================================')

if __name__ == '__main__':
    run_tests()
