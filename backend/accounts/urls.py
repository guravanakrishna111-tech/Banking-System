from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, AdminLoginView, LogoutView, ProfileView,
    ChangePasswordView, ForgotPasswordSimulationView, BankAccountViewSet,
    VerifyAccountView, BeneficiaryViewSet, NotificationViewSet,
    MarkAllNotificationsReadView, AdminUserListView, AdminUserStatusToggleView,
    AdminBankAccountListView, AdminAccountStatusToggleView,
    AdminAuditLogListView, AdminBroadcastNotificationView
)

router = DefaultRouter()
router.register(r'my-accounts', BankAccountViewSet, basename='my-accounts')
router.register(r'beneficiaries', BeneficiaryViewSet, basename='beneficiaries')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('auth/forgot-password/', ForgotPasswordSimulationView.as_view(), name='forgot-password'),

    # Account verification & notification actions
    path('verify/', VerifyAccountView.as_view(), name='verify-account'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark-all-notifications-read'),

    # Admin Management
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:user_id>/toggle-status/', AdminUserStatusToggleView.as_view(), name='admin-toggle-user'),
    path('admin/accounts/', AdminBankAccountListView.as_view(), name='admin-accounts'),
    path('admin/accounts/<int:account_id>/toggle-status/', AdminAccountStatusToggleView.as_view(), name='admin-toggle-account'),
    path('admin/audit-logs/', AdminAuditLogListView.as_view(), name='admin-audit-logs'),
    path('admin/broadcast/', AdminBroadcastNotificationView.as_view(), name='admin-broadcast'),

    # ViewSets
    path('', include(router.urls)),
]
