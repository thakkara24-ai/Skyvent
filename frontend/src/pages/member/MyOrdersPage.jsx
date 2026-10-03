import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/api';
import { ShoppingBag, Package, Clock, CheckCircle2, MapPin } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getOrders();
      if (res.data) setOrders(res.data);
    } catch (err) {
      toast.error('Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          My Merchandise Orders
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Track official university organization merchandise purchases and pickup receipts
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders placed yet"
          description="Browse our merchandise catalog to order campus hoodies, caps, and stationery."
          actionText="Visit Home"
          onAction={() => window.location.href = '/'}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8DCCE] gap-2">
                <div>
                  <span className="text-xs font-mono font-bold text-[#6B4A38]">
                    Order #{order.order_number}
                  </span>
                  <span className="text-[11px] text-[#7A6A5E] ml-2">
                    Placed on {format(new Date(order.created_at), 'MMMM d, yyyy • h:mm a')}
                  </span>
                </div>
                <Badge variant={order.status === 'COMPLETED' ? 'success' : 'coffee'} size="sm">
                  {order.status}
                </Badge>
              </div>

              {/* Items List */}
              <div className="py-3 divide-y divide-[#E8DCCE]/40">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#2A1E18]">{item.product_name_snapshot}</span>
                      {item.size && (
                        <span className="ml-2 px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E8DCCE] rounded text-[10px] text-[#7A6A5E]">
                          Size: {item.size}
                        </span>
                      )}
                      <span className="text-[#7A6A5E] block text-[11px]">
                        Quantity: {item.quantity} × ₹{Number(item.unit_price).toFixed(0)}
                      </span>
                    </div>
                    <span className="font-semibold text-[#2A1E18]">
                      ₹{Number(item.subtotal).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Footer & Total */}
              <div className="pt-3 border-t border-[#E8DCCE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                {order.delivery_notes ? (
                  <div className="text-[11px] text-[#7A6A5E]">
                    Pickup instructions: <strong>{order.delivery_notes}</strong>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#7A6A5E]">
                    Pickup at Student Organization Desk
                  </div>
                )}
                <div className="text-right ml-auto">
                  {order.discount > 0 && (
                    <span className="text-[11px] text-emerald-700 block">
                      Member Discount: -₹{Number(order.discount).toFixed(0)}
                    </span>
                  )}
                  <span className="text-sm font-bold text-[#2A1E18]">
                    Total: <strong className="text-base font-extrabold text-[#6B4A38]">₹{Number(order.total).toFixed(0)}</strong>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
