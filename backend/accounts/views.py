from rest_framework import status, views, viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.db.models import Q
from decimal import Decimal
from .models import User, BankAccount, Beneficiary, Notification, AuditLog
from .serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserProfileSerializer,
    BankAccountSerializer, BankAccountCreateSerializer, BeneficiarySerializer,
    NotificationSerializer, AuditLogSerializer, PasswordResetSerializer
)
from .permissions import IsAdminUserOnly


def log_admin_action(admin_user, action, target_type, target_id, details, request=None):
    ip_address = ''
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR', '')
    AuditLog.objects.create(
        admin=admin_user,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=details,
        ip_address=ip_address
    )


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "message": "User registered successfully.",
                "token": token.key,
                "user": UserProfileSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": UserProfileSerializer(user).data,
                "is_admin": user.is_bank_admin
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminLoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            if not user.is_bank_admin:
                return Response({
                    "non_field_errors": ["Access denied. Administrator privileges required."]
                }, status=status.HTTP_403_FORBIDDEN)
            token, _ = Token.objects.get_or_create(user=user)
            log_admin_action(user, "ADMIN_LOGIN", "User", user.id, "Admin logged into the portal.", request)
            return Response({
                "token": token.key,
                "user": UserProfileSerializer(user).data,
                "is_admin": True
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            current_pw = serializer.validated_data.get('current_password')
            if current_pw and not user.check_password(current_pw):
                return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            # Regenerate token so user stays logged in
            Token.objects.filter(user=user).delete()
            token = Token.objects.create(user=user)
            return Response({"message": "Password changed successfully.", "token": token.key}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordSimulationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email_or_username = request.data.get('email_or_username', '').strip()
        user = User.objects.filter(Q(email__iexact=email_or_username) | Q(username__iexact=email_or_username)).first()
        if user:
            # Simulated password reset
            new_temp_pass = "Bank@1234"
            user.set_password(new_temp_pass)
            user.save()
            Notification.objects.create(
                user=user,
                title="Password Reset Request",
                message=f"Your temporary password has been reset to: {new_temp_pass}. Please change it after login.",
                notification_type='SECURITY'
            )
            return Response({
                "message": f"Password reset instructions and a temporary password ({new_temp_pass}) have been generated for {user.username}.",
                "temp_password": new_temp_pass
            }, status=status.HTTP_200_OK)
        return Response({"error": "No user found with the given username or email address."}, status=status.HTTP_404_NOT_FOUND)


class BankAccountViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BankAccountCreateSerializer
        return BankAccountSerializer

    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save()


class VerifyAccountView(views.APIView):
    """Verifies that an account number exists and returns holder details for confirmation modal"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        raw_account = request.query_params.get('account_number', '')
        # Remove spaces, dashes, or formatting characters
        account_number = ''.join(c for c in raw_account if c.isalnum()).strip()
        if not account_number:
            return Response({"error": "account_number parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            account = BankAccount.objects.select_related('user').get(account_number=account_number)
            return Response({
                "exists": True,
                "account_number": account.account_number,
                "account_holder": account.user.get_full_name() or account.user.username,
                "account_type": account.get_account_type_display(),
                "ifsc_code": account.ifsc_code,
                "is_active": account.is_active
            })
        except BankAccount.DoesNotExist:
            return Response({
                "exists": False,
                "error": "No active account found with this account number."
            }, status=status.HTTP_404_NOT_FOUND)


class BeneficiaryViewSet(viewsets.ModelViewSet):
    serializer_class = BeneficiarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Beneficiary.objects.filter(user=self.request.user)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Fetch notifications specific to user or global system announcements (user is null)
        return Notification.objects.filter(Q(user=self.request.user) | Q(user__isnull=True)).order_by('-created_at')

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = request.data.get('is_read', True)
        notification.save()
        return Response(NotificationSerializer(notification).data)


class MarkAllNotificationsReadView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."})


# --- Admin View Endpoints ---

class AdminUserListView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        search_query = request.query_params.get('search', '').strip()
        role_filter = request.query_params.get('role', '').strip()
        status_filter = request.query_params.get('is_active')

        users = User.objects.all().order_by('-date_joined')
        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(phone_number__icontains=search_query)
            )
        if role_filter:
            users = users.filter(role=role_filter)
        if status_filter is not None:
            users = users.filter(is_active=status_filter.lower() in ('true', '1'))

        data = []
        for u in users:
            accounts = u.bank_accounts.all()
            total_bal = sum(a.balance for a in accounts if a.is_active)
            data.append({
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "name": u.get_full_name() or u.username,
                "phone_number": u.phone_number,
                "role": u.role,
                "is_active": u.is_active,
                "date_joined": u.date_joined,
                "accounts_count": accounts.count(),
                "total_balance": f"{total_bal:.2f}",
                "accounts": BankAccountSerializer(accounts, many=True).data
            })
        return Response(data)


class AdminUserStatusToggleView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({"error": "You cannot change your own activation status."}, status=status.HTTP_400_BAD_REQUEST)

        new_status = not target_user.is_active
        target_user.is_active = new_status
        target_user.save()

        # Also cascade to bank accounts if deactivated
        if not new_status:
            target_user.bank_accounts.update(is_active=False)

        action = "USER_ACTIVATED" if new_status else "USER_DEACTIVATED"
        log_admin_action(
            request.user,
            action,
            "User",
            target_user.id,
            f"User '{target_user.username}' was {'activated' if new_status else 'deactivated'} by admin.",
            request
        )

        return Response({
            "message": f"User status updated to {'Active' if new_status else 'Inactive'}.",
            "is_active": new_status
        })


class AdminBankAccountListView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        search_query = request.query_params.get('search', '').strip()
        type_filter = request.query_params.get('account_type', '').strip()
        status_filter = request.query_params.get('is_active')

        accounts = BankAccount.objects.select_related('user').all().order_by('-created_at')
        if search_query:
            accounts = accounts.filter(
                Q(account_number__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query)
            )
        if type_filter:
            accounts = accounts.filter(account_type=type_filter)
        if status_filter is not None:
            accounts = accounts.filter(is_active=status_filter.lower() in ('true', '1'))

        return Response(BankAccountSerializer(accounts, many=True).data)


class AdminAccountStatusToggleView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def post(self, request, account_id):
        try:
            account = BankAccount.objects.get(id=account_id)
        except BankAccount.DoesNotExist:
            return Response({"error": "Bank account not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = not account.is_active
        account.is_active = new_status
        account.save()

        action = "ACCOUNT_ACTIVATED" if new_status else "ACCOUNT_DEACTIVATED"
        log_admin_action(
            request.user,
            action,
            "BankAccount",
            account.account_number,
            f"Account '{account.account_number}' ({account.user.username}) status set to {'Active' if new_status else 'Inactive'}.",
            request
        )

        Notification.objects.create(
            user=account.user,
            title=f"Bank Account Status Update",
            message=f"Your account #{account.account_number} status has been updated to {'Active' if new_status else 'Deactivated/Frozen'}.",
            notification_type='ACCOUNT'
        )

        return Response({
            "message": f"Account status updated to {'Active' if new_status else 'Inactive'}.",
            "is_active": new_status
        })


class AdminAuditLogListView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def get(self, request):
        logs = AuditLog.objects.select_related('admin').all().order_by('-timestamp')[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


class AdminBroadcastNotificationView(views.APIView):
    permission_classes = [IsAdminUserOnly]

    def post(self, request):
        title = request.data.get('title', '').strip()
        message = request.data.get('message', '').strip()
        notification_type = request.data.get('notification_type', 'ANNOUNCEMENT')

        if not title or not message:
            return Response({"error": "Title and message are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Create global announcement (user=None)
        notif = Notification.objects.create(
            user=None,
            title=title,
            message=message,
            notification_type=notification_type
        )

        log_admin_action(
            request.user,
            "BROADCAST_ANNOUNCEMENT",
            "Notification",
            notif.id,
            f"Broadcast notification published: '{title}'",
            request
        )

        return Response({
            "message": "Broadcast notification created successfully.",
            "notification": NotificationSerializer(notif).data
        }, status=status.HTTP_201_CREATED)
