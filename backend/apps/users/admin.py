from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for custom User model."""
    
    list_display = ('email', 'username', 'first_name', 'last_name', 'is_dm', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'is_dm', 'email_notifications', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'avatar', 'bio', 'location')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_dm', 'groups', 'user_permissions'),
        }),
        (_('Settings'), {'fields': ('email_notifications',)}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Technical'), {'fields': ('last_login_ip',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login', 'last_login_ip')
