from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiTypes

from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer
)


class LoginRateThrottle(AnonRateThrottle):
    """Stricter rate limit applied to the login endpoint."""
    scope = 'login'


@extend_schema(tags=['auth'])
class CustomTokenObtainPairView(TokenObtainPairView):
    """Obtain a JWT access + refresh token pair. Rate-limited to 10 requests/minute."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]


@extend_schema(tags=['auth'])
class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint."""
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    # Public endpoint: unauthenticated users must be able to create an account.
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['auth'])
class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile."""
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def get(self, request, *args, **kwargs):
        """Get user profile with full user data."""
        user = self.get_object()
        serializer = UserSerializer(user)
        return Response(serializer.data)


@extend_schema(tags=['auth'])
class PasswordChangeView(generics.GenericAPIView):
    """Change user password."""
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['auth'])
class PasswordResetRequestView(generics.GenericAPIView):
    """Request password reset."""
    serializer_class = PasswordResetRequestSerializer
    # Public endpoint: a user locked out of their account cannot supply a valid token.
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        user = User.objects.get(email=email)
        
        # Generate reset token (in production, use proper token generation)
        reset_token = get_random_string(32)
        
        # In production, save token to database with expiration
        # For now, just send email (would need proper email configuration)
        if settings.DEBUG:
            print(f"Password reset token for {email}: {reset_token}")
        
        return Response({
            'message': 'Password reset email sent'
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['auth'],
    request={'application/json': {'type': 'object', 'properties': {'refresh_token': {'type': 'string'}}, 'required': ['refresh_token']}},
    responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user by blacklisting refresh token."""
    try:
        refresh_token = request.data.get('refresh_token')
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['auth'], responses={200: OpenApiTypes.OBJECT})
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    """Get user statistics."""
    user = request.user
    
    # Get user's character and campaign counts
    active_characters = user.get_active_characters().count() if hasattr(user, 'get_active_characters') else 0
    player_campaigns = user.get_campaigns_as_player().count() if hasattr(user, 'get_campaigns_as_player') else 0
    dm_campaigns = user.get_campaigns_as_dm().count() if hasattr(user, 'get_campaigns_as_dm') else 0
    
    return Response({
        'characters_count': active_characters,
        'player_campaigns_count': player_campaigns,
        'dm_campaigns_count': dm_campaigns,
        'total_campaigns': player_campaigns + dm_campaigns,
        'is_dm': user.is_dm,
        'member_since': user.date_joined,
    })
