from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    
    # User profile
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/stats/', views.user_stats_view, name='user_stats'),
    
    # Password management
    path('auth/password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('auth/password/reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
]