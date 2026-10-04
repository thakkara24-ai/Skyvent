from rest_framework import views, status, generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

from .models import User, OTPVerification
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    LoginSerializer,
    UserUpdateSerializer,
    ResetPasswordSerializer
)
from common.responses import success_response, error_response
from common.utils import create_audit_log
from common.permissions import IsSuperAdmin, IsPresidentOrAdmin

logger = logging.getLogger(__name__)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message=list(serializer.errors.values())[0][0] if serializer.errors else "Invalid data provided.",
                errors=serializer.errors
            )

        user = serializer.save()

        # Generate & Send Email OTP
        otp_raw = OTPVerification.generate_otp(user.email, purpose='REGISTER')
        
        otp_html = f"""<h2>SKYVENT Login OTP</h2>

<p>Your one-time login code is:</p>

<h1>{otp_raw}</h1>

<p>This code is valid for a limited time.</p>

<p>If you did not request this code, you can ignore this email.</p>"""

        otp_text = f"""SKYVENT Login OTP\n\nYour one-time login code is: {otp_raw}\n\nThis code is valid for a limited time.\n\nIf you did not request this code, you can ignore this email."""

        try:
            send_mail(
                subject="SKYVENT - Verify Your Account",
                message=otp_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=otp_html,
                fail_silently=False
            )
        except Exception as e:
            logger.error(f"Failed to send registration OTP email: {e}")

        create_audit_log(user, "USER_REGISTERED", "User", user.id, {"email": user.email})

        return success_response(
            data={"email": user.email, "name": user.name},
            message="Registration successful. A 6-digit verification code has been sent to your email.",
            status_code=status.HTTP_201_CREATED
        )


class SendOTPView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message=list(serializer.errors.values())[0][0] if serializer.errors else "Invalid input.",
                errors=serializer.errors
            )

        email = serializer.validated_data['email']
        purpose = serializer.validated_data.get('purpose', 'REGISTER')

        # Check 60-second cooldown
        latest_otp = OTPVerification.objects.filter(
            email=email,
            purpose=purpose
        ).order_by('-created_at').first()

        if latest_otp and (timezone.now() - latest_otp.created_at) < timedelta(seconds=60):
            seconds_left = 60 - int((timezone.now() - latest_otp.created_at).total_seconds())
            return error_response(
                message=f"Please wait {seconds_left} second(s) before requesting another code.",
                code="COOLDOWN_ACTIVE"
            )

        otp_raw = OTPVerification.generate_otp(email, purpose=purpose)

        subject_map = {
            'REGISTER': "SKYVENT - Email Verification Code",
            'VERIFY_EMAIL': "SKYVENT - Verify Your Email",
            'FORGOT_PASSWORD': "SKYVENT - Password Reset Code",
        }
        subject = subject_map.get(purpose, "SKYVENT Login OTP")

        otp_html = f"""<h2>SKYVENT Login OTP</h2>

<p>Your one-time login code is:</p>

<h1>{otp_raw}</h1>

<p>This code is valid for a limited time.</p>

<p>If you did not request this code, you can ignore this email.</p>"""

        otp_text = f"""SKYVENT Login OTP\n\nYour one-time login code is: {otp_raw}\n\nThis code is valid for a limited time.\n\nIf you did not request this code, you can ignore this email."""

        try:
            send_mail(
                subject=subject,
                message=otp_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=otp_html,
                fail_silently=False
            )
        except Exception as e:
            logger.error(f"Failed to dispatch OTP email: {e}")

        return success_response(
            data={"email": email, "purpose": purpose},
            message="Verification code sent to your email."
        )



class VerifyOTPView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message=list(serializer.errors.values())[0][0] if serializer.errors else "Invalid verification payload.",
                errors=serializer.errors
            )

        email = serializer.validated_data['email']
        raw_otp = serializer.validated_data['otp']
        purpose = serializer.validated_data['purpose']

        otp_record = OTPVerification.objects.filter(
            email=email,
            purpose=purpose,
            used=False
        ).order_by('-created_at').first()

        if not otp_record:
            return error_response(
                message="No active verification code found for this email. Please request a new code.",
                code="OTP_NOT_FOUND"
            )

        is_valid, msg = otp_record.verify(raw_otp)
        if not is_valid:
            return error_response(message=msg, code="OTP_INVALID")

        # Mark user as verified if registering or verifying email
        user = User.objects.filter(email=email).first()
        tokens = None
        if user:
            if purpose in ['REGISTER', 'VERIFY_EMAIL']:
                user.is_email_verified = True
                user.save(update_fields=['is_email_verified'])
            tokens = get_tokens_for_user(user)
            create_audit_log(user, "OTP_VERIFIED", "User", user.id, {"purpose": purpose})

        return success_response(
            data={
                "verified": True,
                "email": email,
                "tokens": tokens,
                "user": UserSerializer(user).data if user else None
            },
            message="Email verification successful."
        )


