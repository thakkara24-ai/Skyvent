import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { productService, orderService } from '../../services/api';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Package, 
  Check, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { DemoPaymentModal } from '../../components/common/DemoPaymentModal';
import { toast } from 'sonner';

export const MerchandiseShopPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { subscribe } = useSocket();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Checkout Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('L');
  const [selectedQty, setSelectedQty] = useState(1);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: search || undefined,
      });
      const items = Array.isArray(res.data) ? res.data : (res.data?.results || res.data?.data || []);
      setProducts(items);
    } catch {
      toast.error('Failed to load merchandise catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(t);
  }, [search, selectedCategory]);

  useEffect(() => {
    const unsub = subscribe('inventory_updated', () => {
      fetchProducts();
    });
    return unsub;
  }, [subscribe]);

  const categories = [
    { id: 'ALL', name: 'All Merchandise' },
    { id: 'APPAREL', name: 'Apparel & Hoodies' },
    { id: 'ACCESSORIES', name: 'Accessories & Caps' },
    { id: 'STATIONERY', name: 'Stationery' },
    { id: 'COLLECTIBLES', name: 'Collectibles' },
  ];

  const handleOpenBuyModal = (p) => {
    if (!isAuthenticated) {
      toast.info('Please log in to purchase student merchandise.');
      navigate('/login');
      return;
    }

    if (p.stock_quantity <= 0) {
      toast.error('Sorry, this product is currently out of stock.');
      return;
    }

    setSelectedProduct(p);
    setSelectedSize(Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes[0] : 'Standard');
    setSelectedQty(1);
    setDeliveryNotes('');
    setPaymentModalOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;
    setIsOrdering(true);

    try {
      const orderPayload = {
        items: [
          {
            product_id: selectedProduct.id,
            quantity: selectedQty,
            size: selectedSize || 'Standard',
          }
        ],
        delivery_notes: deliveryNotes || 'Campus Hostel / Desk pickup',
        payment_method: 'UPI / Demo Settlement',
      };

      const res = await orderService.createOrder(orderPayload);
      toast.success(res.message || 'Order placed successfully! Check your orders tab.');
      setPaymentModalOpen(false);
      fetchProducts();
      navigate('/my-orders');
    } catch (err) {
      toast.error(err.message || 'Failed to place merchandise order.');
    } finally {
      setIsOrdering(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    return Number(selectedProduct.price) * selectedQty;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B4A38]/10 text-[#6B4A38] text-xs font-bold uppercase tracking-wider mb-2">
          <ShoppingBag className="w-3.5 h-3.5" />
          Campus Merchandise Store
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2A1E18] tracking-tight">
          Official Student Organization Gear
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1 max-w-2xl">
          Show your campus pride with official club apparel, hoodies, accessories, and supplies. Order with instant UPI settlement.
        </p>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#6B4A38] text-white shadow-xs'
                  : 'bg-white border border-[#E8DCCE] text-[#7A6A5E] hover:bg-[#FAF8F5]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A5E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchandise..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No Merchandise Found"
          description="Try changing your search keywords or category filters."
          actionText="View All Items"
          onAction={() => {
            setSearch('');
            setSelectedCategory('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const inStock = p.stock_quantity > 0;
            const isLowStock = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;

            return (
              <Card key={p.id} padding="none" className="overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="relative h-56 bg-[#FAF8F5] overflow-hidden border-b border-[#E8DCCE]">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#7A6A5E]">
                      <ShoppingBag className="w-16 h-16 opacity-30" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <Badge variant="default" size="sm" className="bg-white/90 backdrop-blur-xs font-bold">
                      {p.category}
                    </Badge>
                  </div>

                  <div className="absolute top-3 right-3">
                    {inStock ? (
                      <Badge variant={isLowStock ? "danger" : "success"} size="sm" className="font-semibold shadow-xs">
                        {isLowStock ? `Only ${p.stock_quantity} left!` : `${p.stock_quantity} in stock`}
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" className="font-semibold shadow-xs">
                        Sold Out
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-[11px] font-mono text-[#7A6A5E] uppercase tracking-wider mb-1">
                      SKU: {p.sku}
                    </div>
                    <h3 className="text-lg font-bold text-[#2A1E18] group-hover:text-[#6B4A38] transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-[#7A6A5E] mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Sizes preview */}
                    {Array.isArray(p.sizes) && p.sizes.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#7A6A5E] uppercase">Sizes:</span>
                        <div className="flex gap-1">
                          {p.sizes.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E8DCCE] rounded text-[10px] font-bold text-[#2A1E18]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price & Buy Button */}
                  <div className="pt-3 border-t border-[#E8DCCE] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#7A6A5E] uppercase tracking-wider block font-semibold">Price</span>
                      <span className="text-xl font-extrabold text-[#6B4A38]">
                        ₹{Number(p.price).toFixed(0)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={ArrowRight}
                      disabled={!inStock}
                      onClick={() => handleOpenBuyModal(p)}
                      className="font-bold"
                    >
                      {inStock ? 'Order Now' : 'Out of Stock'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Checkout Demo Modal */}
      {selectedProduct && (
        <DemoPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Order: ${selectedProduct.name}`}
          itemName={`${selectedProduct.name} (${selectedSize}) x ${selectedQty}`}
          itemType="Campus Merchandise"
          amount={calculateTotal()}
          onConfirm={handleConfirmOrder}
          isProcessing={isOrdering}
        />
      )}
    </div>
  );
};
