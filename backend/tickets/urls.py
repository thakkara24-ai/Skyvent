from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, EventTicketPurchaseView

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='tickets')

urlpatterns = [
    path('events/<int:event_id>/tickets/', EventTicketPurchaseView.as_view(), name='event_ticket_purchase'),
    path('', include(router.urls)),
]
