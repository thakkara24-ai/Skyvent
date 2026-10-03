from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    SendOTPView,
    VerifyOTPView,
    LoginView,
    LogoutView,
    CurrentUserView,
    ResetPasswordView,
    UserManagementViewSet
)

router = DefaultRouter()
router.register(r'users', UserManagementViewSet, basename='users')

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/send-otp/', SendOTPView.as_view(), name='auth_send_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='auth_verify_otp'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),

    # Users CRUD
    path('', include(router.urls)),
]
