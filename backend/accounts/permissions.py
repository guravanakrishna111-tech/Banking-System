from rest_framework import permissions


class IsAdminUserOnly(permissions.BasePermission):
    """Allows access only to Bank Administrators or Superusers."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )


class IsCustomerOrAdmin(permissions.BasePermission):
    """Allows access to authenticated customers or admins."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
