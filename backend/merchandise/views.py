from rest_framework import viewsets, filters, status
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Product
from .serializers import ProductSerializer
from common.responses import success_response, error_response
from common.permissions import ReadOnlyOrMerchandiseAdmin
from common.utils import create_audit_log, broadcast_ws_event

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [ReadOnlyOrMerchandiseAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'sku', 'category']
    ordering_fields = ['price', 'stock_quantity', 'created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.all()

        if not (user.is_authenticated and (user.role in ['SUPER_ADMIN', 'MERCHANDISE'] or user.is_superuser)):
            queryset = queryset.filter(is_active=True)

        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        low_stock = self.request.query_params.get('low_stock')

        if category and category != 'ALL':
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search)
            )
        if low_stock == 'true' and user.is_authenticated and (user.role in ['SUPER_ADMIN', 'MERCHANDISE'] or user.is_superuser):
            from django.db.models import F
            queryset = queryset.filter(stock_quantity__lte=F('low_stock_threshold'))

        return queryset.order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        product = serializer.save()
        create_audit_log(self.request.user, "PRODUCT_CREATED", "Product", product.id, {"sku": product.sku, "name": product.name})
        broadcast_ws_event("inventory_updated", {"product_id": product.id, "stock": product.stock_quantity})
        return success_response(data=serializer.data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        product = serializer.save()
        create_audit_log(self.request.user, "PRODUCT_UPDATED", "Product", product.id, {"sku": product.sku, "stock": product.stock_quantity})
        broadcast_ws_event("inventory_updated", {"product_id": product.id, "stock": product.stock_quantity})
        return success_response(data=serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        product_id = instance.id
        product_name = instance.name
        sku = instance.sku

        instance.delete()

        create_audit_log(request.user, "PRODUCT_DELETED", "Product", product_id, {"sku": sku, "name": product_name})
        broadcast_ws_event("inventory_updated", {"product_id": product_id, "deleted": True})

        return success_response(message=f"Product '{product_name}' ({sku}) was successfully deleted.")
