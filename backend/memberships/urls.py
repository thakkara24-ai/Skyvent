from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MembershipPlanViewSet, MembershipViewSet

router = DefaultRouter()
router.register(r'membership-plans', MembershipPlanViewSet, basename='membership-plans')
router.register(r'memberships', MembershipViewSet, basename='memberships')

urlpatterns = [
    path('', include(router.urls)),
]
