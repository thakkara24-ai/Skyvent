from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from decimal import Decimal
import uuid

from .models import Order, OrderItem
from .serializers import OrderSerializer, CreateOrderSerializer
from merchandise.models import Product
from finance.models import Payment, Transaction
from notifications.models import Notification
from accounts.models import User
from common.responses import success_response, error_response
from common.utils import create_audit_log, broadcast_ws_event

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'MERCHANDISE'] or user.is_superuser:
            queryset = Order.objects.all().select_related('user', 'payment').prefetch_related('items__product').order_by('-created_at')
            status_param = self.request.query_params.get('status')
            user_id = self.request.query_params.get('user_id')
            search = self.request.query_params.get('search')
            if status_param:
                queryset = queryset.filter(status=status_param)
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            if search:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(order_number__icontains=search) |
                    Q(user__name__icontains=search) |
                    Q(user__email__icontains=search)
                )
            return queryset
        return Order.objects.filter(user=user).select_related('user', 'payment').prefetch_related('items__product').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        user = request.user
        items_data = serializer.validated_data['items']
        delivery_notes = serializer.validated_data.get('delivery_notes', '')

        with transaction.atomic():
            subtotal = Decimal('0.00')
            order_items_to_create = []
            products_to_update = []
            low_stock_alerts = []

            for item in items_data:
                product_id = item['product_id']
                qty = item['quantity']
                size = item.get('size', '')

                try:
                    product = Product.objects.select_for_update().get(id=product_id, is_active=True)
                except Product.DoesNotExist:
                    return error_response(message=f"Product with ID {product_id} is not available.", code="PRODUCT_NOT_FOUND")

                if product.stock_quantity < qty:
                    return error_response(
                        message=f"Insufficient inventory for '{product.name}'. Only {product.stock_quantity} unit(s) available.",
                        code="INSUFFICIENT_STOCK"
                    )

                item_subtotal = product.price * Decimal(qty)
                subtotal += item_subtotal

                # Decrement stock
                product.stock_quantity -= qty
                products_to_update.append(product)

                if product.stock_quantity <= product.low_stock_threshold:
                    low_stock_alerts.append(product)

                order_items_to_create.append({
                    'product': product,
                    'product_name_snapshot': product.name,
                    'size': size,
                    'quantity': qty,
                    'unit_price': product.price,
                    'subtotal': item_subtotal
                })

            # Calculate member discount if user has active membership (e.g. 10% discount on merchandise)
            discount = Decimal('0.00')
            if user.has_active_membership:
                discount = (subtotal * Decimal('0.10')).quantize(Decimal('0.01'))

            total = max(Decimal('0.00'), subtotal - discount)

            # Persist product inventory updates
            for prod in products_to_update:
                prod.save(update_fields=['stock_quantity', 'updated_at'])
                broadcast_ws_event("inventory_updated", {
                    "product_id": prod.id,
                    "product_name": prod.name,
                    "stock_quantity": prod.stock_quantity
                })

            # Create Payment Record
            payment = Payment.objects.create(
                user=user,
                amount=total,
                currency="INR",
                provider="Campus UPI Gateway",
                reference=f"PAY-ORD-{uuid.uuid4().hex[:8].upper()}",
                status="SUCCESS"
            )

            # Create Order
            order = Order.objects.create(
                order_number=Order.generate_order_number(),
                user=user,
                subtotal=subtotal,
                discount=discount,
                total=total,
                payment=payment,
                status='COMPLETED',
                delivery_notes=delivery_notes
            )

            # Create Order Items
            for item_info in order_items_to_create:
                OrderItem.objects.create(
                    order=order,
                    product=item_info['product'],
                    product_name_snapshot=item_info['product_name_snapshot'],
                    size=item_info['size'],
                    quantity=item_info['quantity'],
                    unit_price=item_info['unit_price'],
                    subtotal=item_info['subtotal']
                )

            # Record Financial Income Transaction
            Transaction.objects.create(
                transaction_type='INCOME',
                category='MERCHANDISE',
                amount=total,
                description=f"Merchandise Order #{order.order_number} by {user.name}",
                reference_type='MERCHANDISE_ORDER',
                reference_id=str(order.id),
                created_by=user
            )

            # In-app notification for buyer
            Notification.objects.create(
                user=user,
                title="Order Placed Successfully!",
                message=f"Order #{order.order_number} for ₹{total} has been confirmed.",
                notification_type='ORDER'
            )

            # Low stock notifications for staff
            for low_prod in low_stock_alerts:
                staff_users = User.objects.filter(role__in=['SUPER_ADMIN', 'MERCHANDISE'])
                for staff in staff_users:
                    Notification.objects.create(
                        user=staff,
                        title="Low Stock Alert",
                        message=f"Product '{low_prod.name}' has only {low_prod.stock_quantity} unit(s) left in stock.",
                        notification_type='SYSTEM'
                    )

            # Confirmation email
            items_summary = "\n".join([
                f"- {item['product_name_snapshot']} ({item['size'] or 'Standard'}): {item['quantity']}x @ ₹{item['unit_price']} = ₹{item['subtotal']}"
                for item in order_items_to_create
            ])

            try:
                send_mail(
                    subject=f"SKYVENT Order Confirmation - #{order.order_number}",
                    message=(
                        f"Hello {user.name},\n\n"
                        f"Thank you for your order!\n\n"
                        f"Order Number: {order.order_number}\n"
                        f"Order Date: {order.created_at.strftime('%B %d, %Y')}\n\n"
                        f"Items:\n{items_summary}\n\n"
                        f"Subtotal: ₹{subtotal}\n"
                        f"Discount: ₹{discount}\n"
                        f"Total Paid: ₹{total}\n"
                        f"Payment Reference: {payment.reference}\n\n"
                        f"Pickup instructions: Visit the Student Union merchandise desk with your order number.\n\n"
                        f"SKYVENT Platform Team"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False
                )
            except Exception as e:
                pass

            create_audit_log(user, "ORDER_CREATED", "Order", order.id, {
                "order_number": order.order_number,
                "total": str(total),
                "items_count": len(order_items_to_create)
            })

            # Broadcast Realtime events
            broadcast_ws_event("order_created", {
                "order_id": order.id,
                "order_number": order.order_number,
                "user_name": user.name,
                "total": str(total)
            })
            broadcast_ws_event("finance_updated", {
                "amount": str(total),
                "type": "MERCHANDISE"
            })

            return success_response(
                data=OrderSerializer(order).data,
                message="Order placed successfully!",
                status_code=status.HTTP_201_CREATED
            )