class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message=list(serializer.errors.values())[0][0] if serializer.errors else "Invalid login credentials.",
                errors=serializer.errors
            )

        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        create_audit_log(user, "USER_LOGIN", "User", user.id)

        return success_response(
            data={
                "user": UserSerializer(user).data,
                "tokens": tokens
            },
            message=f"Welcome, {user.name}!"
        )


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        create_audit_log(request.user, "USER_LOGOUT", "User", request.user.id)
        return success_response(message="Logged out successfully.")


class CurrentUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return success_response(data=serializer.data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(
                message=list(serializer.errors.values())[0][0] if serializer.errors else "Update failed.",
                errors=serializer.errors
            )
        # Normal users cannot change their own role or active status
        if not (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser):
            serializer.validated_data.pop('role', None)
            serializer.validated_data.pop('is_active', None)

        user = serializer.save()
        create_audit_log(user, "PROFILE_UPDATED", "User", user.id)
        return success_response(data=UserSerializer(user).data, message="Profile updated successfully.")


class ResetPasswordView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message=list(serializer.errors.values())[0][0] if serializer.errors else "Invalid data.",
                errors=serializer.errors
            )

        email = serializer.validated_data['email']
        raw_otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        user = User.objects.filter(email=email).first()
        if not user:
            return error_response(message="No user account found with this email.", code="USER_NOT_FOUND")

        otp_record = OTPVerification.objects.filter(
            email=email,
            purpose='FORGOT_PASSWORD',
            used=False
        ).order_by('-created_at').first()

        if not otp_record:
            return error_response(message="No active password reset request found. Request a new code.", code="OTP_NOT_FOUND")

        is_valid, msg = otp_record.verify(raw_otp)
        if not is_valid:
            return error_response(message=msg, code="OTP_INVALID")

        user.set_password(new_password)
        user.save()
        create_audit_log(user, "PASSWORD_RESET", "User", user.id)

        return success_response(message="Password reset successfully. You can now login with your new password.")


class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsSuperAdmin()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        role_filter = request.query_params.get('role')
        search = request.query_params.get('search')

        if role_filter:
            queryset = queryset.filter(role=role_filter)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(student_id__icontains=search) |
                Q(department__icontains=search)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()

        # Super admin protection
        if user.role == 'SUPER_ADMIN' and request.data.get('role') and request.data.get('role') != 'SUPER_ADMIN':
            return error_response(
                message="Super Admin role is permanent and cannot be demoted.",
                code="SUPER_ADMIN_PROTECTED",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if request.data.get('role') == 'SUPER_ADMIN' and user.role != 'SUPER_ADMIN':
            return error_response(
                message="Super Admin role cannot be assigned. Only one Super Admin account is permitted.",
                code="CANNOT_ASSIGN_SUPER_ADMIN",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        old_role = user.role
        updated_user = serializer.save()
        if 'role' in request.data and old_role != updated_user.role:
            create_audit_log(
                request.user,
                "USER_ROLE_CHANGED",
                "User",
                updated_user.id,
                {"old_role": old_role, "new_role": updated_user.role}
            )

        return success_response(
            data=UserSerializer(updated_user).data,
            message="User updated successfully."
        )

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        # Protection checks
        if user.role == 'SUPER_ADMIN' or user.is_superuser:
            return error_response(
                message="Super Admin accounts are permanent and cannot be deleted.",
                code="CANNOT_DELETE_SUPER_ADMIN",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if user.id == request.user.id:
            return error_response(
                message="You cannot delete your own account from the member directory.",
                code="CANNOT_DELETE_SELF",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        deleted_name = user.name
        deleted_email = user.email
        deleted_id = user.id

        user.delete()

        create_audit_log(
            request.user,
            "USER_DELETED",
            "User",
            deleted_id,
            {"name": deleted_name, "email": deleted_email}
        )

        return success_response(message=f"Member '{deleted_name}' ({deleted_email}) was successfully deleted.")
