from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InitiativeTrackerViewSet

router = DefaultRouter()
router.register('combat/trackers', InitiativeTrackerViewSet, basename='initiative-trackers')

urlpatterns = [
    path('', include(router.urls)),
]
