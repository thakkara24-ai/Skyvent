import React, { useState, useEffect } from 'react';
import { orderService, extractDataArray } from '../../services/api';
import { Search } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await orderService.getOrders({ search });
      setOrders(extractDataArray(res));
    } catch {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          Customer Merchandise Orders
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Review all fulfilled and pending student apparel orders
        </p>
      </div>

      <div className="flex gap-3 bg-white p-3 rounded-xl border border-[#E8DCCE]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A5E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, buyer name, email..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
          />
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A6A5E]">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Items Ordered</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Placed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5]/80">
                    <td className="py-3 px-4 font-mono font-bold text-[#6B4A38]">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2A1E18]">{o.user?.name}</div>
                      <div className="text-[11px] text-[#7A6A5E]">{o.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="text-[#2A1E18]">
                            <strong>{item.quantity}x</strong> {item.product_name_snapshot} {item.size ? `(${item.size})` : ''}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2A1E18]">
                      ₹{Number(o.total).toFixed(0)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={o.status === 'COMPLETED' ? 'success' : 'coffee'} size="sm">
                        {o.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-[#7A6A5E]">
                      {format(new Date(o.created_at), 'MMM d, yyyy • h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
