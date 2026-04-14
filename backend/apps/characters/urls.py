from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CharacterViewSet, CharacterSpellViewSet

router = DefaultRouter()
router.register('characters', CharacterViewSet, basename='characters')
router.register('character-spells', CharacterSpellViewSet, basename='character-spells')

urlpatterns = [
    path('', include(router.urls)),
]