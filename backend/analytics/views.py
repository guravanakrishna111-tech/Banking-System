import csv
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from rest_framework import views, status
from rest_framework.response import Response
from accounts.models import User, BankAccount
from accounts.permissions import IsAdminUserOnly
from transactions.models import Transaction


class AdminDashboardAnalyticsView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        now = timezone.now()

        # High-level KPIs
        total_users = User.objects.filter(role='CUSTOMER').count()
        total_accounts = BankAccount.objects.count()
        active_accounts = BankAccount.objects.filter(is_active=True).count()
        inactive_accounts = total_accounts - active_accounts

        total_transactions = Transaction.objects.count()

        transfers = Transaction.objects.filter(transaction_type='TRANSFER', status='SUCCESS')
        total_transferred = transfers.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        deposits = Transaction.objects.filter(transaction_type='DEPOSIT', status='SUCCESS')
        total_deposits = deposits.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        withdrawals = Transaction.objects.filter(transaction_type='WITHDRAWAL', status='SUCCESS')
        total_withdrawals = withdrawals.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # 7-day daily activity
        daily_labels = []
        daily_transfers = []
        daily_deposits = []
        daily_withdrawals = []

        for i in range(6, -1, -1):
            day = (now - timedelta(days=i)).date()
            daily_labels.append(day.strftime('%b %d'))

            day_txns = Transaction.objects.filter(created_at__date=day, status='SUCCESS')
            d_transfer = day_txns.filter(transaction_type='TRANSFER').aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            d_deposit = day_txns.filter(transaction_type='DEPOSIT').aggregate(s=Sum('amount'))['s'] or Decimal('0.00')
            d_withdraw = day_txns.filter(transaction_type='WITHDRAWAL').aggregate(s=Sum('amount'))['s'] or Decimal('0.00')

            daily_transfers.append(float(d_transfer))
            daily_deposits.append(float(d_deposit))
            daily_withdrawals.append(float(d_withdraw))

        # Account type breakdown
        savings_count = BankAccount.objects.filter(account_type='SAVINGS').count()
        current_count = BankAccount.objects.filter(account_type='CURRENT').count()

        # Most active accounts
        active_accounts_data = []
        top_accounts = BankAccount.objects.annotate(
            sent_count=Count('sent_transactions'),
            received_count=Count('received_transactions')
        ).order_by('-sent_count')[:5]

        for acc in top_accounts:
            active_accounts_data.append({
                "account_number": acc.account_number,
                "holder": acc.user.get_full_name() or acc.user.username,
                "type": acc.account_type,
                "balance": f"{acc.balance:.2f}",
                "transaction_count": acc.sent_count + acc.received_count
            })

        return Response({
            "kpis": {
                "total_users": total_users,
                "total_accounts": total_accounts,
                "active_accounts": active_accounts,
                "inactive_accounts": inactive_accounts,
                "total_transactions": total_transactions,
                "total_transferred": f"{total_transferred:.2f}",
                "total_deposits": f"{total_deposits:.2f}",
                "total_withdrawals": f"{total_withdrawals:.2f}",
            },
            "daily_chart": {
                "labels": daily_labels,
                "transfers": daily_transfers,
                "deposits": daily_deposits,
                "withdrawals": daily_withdrawals,
            },
            "account_types": {
                "savings": savings_count,
                "current": current_count,
            },
            "top_accounts": active_accounts_data
        })


class ExportReportCSVView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        report_type = request.query_params.get('type', 'transactions')
        response = HttpResponse(content_type='text/csv')

        if report_type == 'users':
            response['Content-Disposition'] = 'attachment; filename="users_report.csv"'
            writer = csv.writer(response)
            writer.writerow(['User ID', 'Username', 'Email', 'Full Name', 'Phone', 'Role', 'Status', 'Date Joined'])
            for u in User.objects.all().order_by('-date_joined'):
                writer.writerow([
                    u.id, u.username, u.email, u.get_full_name(),
                    u.phone_number, u.role, 'Active' if u.is_active else 'Inactive',
                    u.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                ])

        elif report_type == 'accounts':
            response['Content-Disposition'] = 'attachment; filename="accounts_report.csv"'
            writer = csv.writer(response)
            writer.writerow(['Account Number', 'Account Holder', 'Type', 'Balance ($)', 'IFSC Code', 'Status', 'Created At'])
            for acc in BankAccount.objects.select_related('user').all().order_by('-created_at'):
                writer.writerow([
                    acc.account_number, acc.user.get_full_name() or acc.user.username,
                    acc.account_type, acc.balance, acc.ifsc_code,
                    'Active' if acc.is_active else 'Inactive',
                    acc.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        else: # transactions
            response['Content-Disposition'] = 'attachment; filename="transactions_report.csv"'
            writer = csv.writer(response)
            writer.writerow([
                'Transaction ID', 'Type', 'Amount ($)', 'Status',
                'Sender Account', 'Sender Name', 'Receiver Account',
                'Receiver Name', 'Remarks', 'Date & Time'
            ])
            for txn in Transaction.objects.select_related('sender_account__user', 'receiver_account__user').all().order_by('-created_at'):
                sender_acc = txn.sender_account.account_number if txn.sender_account else 'N/A'
                sender_name = txn.sender_account.user.get_full_name() if txn.sender_account else 'Cash/ATM'
                receiver_acc = txn.receiver_account.account_number if txn.receiver_account else 'N/A'
                receiver_name = txn.receiver_account.user.get_full_name() if txn.receiver_account else 'Cash/ATM'

                writer.writerow([
                    txn.transaction_id, txn.transaction_type, txn.amount, txn.status,
                    sender_acc, sender_name, receiver_acc, receiver_name,
                    txn.remarks, txn.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

        return response
