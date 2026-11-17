from django.urls import path
from .views import (
    UserTransactionListView, TransferView, DepositView,
    WithdrawView, TransactionReceiptView, AdminTransactionListView
)

urlpatterns = [
    path('history/', UserTransactionListView.as_view(), name='transaction-history'),
    path('transfer/', TransferView.as_view(), name='transaction-transfer'),
    path('deposit/', DepositView.as_view(), name='transaction-deposit'),
    path('withdraw/', WithdrawView.as_view(), name='transaction-withdraw'),
    path('receipt/<str:transaction_id>/', TransactionReceiptView.as_view(), name='transaction-receipt'),
    path('admin/all/', AdminTransactionListView.as_view(), name='admin-transactions'),
]
