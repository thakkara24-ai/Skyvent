from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTPVerification

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'student_id', 'department', 'is_email_verified', 'is_active', 'created_at')
    list_filter = ('role', 'is_email_verified', 'is_active', 'department')
    search_fields = ('email', 'name', 'student_id', 'department')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone', 'student_id', 'department', 'avatar')}),
        ('Role & Permissions', {'fields': ('role', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser')}),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'purpose', 'attempt_count', 'expires_at', 'used', 'created_at')
    list_filter = ('purpose', 'used', 'created_at')
    search_fields = ('email',)
    readonly_fields = ('otp_hash', 'created_at')
