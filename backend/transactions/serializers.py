from rest_framework import serializers
from decimal import Decimal
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    sender_account_number = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    receiver_account_number = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    flow_type = serializers.SerializerMethodField()
    balance_snapshot = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id', 'transaction_type', 'amount', 'status',
            'remarks', 'sender_account', 'sender_account_number', 'sender_name',
            'receiver_account', 'receiver_account_number', 'receiver_name',
            'flow_type', 'balance_snapshot', 'created_at'
        ]

    def get_sender_account_number(self, obj):
        return obj.sender_account.account_number if obj.sender_account else "CASH/ATM"

    def get_sender_name(self, obj):
        if obj.sender_account and obj.sender_account.user:
            return obj.sender_account.user.get_full_name() or obj.sender_account.user.username
        return "External"

    def get_receiver_account_number(self, obj):
        return obj.receiver_account.account_number if obj.receiver_account else "CASH/ATM"

    def get_receiver_name(self, obj):
        if obj.receiver_account and obj.receiver_account.user:
            return obj.receiver_account.user.get_full_name() or obj.receiver_account.user.username
        return "Cash Withdrawal"

    def get_flow_type(self, obj):
        """Determines if this transaction is a DEBIT or CREDIT from the perspective of current request user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.transaction_type

        user = request.user
        if obj.transaction_type == 'TRANSFER':
            if obj.sender_account and obj.sender_account.user == user:
                return 'DEBIT'
            elif obj.receiver_account and obj.receiver_account.user == user:
                return 'CREDIT'
        elif obj.transaction_type == 'DEPOSIT':
            return 'CREDIT'
        elif obj.transaction_type == 'WITHDRAWAL':
            return 'DEBIT'
        return obj.transaction_type

    def get_balance_snapshot(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        user = request.user
        if obj.sender_account and obj.sender_account.user == user:
            return obj.sender_balance_after
        elif obj.receiver_account and obj.receiver_account.user == user:
            return obj.receiver_balance_after
        return None


class TransferInputSerializer(serializers.Serializer):
    sender_account_id = serializers.IntegerField(required=True)
    receiver_account_number = serializers.CharField(max_length=20, required=True)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('0.01'), required=True)
    remarks = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')


class DepositWithdrawInputSerializer(serializers.Serializer):
    account_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('0.01'), required=True)
    remarks = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
