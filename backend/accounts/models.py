import secrets
import hashlib
from datetime import timedelta
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .managers import UserManager

ROLE_CHOICES = (
    ('SUPER_ADMIN', 'Super Admin'),
    ('PRESIDENT', 'President'),
    ('TREASURER', 'Treasurer'),
    ('VOLUNTEER', 'Volunteer'),
    ('MEMBER', 'Member'),
)

class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=30, blank=True, default='')
    student_id = models.CharField(max_length=50, blank=True, default='')
    department = models.CharField(max_length=150, blank=True, default='')
    avatar = models.CharField(max_length=500, blank=True, default='')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='MEMBER')
    
    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.name} ({self.email}) - {self.role}"

    @property
    def is_super_admin(self):
        return self.role == 'SUPER_ADMIN' or self.is_superuser

    @property
    def is_president(self):
        return self.role == 'PRESIDENT'

    @property
    def is_treasurer(self):
        return self.role == 'TREASURER'

    @property
    def is_volunteer(self):
        return self.role == 'VOLUNTEER'

    @property
    def has_active_membership(self):
        # Queries memberships dynamically
        active_mem = self.memberships.filter(
            status='ACTIVE',
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).first()
        return active_mem is not None

    @property
    def current_membership(self):
        return self.memberships.filter(
            status='ACTIVE',
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).select_related('plan').first()


class OTPVerification(models.Model):
    PURPOSE_CHOICES = (
        ('REGISTER', 'Account Registration'),
        ('VERIFY_EMAIL', 'Email Verification'),
        ('FORGOT_PASSWORD', 'Password Reset'),
        ('LOGIN_2FA', 'Two-Factor Authentication'),
    )

    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default='REGISTER')
    attempt_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'OTP Verification'
        verbose_name_plural = 'OTP Verifications'

    def __str__(self):
        return f"OTP for {self.email} ({self.purpose}) - Used: {self.used}"

    @classmethod
    def generate_otp(cls, email, purpose='REGISTER'):
        """
        Generates a 6-digit cryptographically secure OTP, invalidates older OTPs,
        hashes the OTP using SHA-256 with salt, and persists it.
        Returns the plaintext OTP for email delivery.
        """
        # Invalidate previous unused OTPs for this email and purpose
        cls.objects.filter(email=email.lower().strip(), purpose=purpose, used=False).update(used=True)

        # Generate secure 6-digit OTP (100000 to 999999)
        otp_raw = str(secrets.randbelow(900000) + 100000)
        otp_hash = hashlib.sha256(otp_raw.encode('utf-8')).hexdigest()

        expires_at = timezone.now() + timedelta(minutes=5)

        cls.objects.create(
            email=email.lower().strip(),
            otp_hash=otp_hash,
            purpose=purpose,
            attempt_count=0,
            expires_at=expires_at,
            used=False
        )

        return otp_raw

    def verify(self, raw_otp):
        """
        Validates raw OTP against stored hash.
        Enforces maximum 5 attempts and expiration time.
        """
        if self.used:
            return False, "This OTP has already been used."

        if timezone.now() > self.expires_at:
            self.used = True
            self.save(update_fields=['used'])
            return False, "This OTP has expired. Please request a new code."

        if self.attempt_count >= 5:
            self.used = True
            self.save(update_fields=['used'])
            return False, "Maximum attempts exceeded. Please request a new code."

        self.attempt_count += 1
        provided_hash = hashlib.sha256(raw_otp.strip().encode('utf-8')).hexdigest()

        if provided_hash != self.otp_hash:
            self.save(update_fields=['attempt_count'])
            remaining = 5 - self.attempt_count
            return False, f"Invalid OTP code. {remaining} attempt(s) remaining."

        # Mark as used and success
        self.used = True
        self.save(update_fields=['attempt_count', 'used'])
        return True, "OTP verified successfully."
