from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser)
        )

class IsPresidentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['SUPER_ADMIN', 'PRESIDENT'] or request.user.is_superuser)
        )

class IsTreasurerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['SUPER_ADMIN', 'PRESIDENT', 'TREASURER'] or request.user.is_superuser)
        )

class IsVolunteerOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'] or request.user.is_superuser)
        )

class IsStaffUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'] or request.user.is_staff or request.user.is_superuser)
        )

class ReadOnlyOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['SUPER_ADMIN', 'PRESIDENT'] or request.user.is_superuser)
        )

class ReadOnlyOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in ['SUPER_ADMIN', 'PRESIDENT'] or request.user.is_superuser)
        )
