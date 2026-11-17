from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.db.models import Q
from accounts.models import BankAccount
from accounts.permissions import IsAdminUserOnly
from .models import Transaction
from .serializers import TransactionSerializer, TransferInputSerializer, DepositWithdrawInputSerializer
from .services import transfer_money, deposit_money, withdraw_money
from .receipts import generate_receipt_pdf


class UserTransactionListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_account_ids = BankAccount.objects.filter(user=user).values_list('id', flat=True)

        qs = Transaction.objects.filter(
            Q(sender_account_id__in=user_account_ids) | Q(receiver_account_id__in=user_account_ids)
        ).select_related('sender_account__user', 'receiver_account__user').order_by('-created_at')

        # Filters
        search = request.query_params.get('search', '').strip()
        txn_type = request.query_params.get('type', '').strip()
        account_id = request.query_params.get('account_id')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        if search:
            qs = qs.filter(
                Q(transaction_id__icontains=search) |
                Q(remarks__icontains=search) |
                Q(sender_account__account_number__icontains=search) |
                Q(receiver_account__account_number__icontains=search)
            )

        if txn_type:
            qs = qs.filter(transaction_type=txn_type)

        if account_id:
            qs = qs.filter(Q(sender_account_id=account_id) | Q(receiver_account_id=account_id))

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        serializer = TransactionSerializer(qs[:100], many=True, context={'request': request})
        return Response(serializer.data)


class TransferView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TransferInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        txn = transfer_money(
            user=request.user,
            sender_account_id=serializer.validated_data['sender_account_id'],
            receiver_account_number=serializer.validated_data['receiver_account_number'],
            amount=serializer.validated_data['amount'],
            remarks=serializer.validated_data.get('remarks', '')
        )

        return Response({
            "message": "Money transferred successfully.",
            "transaction": TransactionSerializer(txn, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class DepositView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DepositWithdrawInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        txn = deposit_money(
            user=request.user,
            account_id=serializer.validated_data['account_id'],
            amount=serializer.validated_data['amount'],
            remarks=serializer.validated_data.get('remarks', '')
        )

        return Response({
            "message": "Deposit completed successfully.",
            "transaction": TransactionSerializer(txn, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class WithdrawView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DepositWithdrawInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        txn = withdraw_money(
            user=request.user,
            account_id=serializer.validated_data['account_id'],
            amount=serializer.validated_data['amount'],
            remarks=serializer.validated_data.get('remarks', '')
        )

        return Response({
            "message": "Withdrawal completed successfully.",
            "transaction": TransactionSerializer(txn, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)


class TransactionReceiptView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            txn = Transaction.objects.select_related(
                'sender_account__user', 'receiver_account__user'
            ).get(transaction_id=transaction_id)
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions: User must be sender or receiver, or an Admin
        user = request.user
        is_sender = txn.sender_account and txn.sender_account.user == user
        is_receiver = txn.receiver_account and txn.receiver_account.user == user
        if not (is_sender or is_receiver or user.is_bank_admin):
            return Response({"error": "Access denied to this transaction receipt."}, status=status.HTTP_403_FORBIDDEN)

        return generate_receipt_pdf(txn)


class AdminTransactionListView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        qs = Transaction.objects.select_related(
            'sender_account__user', 'receiver_account__user'
        ).all().order_by('-created_at')

        search = request.query_params.get('search', '').strip()
        txn_type = request.query_params.get('type', '').strip()
        txn_status = request.query_params.get('status', '').strip()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        min_amount = request.query_params.get('min_amount')
        max_amount = request.query_params.get('max_amount')

        if search:
            qs = qs.filter(
                Q(transaction_id__icontains=search) |
                Q(sender_account__account_number__icontains=search) |
                Q(receiver_account__account_number__icontains=search) |
                Q(sender_account__user__username__icontains=search) |
                Q(receiver_account__user__username__icontains=search) |
                Q(remarks__icontains=search)
            )

        if txn_type:
            qs = qs.filter(transaction_type=txn_type)
        if txn_status:
            qs = qs.filter(status=txn_status)
        if min_amount:
            qs = qs.filter(amount__gte=min_amount)
        if max_amount:
            qs = qs.filter(amount__lte=max_amount)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        serializer = TransactionSerializer(qs[:150], many=True, context={'request': request})
        return Response(serializer.data)
