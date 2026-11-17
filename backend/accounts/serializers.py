from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from decimal import Decimal
from .models import User, BankAccount, Beneficiary, Notification, AuditLog


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    initial_account_type = serializers.ChoiceField(
        choices=BankAccount.ACCOUNT_TYPE_CHOICES,
        default='SAVINGS',
        write_only=True,
        required=False
    )
    initial_deposit = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('1000.00'),
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'address', 'date_of_birth', 'id_proof_number',
            'password', 'confirm_password', 'initial_account_type', 'initial_deposit'
        ]

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        initial_account_type = validated_data.pop('initial_account_type', 'SAVINGS')
        initial_deposit = validated_data.pop('initial_deposit', Decimal('1000.00'))

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            date_of_birth=validated_data.get('date_of_birth'),
            id_proof_number=validated_data.get('id_proof_number', ''),
            password=validated_data['password'],
            role='CUSTOMER'
        )

        # Automatically create initial bank account with simulated initial balance
        account = BankAccount.objects.create(
            user=user,
            account_type=initial_account_type,
            balance=initial_deposit if initial_deposit and initial_deposit > 0 else Decimal('1000.00')
        )

        Notification.objects.create(
            user=user,
            title="Welcome to Online Banking",
            message=f"Welcome {user.first_name or user.username}! Your {account.get_account_type_display()} (#{account.account_number}) is active with an initial balance of ${account.balance}.",
            notification_type='ACCOUNT'
        )

        return user


class UserLoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username_or_email = data.get('username_or_email', '').strip()
        password = data.get('password')

        # Allow login by either username or email
        user = None
        if '@' in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        else:
            user = authenticate(username=username_or_email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials provided.")
        if not user.is_active:
            raise serializers.ValidationError("This user account has been deactivated. Please contact support.")

        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    total_balance = serializers.SerializerMethodField()
    accounts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'address', 'date_of_birth', 'id_proof_number',
            'role', 'is_active', 'date_joined', 'last_login',
            'total_balance', 'accounts_count'
        ]
        read_only_fields = ['id', 'username', 'role', 'is_active', 'date_joined', 'last_login']

    def get_total_balance(self, obj):
        total = sum(acc.balance for acc in obj.bank_accounts.filter(is_active=True))
        return f"{total:.2f}"

    def get_accounts_count(self, obj):
        return obj.bank_accounts.count()


class BankAccountSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            'id', 'account_number', 'account_type', 'account_type_display',
            'balance', 'ifsc_code', 'currency', 'is_active',
            'created_at', 'updated_at', 'user', 'user_name', 'user_email'
        ]
        read_only_fields = ['id', 'account_number', 'created_at', 'updated_at', 'user']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class BankAccountCreateSerializer(serializers.ModelSerializer):
    initial_deposit = serializers.DecimalField(
        max_digits=15, decimal_places=2, required=False, default=Decimal('500.00'), min_value=Decimal('0.00')
    )

    class Meta:
        model = BankAccount
        fields = ['account_type', 'initial_deposit']

    def create(self, validated_data):
        initial_deposit = validated_data.pop('initial_deposit', Decimal('500.00'))
        request = self.context.get('request')
        account = BankAccount.objects.create(
            user=request.user,
            balance=initial_deposit,
            **validated_data
        )

        Notification.objects.create(
            user=request.user,
            title="New Account Opened",
            message=f"Your new {account.get_account_type_display()} (#{account.account_number}) has been created with a deposit of ${account.balance}.",
            notification_type='ACCOUNT'
        )
        return account


class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        fields = ['id', 'account_number', 'beneficiary_name', 'bank_name', 'ifsc_code', 'nickname', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_account_number(self, value):
        # Verify that account exists in the bank
        clean_value = ''.join(c for c in str(value) if c.isalnum()).strip()
        if not BankAccount.objects.filter(account_number=clean_value, is_active=True).exists():
            raise serializers.ValidationError("No active bank account found with this account number.")
        return clean_value

    def create(self, validated_data):
        request = self.context.get('request')
        return Beneficiary.objects.create(user=request.user, **validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'admin', 'admin_name', 'action', 'target_type', 'target_id', 'details', 'ip_address', 'timestamp']

    def get_admin_name(self, obj):
        return obj.admin.get_full_name() or obj.admin.username if obj.admin else "System"


class PasswordResetSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('confirm_new_password'):
            raise serializers.ValidationError({"confirm_new_password": "New passwords do not match."})
        return attrs
