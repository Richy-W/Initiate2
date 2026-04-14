from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SkillViewSet, ConditionViewSet, DamageTypeViewSet, ClassFeatureViewSet
)
from .file_views import (
    species_list, species_detail,
    classes_list, classes_detail,
    backgrounds_list, backgrounds_detail
)

# Only register views that use database models
router = DefaultRouter()
router.register('skills', SkillViewSet, basename='skills')
router.register('conditions', ConditionViewSet, basename='conditions')
router.register('damage-types', DamageTypeViewSet, basename='damage-types')
router.register('class-features', ClassFeatureViewSet, basename='class-features')

urlpatterns = [
    # File-based content endpoints
    path('species/', species_list, name='species-list'),
    path('species/<str:species_id>/', species_detail, name='species-detail'),
    path('classes/', classes_list, name='classes-list'),
    path('classes/<str:class_id>/', classes_detail, name='classes-detail'),
    path('backgrounds/', backgrounds_list, name='backgrounds-list'),
    path('backgrounds/<str:background_id>/', backgrounds_detail, name='backgrounds-detail'),
    
    # Database-based content endpoints
    path('', include(router.urls)),
]