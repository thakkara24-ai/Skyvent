from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FundraiserViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'fundraisers', FundraiserViewSet, basename='fundraisers')
router.register(r'tasks', TaskViewSet, basename='tasks')

urlpatterns = [
    path('', include(router.urls)),
]
