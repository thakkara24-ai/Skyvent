from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User, OTPVerification

class UserSerializer(serializers.ModelSerializer):
    has_active_membership = serializers.BooleanField(read_only=True)
    current_membership = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'phone', 'student_id', 'department',
            'avatar', 'role', 'is_email_verified', 'is_active',
            'created_at', 'updated_at', 'has_active_membership', 'current_membership'
        ]
        read_only_fields = ['id', 'is_email_verified', 'created_at', 'updated_at']

    def get_current_membership(self, obj):
        mem = obj.current_membership
        if mem:
            return {
                'id': mem.id,
                'plan_name': mem.plan.name,
                'start_date': mem.start_date,
                'end_date': mem.end_date,
                'status': mem.status,
                'discount_percentage': float(mem.plan.discount_percentage)
            }
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'phone', 'student_id', 'department']

    def validate_email(self, value):
        normalized = value.lower().strip()
        if User.objects.filter(email=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            phone=validated_data.get('phone', ''),
            student_id=validated_data.get('student_id', ''),
            department=validated_data.get('department', ''),
            is_email_verified=False
        )
        return user

class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=OTPVerification.PURPOSE_CHOICES, default='REGISTER')

    def validate_email(self, value):
        return value.lower().strip()

class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.ChoiceField(choices=OTPVerification.PURPOSE_CHOICES, default='REGISTER')

    def validate_email(self, value):
        return value.lower().strip()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Email and password are both required.")

        user = authenticate(username=email, password=password)
        if not user:
            # Check if user exists to provide helpful feedback without compromising security
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError("Invalid email or password.")
            raise serializers.ValidationError("No account found with this email.")

        if not user.is_active:
            raise serializers.ValidationError("This user account is inactive. Please contact administrator.")

        attrs['user'] = user
        return attrs

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'phone', 'student_id', 'department', 'avatar', 'role', 'is_active']
        extra_kwargs = {
            'role': {'required': False},
            'is_active': {'required': False}
        }

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        return value.lower().strip()
