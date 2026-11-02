"""
accounts/serializers.py - User Serializers
==========================================
Serializers convert Django model instances to/from JSON.

This is the DRF (Django REST Framework) equivalent of Django Forms.
They handle:
1. Validation of incoming data
2. Deserialization (JSON -> Python objects for create/update)
3. Serialization (Python objects -> JSON for API responses)
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# get_user_model() returns our custom User model (accounts.User)
User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Validates and creates a new user account with hashed password.
    """

    # write_only=True: password appears in INPUT but never in OUTPUT (response)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],  # Runs Django's password validators
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_email(self, value):
        """Ensure email is unique (case-insensitive)."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        """Ensure username is unique (case-insensitive)."""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        """Cross-field validation: check passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        """
        Create user with hashed password.
        User.objects.create_user() automatically hashes the password using PBKDF2.
        NEVER store plain-text passwords!
        """
        # Remove password_confirm before saving (it's not a model field)
        validated_data.pop('password_confirm')

        # create_user() calls set_password() internally to hash the password
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing and updating user profile.
    Password is excluded - use a separate endpoint for password changes.
    """

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'location', 'linkedin_url', 'github_url',
            'resume_url', 'bio', 'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at', 'username']

    def validate_username(self, value):
        """Allow username updates but prevent duplicates."""
        user = self.context['request'].user
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extended JWT Token serializer.
    Allows login with either username OR email.
    Also adds user info to the token response.
    """

    def validate(self, attrs):
        # The default field is 'username' - check if it's an email
        username_or_email = attrs.get('username', '')

        # If it looks like an email, find the username for that email
        if '@' in username_or_email:
            try:
                user = User.objects.get(email__iexact=username_or_email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'detail': 'No account found with this email address.'
                })

        # Call parent validate() to do actual authentication and get tokens
        data = super().validate(attrs)

        # Add extra user info to the login response
        # This saves the frontend from making an extra API call
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }

        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change endpoint."""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
