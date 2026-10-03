from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, ExpenseViewSet, FinanceSummaryView

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'expenses', ExpenseViewSet, basename='expenses')

urlpatterns = [
    path('finance/summary/', FinanceSummaryView.as_view(), name='finance_summary'),
    path('', include(router.urls)),
]
