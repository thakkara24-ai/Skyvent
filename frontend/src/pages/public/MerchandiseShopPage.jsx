import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { productService, orderService, extractDataArray } from '../../services/api';
import { 
  ShoppingBag, 
  Search, 
  Package, 
  Check, 
  ArrowRight, 
  Store, 
  BadgePercent,
  QrCode, 
  Smartphone, 
  Wallet, 
  Plus, 
  Minus, 
  Trash2, 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Eye,
  Zap,
  Tag
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

export const MerchandiseShopPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { subscribe } = useSocket();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Selected size per product card: { [productId]: 'M' }
  const [cardSizes, setCardSizes] = useState({});

  // Quick View / Product Details Modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [modalSize, setModalSize] = useState('L');
  const [modalQty, setModalQty] = useState(1);

  // Cart State
  const [cart, setCart] = useState([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Multi-step Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Delivery Info, 2: Payment, 3: Success Receipt
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderResult, setPlacedOrderResult] = useState(null);

  // Delivery & Customer Form
  const [deliveryForm, setDeliveryForm] = useState({
    recipient_name: user?.name || '',
    phone_number: user?.phone || '',
    delivery_type: 'HOSTEL', // 'HOSTEL' | 'PICKUP'
    hostel_name: 'Block A (Boys Hostel)',
    room_no: '',
    address: 'LDCE Campus, Navrangpura, Ahmedabad, Gujarat 380015',
    special_instructions: '',
  });

  // Payment Mode: 'upi_qr' | 'upi_id' | 'wallet'
  const [paymentMode, setPaymentMode] = useState('upi_qr');
  const [upiIdInput, setUpiIdInput] = useState('student@oksbi');

  // Update recipient info when user profile loads
  useEffect(() => {
    if (user) {
      setDeliveryForm(prev => ({
        ...prev,
        recipient_name: prev.recipient_name || user.name || '',
        phone_number: prev.phone_number || user.phone || '',
      }));
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts({
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: search || undefined,
      });
      const items = extractDataArray(res);
      setProducts(items);

      // Initialize default selected size for each product
      const initialSizes = {};
      items.forEach(p => {
        if (Array.isArray(p.sizes) && p.sizes.length > 0) {
          initialSizes[p.id] = p.sizes[0];
        } else {
          initialSizes[p.id] = 'Standard';
        }
      });
      setCardSizes(prev => ({ ...initialSizes, ...prev }));
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
    const unsub = subscribe?.('inventory_updated', () => {
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

  // Helper to select size on a specific product card
  const handleSelectCardSize = (productId, size) => {
    setCardSizes(prev => ({
      ...prev,
      [productId]: size,
    }));
  };

  // Cart Helpers
  const addToCart = (product, size, qty = 1, openDrawer = true) => {
    if (product.stock_quantity <= 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
      ? product.sizes 
      : ['Standard'];
    const chosenSize = size || availableSizes[0];

    const cartKey = `${product.id}-${chosenSize}`;
    const existingIndex = cart.findIndex(item => item.key === cartKey);

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + qty;
      if (newQty > product.stock_quantity) {
        toast.error(`Only ${product.stock_quantity} unit(s) available in stock.`);
        return;
      }
      newCart[existingIndex].quantity = newQty;
      setCart(newCart);
    } else {
      setCart(prev => [
        ...prev,
        {
          key: cartKey,
          product_id: product.id,
          product,
          size: chosenSize,
          quantity: qty,
          unit_price: parseFloat(product.price),
        }
      ]);
    }

    toast.success(`Added ${qty}x ${product.name} (${chosenSize}) to cart!`);
    setQuickViewProduct(null);
    if (openDrawer) {
      setCartDrawerOpen(true);
    }
  };

  const updateCartQty = (key, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.key === key) {
          const newQty = item.quantity + delta;
          if (newQty > item.product.stock_quantity) {
            toast.error(`Max ${item.product.stock_quantity} available in stock.`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (key) => {
    setCart(prev => prev.filter(item => item.key !== key));
    toast.info('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const isMember = user?.has_active_membership;
  const memberDiscount = isMember ? (cartSubtotal * 0.10) : 0; // 10% campus member discount
  const cartTotal = Math.max(0, cartSubtotal - memberDiscount);
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Open Quick View Modal
  const handleOpenQuickView = (p) => {
    const activeSize = cardSizes[p.id] || (Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes[0] : 'Standard');
    setQuickViewProduct(p);
    setModalSize(activeSize);
    setModalQty(1);
  };

  // Direct Buy Now
  const handleDirectBuyNow = (p, chosenSize) => {
    if (!isAuthenticated) {
      toast.info('Please log in to purchase campus merchandise.');
      navigate('/login');
      return;
    }
    const sizeToUse = chosenSize || cardSizes[p.id] || (Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes[0] : 'Standard');
    addToCart(p, sizeToUse, 1, false);
    setCheckoutStep(1);
    setCheckoutModalOpen(true);
  };

  const handleStartCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please log in to complete checkout.');
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your shopping bag is empty.');
      return;
    }
    setCartDrawerOpen(false);
    setCheckoutStep(1);
    setCheckoutModalOpen(true);
  };

  // Final Order Submission
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!deliveryForm.recipient_name.trim() || !deliveryForm.phone_number.trim()) {
      toast.error('Please provide recipient name and contact phone number.');
      setCheckoutStep(1);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const deliveryNotesFormatted = `[Delivery to: ${deliveryForm.recipient_name} | Phone: ${deliveryForm.phone_number} | Type: ${deliveryForm.delivery_type === 'HOSTEL' ? `Hostel: ${deliveryForm.hostel_name}, Room: ${deliveryForm.room_no || 'N/A'}` : 'Student Council Desk Pickup'} | Address: ${deliveryForm.address}${deliveryForm.special_instructions ? ` | Notes: ${deliveryForm.special_instructions}` : ''}]`;

      const payload = {
        items: cart.map(item => ({
          product_id: item.product_id,
          size: item.size,
          quantity: item.quantity,
        })),
        delivery_notes: deliveryNotesFormatted,
        payment_method: paymentMode === 'upi_qr' ? 'UPI QR Code' : paymentMode === 'upi_id' ? `UPI VPA (${upiIdInput})` : 'Student Campus Wallet',
      };

      const res = await orderService.createOrder(payload);
      if (res.data) {
        setPlacedOrderResult(res.data);
        clearCart();
        setCheckoutStep(3); // Go to receipt step
        toast.success(`Order #${res.data.order_number} confirmed!`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Banner with Clean Spacing and Badges */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--ink-brown)] via-[var(--coffee-hover)] to-[var(--coffee-brown)] text-white py-10 px-6 sm:px-12 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[var(--sand)] text-xs font-extrabold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" /> Official Campus Store
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Official Campus Merchandise
          </h1>
          
          <p className="text-xs sm:text-sm text-[var(--sand)]/90 leading-relaxed max-w-xl">
            Wear your campus pride with premium student organization hoodies, varsity caps, badges, notebooks, and exclusive collegiate accessories.
          </p>
          
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--sand)]">
            <span className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
              <Truck className="w-4 h-4 text-emerald-300" /> Free Campus & Hostel Delivery
            </span>
            <span className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-amber-300" /> 10% Member Discount
            </span>
          </div>
        </div>

        {/* Floating Cart Pill in Banner Header */}
        <div className="absolute right-6 top-6 hidden sm:block">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="bg-[var(--card-bg,white)] text-[var(--ink-brown)] px-4 py-2.5 rounded-2xl shadow-lg hover:shadow-xl font-extrabold text-xs flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer border border-[var(--sand)]"
          >
            <ShoppingBag className="w-4 h-4 text-[var(--coffee-brown)]" />
            <span>My Bag ({totalCartCount})</span>
            {cartTotal > 0 && (
              <span className="bg-[var(--coffee-brown)] text-white px-2 py-0.5 rounded-full text-[11px] font-bold">
                ₹{cartTotal.toFixed(0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills & Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[var(--coffee-brown)] text-white shadow-sm'
                  : 'bg-[var(--card-bg,white)] text-[var(--warm-gray)] hover:text-[var(--ink-brown)] border border-[var(--sand)] hover:bg-[var(--cream)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Bar & Mobile Cart */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--warm-gray)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--card-bg,white)] border border-[var(--sand)] rounded-xl focus:outline-none focus:border-[var(--coffee-brown)] font-medium"
            />
          </div>

          <button
            onClick={() => setCartDrawerOpen(true)}
            className="md:hidden p-2.5 bg-[var(--coffee-brown)] text-white rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>({totalCartCount})</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No merchandise items found"
          description="Check back soon for new apparel collections and student gear drops."
          actionText="Clear Filter"
          onAction={() => {
            setSelectedCategory('ALL');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const isOutOfStock = product.stock_quantity <= 0;
            const price = parseFloat(product.price);
            const memberPrice = price * 0.9;
            const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
              ? product.sizes 
              : ['Standard'];
            const activeSize = cardSizes[product.id] || availableSizes[0];

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-[#E8DCCE] overflow-hidden hover:shadow-xl hover:border-[#6B4A38]/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Product Thumbnail & Overlay Tags */}
                  <div className="relative h-60 bg-[#FAF8F5] overflow-hidden flex items-center justify-center">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    
                    {/* Category Frosted Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 text-[#2A1E18] backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-[#E8DCCE] shadow-xs">
                        {product.category}
                      </span>
                    </div>

                    {/* Stock Alert Tags */}
                    {isOutOfStock ? (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shadow-xs">
                        Out of Stock
                      </div>
                    ) : product.stock_quantity <= product.low_stock_threshold ? (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        Only {product.stock_quantity} left
                      </div>
                    ) : null}

                    {/* Quick View Hover Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenQuickView(product)}
                      className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold cursor-pointer"
                    >
                      <span className="bg-white text-[#2A1E18] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-[#FAF8F5]">
                        <Eye className="w-3.5 h-3.5" /> Quick View
                      </span>
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-2.5">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#2A1E18] line-clamp-1 group-hover:text-[#6B4A38] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#7A6A5E] line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Interactive Size Selector Row */}
                    <div className="pt-1">
                      <div className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Select Size / Variant:</span>
                        <span className="text-[#6B4A38] font-bold">{activeSize}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {availableSizes.map((sz) => {
                          const isSelected = activeSize === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleSelectCardSize(product.id, sz)}
                              className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#6B4A38] text-white border-[#6B4A38] shadow-xs scale-105'
                                  : 'bg-[#FAF8F5] text-[#2A1E18] border-[#E8DCCE] hover:border-[#6B4A38] hover:bg-white'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Action Buttons */}
                <div className="p-4 pt-2 border-t border-[#E8DCCE]/70 space-y-3">
                  {/* Price Row */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-lg font-black text-[#2A1E18]">
                        ₹{price.toFixed(2)}
                      </div>
                      <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" /> Member: ₹{memberPrice.toFixed(0)}
                      </div>
                    </div>

                    <div className="text-[10px] text-[#7A6A5E] font-medium">
                      SKU: {product.sku}
                    </div>
                  </div>

                  {/* 2-Action Buttons (Add to Bag + Buy Now) */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={ShoppingBag}
                      onClick={() => addToCart(product, activeSize, 1, true)}
                      disabled={isOutOfStock}
                      className="w-full text-xs font-bold py-2"
                    >
                      Add to Bag
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Zap}
                      onClick={() => handleDirectBuyNow(product, activeSize)}
                      disabled={isOutOfStock}
                      className="w-full text-xs font-bold py-2"
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Sticky Bag Trigger Button for Quick Checkout */}
      {cart.length > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="bg-[#6B4A38] text-white px-5 py-3.5 rounded-full shadow-2xl hover:bg-[#2A1E18] transition-all flex items-center gap-3 font-extrabold text-sm cursor-pointer border-2 border-white hover:scale-105"
          >
            <ShoppingBag className="w-5 h-5 text-amber-200" />
            <span>Review Bag ({totalCartCount})</span>
            <span className="bg-white text-[#6B4A38] px-2 py-0.5 rounded-full text-xs font-black">
              ₹{cartTotal.toFixed(0)}
            </span>
          </button>
        </div>
      )}

      {/* Quick View / Product Details Modal */}
      <Modal
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        title={quickViewProduct?.name || "Product Details"}
        subtitle={`SKU: ${quickViewProduct?.sku || 'N/A'}`}
        maxWidth="max-w-xl"
      >
        {quickViewProduct && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48 h-48 bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#E8DCCE] shrink-0">
                <img
                  src={quickViewProduct.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'}
                  alt={quickViewProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2.5">
                <Badge variant="coffee" size="xs">{quickViewProduct.category}</Badge>
                
                <div>
                  <div className="text-xl font-black text-[#2A1E18]">
                    ₹{parseFloat(quickViewProduct.price).toFixed(2)}
                  </div>
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Tag className="w-3 h-3" /> Campus Member Price: ₹{(parseFloat(quickViewProduct.price) * 0.9).toFixed(2)}
                  </div>
                </div>

                <p className="text-xs text-[#7A6A5E] leading-relaxed">
                  {quickViewProduct.description}
                </p>

                {/* Size Selector in Modal */}
                <div>
                  <label className="block text-[11px] font-bold text-[#2A1E18] uppercase tracking-wider mb-1">
                    Select Size:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(quickViewProduct.sizes) && quickViewProduct.sizes.length > 0 
                      ? quickViewProduct.sizes 
                      : ['Standard']
                    ).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setModalSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          modalSize === sz
                            ? 'bg-[#6B4A38] text-white border-[#6B4A38]'
                            : 'bg-white text-[#7A6A5E] border-[#E8DCCE] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold text-[#2A1E18] uppercase tracking-wider mb-1">
                    Quantity:
                  </label>
                  <div className="inline-flex items-center border border-[#E8DCCE] rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="p-1.5 text-[#7A6A5E] hover:text-[#2A1E18]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-[#2A1E18]">{modalQty}</span>
                    <button
                      type="button"
                      onClick={() => setModalQty(Math.min(quickViewProduct.stock_quantity, modalQty + 1))}
                      className="p-1.5 text-[#7A6A5E] hover:text-[#2A1E18]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8DCCE]">
              <Button
                variant="outline"
                size="sm"
                icon={ShoppingBag}
                onClick={() => addToCart(quickViewProduct, modalSize, modalQty, true)}
              >
                Add to Bag
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Zap}
                onClick={() => {
                  addToCart(quickViewProduct, modalSize, modalQty, false);
                  setCheckoutStep(1);
                  setCheckoutModalOpen(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cart Drawer / Slide-Over Modal */}
      <Modal
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        title={`Your Shopping Bag (${totalCartCount} Items)`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="w-12 h-12 text-[#7A6A5E]/40 mx-auto" />
              <p className="text-xs font-bold text-[#2A1E18]">Your shopping bag is empty</p>
              <p className="text-[11px] text-[#7A6A5E]">Explore our hoodies, t-shirts, caps, and notebooks above!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8DCCE]"
                >
                  <img
                    src={item.product.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80'}
                    alt={item.product.name}
                    className="w-14 h-14 object-cover rounded-lg border border-[#E8DCCE] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#2A1E18] truncate">{item.product.name}</h4>
                    <div className="text-[11px] text-[#7A6A5E]">
                      Size: <span className="font-semibold text-[#6B4A38]">{item.size}</span> • ₹{item.unit_price} each
                    </div>
                    <div className="text-xs font-extrabold text-[#2A1E18] mt-0.5">
                      Subtotal: ₹{(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-white border border-[#E8DCCE] rounded-lg p-0.5">
                    <button
                      onClick={() => updateCartQty(item.key, -1)}
                      className="p-1 hover:bg-[#FAF8F5] rounded text-[#7A6A5E] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold px-1.5 text-[#2A1E18]">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQty(item.key, 1)}
                      className="p-1 hover:bg-[#FAF8F5] rounded text-[#7A6A5E] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="p-1.5 text-[#7A6A5E] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pricing Breakdown */}
          {cart.length > 0 && (
            <div className="bg-white border border-[#E8DCCE] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#7A6A5E]">
                <span>Items Subtotal:</span>
                <span className="font-bold text-[#2A1E18]">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              {isMember && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <BadgePercent className="w-3 h-3" /> Campus Member Privilege (10% Off):
                  </span>
                  <span>-₹{memberDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#7A6A5E]">
                <span>Campus Hostel Delivery:</span>
                <span className="font-bold text-emerald-700">FREE</span>
              </div>
              <div className="pt-2 border-t border-[#E8DCCE] flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-[#2A1E18] uppercase tracking-wider">Total Payable:</span>
                <span className="text-xl font-black text-[#6B4A38]">
                  ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setCartDrawerOpen(false)}>
              Continue Shopping
            </Button>
            {cart.length > 0 && (
              <Button variant="primary" size="sm" onClick={handleStartCheckout} icon={ArrowRight}>
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Multi-Step E-Commerce Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title={
          checkoutStep === 1
            ? "1. Student Delivery & Contact Details"
            : checkoutStep === 2
            ? "2. Payment Method & UPI Checkout"
            : "Order Confirmed!"
        }
        subtitle={
          checkoutStep === 1
            ? "Specify campus hostel, block, or council desk pickup location"
            : checkoutStep === 2
            ? "Instant campus payment via UPI QR or UPI ID"
            : "Your merchandise order is confirmed and being prepared!"
        }
        maxWidth="max-w-xl"
      >
        {/* Step 1: Delivery Information Form */}
        {checkoutStep === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCheckoutStep(2);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Recipient Name *"
                icon={User}
                value={deliveryForm.recipient_name}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, recipient_name: e.target.value })}
                required
              />
              <Input
                label="Contact Phone / WhatsApp *"
                icon={Phone}
                type="tel"
                value={deliveryForm.phone_number}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            {/* Delivery Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1.5">
                Delivery / Pickup Method *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryForm({ ...deliveryForm, delivery_type: 'HOSTEL' })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryForm.delivery_type === 'HOSTEL'
                      ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold'
                      : 'border-[#E8DCCE] bg-white text-[#7A6A5E]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Truck className="w-4 h-4" /> Hostel Delivery
                  </div>
                  <p className="text-[10px] text-[#7A6A5E] mt-0.5">Delivered directly to your hostel room</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryForm({ ...deliveryForm, delivery_type: 'PICKUP' })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryForm.delivery_type === 'PICKUP'
                      ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold'
                      : 'border-[#E8DCCE] bg-white text-[#7A6A5E]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <MapPin className="w-4 h-4" /> Council Desk Pickup
                  </div>
                  <p className="text-[10px] text-[#7A6A5E] mt-0.5">Pick up at Student Org Center desk</p>
                </button>
              </div>
            </div>

            {deliveryForm.delivery_type === 'HOSTEL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8DCCE]">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                    Hostel / Building Block
                  </label>
                  <select
                    value={deliveryForm.hostel_name}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, hostel_name: e.target.value })}
                    className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
                  >
                    <option value="Block A (Boys Hostel)">Block A (Boys Hostel)</option>
                    <option value="Block B (Boys Hostel)">Block B (Boys Hostel)</option>
                    <option value="Block C (Girls Hostel)">Block C (Girls Hostel)</option>
                    <option value="Block D (PG & Scholar Wing)">Block D (PG & Scholar Wing)</option>
                    <option value="Faculty / Campus Staff Quarters">Faculty / Campus Staff Quarters</option>
                  </select>
                </div>
                <Input
                  label="Room / Unit Number *"
                  value={deliveryForm.room_no}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, room_no: e.target.value })}
                  placeholder="e.g. Room 304, 3rd Floor"
                  required
                />
              </div>
            )}

            <Input
              label="Campus Address"
              value={deliveryForm.address}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
              placeholder="Full university address"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                value={deliveryForm.special_instructions}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, special_instructions: e.target.value })}
                rows={2}
                placeholder="e.g. Please call before delivery, or leave with roommate if absent..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#E8DCCE]">
              <Button variant="ghost" size="sm" onClick={() => setCheckoutModalOpen(false)}>
                Back to Store
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={ArrowRight}>
                Continue to Payment (₹{cartTotal.toFixed(2)})
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Payment Method & UPI Checkout */}
        {checkoutStep === 2 && (
          <div className="space-y-4">
            {/* Order Items Summary */}
            <div className="bg-[#FAF8F5] border border-[#E8DCCE] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-bold text-[#2A1E18] pb-1 border-b border-[#E8DCCE]">
                Order Summary ({totalCartCount} items):
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {cart.map((item) => (
                  <div key={item.key} className="flex justify-between text-[#7A6A5E]">
                    <span>{item.quantity}x {item.product.name} ({item.size})</span>
                    <span className="font-bold text-[#2A1E18]">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {isMember && (
                <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-[#E8DCCE]/60">
                  <span>Member Discount (10%):</span>
                  <span>-₹{memberDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E8DCCE] flex justify-between items-baseline">
                <span className="font-extrabold text-[#2A1E18]">Total Amount:</span>
                <span className="text-xl font-black text-[#6B4A38]">
                  ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1.5">
                Choose Payment Option
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi_qr')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMode === 'upi_qr'
                      ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold shadow-xs'
                      : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-[11px]">UPI QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('upi_id')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMode === 'upi_id'
                      ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold shadow-xs'
                      : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[11px]">UPI ID / VPA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('wallet')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMode === 'wallet'
                      ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold shadow-xs'
                      : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span className="text-[11px]">Campus Wallet</span>
                </button>
              </div>
            </div>

            {/* Payment Mode UI Details */}
            {paymentMode === 'upi_qr' && (
              <div className="bg-white border border-[#E8DCCE] rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                <div className="p-2.5 bg-white rounded-xl border border-[#E8DCCE] shadow-xs">
                  <QRCodeSVG
                    value={`upi://pay?pa=skyvent.merch@okhdfcbank&pn=SKYVENT%20Merchandise&am=${cartTotal.toFixed(2)}&cu=INR&tn=Campus%20Merchandise%20Order`}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="text-xs font-bold text-[#2A1E18]">
                  Scan with Google Pay, PhonePe, Paytm, or BHIM
                </div>
                <div className="text-[11px] font-mono text-[#7A6A5E] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#E8DCCE]">
                  skyvent.merch@okhdfcbank
                </div>
              </div>
            )}

            {paymentMode === 'upi_id' && (
              <div className="bg-white border border-[#E8DCCE] rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider">
                  Enter Your UPI ID / VPA
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
                  />
                  <span className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6A5E]">
                  A collect request for ₹{cartTotal.toFixed(2)} will be triggered to your UPI app.
                </p>
              </div>
            )}

            {paymentMode === 'wallet' && (
              <div className="bg-white border border-[#E8DCCE] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-[#2A1E18]">Campus Student Wallet</div>
                  <div className="text-[11px] text-[#7A6A5E]">Available Balance: ₹2,450.00</div>
                </div>
                <Badge variant="success" size="sm">✓ Sufficient Balance</Badge>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[#E8DCCE]">
              <Button variant="ghost" size="sm" onClick={() => setCheckoutStep(1)}>
                Back to Delivery Info
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handlePlaceOrder}
                isLoading={isPlacingOrder}
                icon={ShieldCheck}
                className="font-bold"
              >
                Pay ₹{cartTotal.toFixed(2)} & Place Order
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Order Placed Success Receipt */}
        {checkoutStep === 3 && placedOrderResult && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm animate-pulse">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-[#2A1E18]">Thank You for Your Order!</h3>
              <p className="text-xs text-[#7A6A5E] mt-1">
                Your campus merchandise order has been received and sent for packing.
              </p>
            </div>

            {/* Receipt Box */}
            <div className="bg-[#FAF8F5] border border-[#E8DCCE] rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between font-mono font-bold text-[#6B4A38]">
                <span>Order Reference:</span>
                <span>#{placedOrderResult.order_number}</span>
              </div>
              <div className="flex justify-between text-[#7A6A5E]">
                <span>Recipient:</span>
                <span className="font-bold text-[#2A1E18]">{deliveryForm.recipient_name} ({deliveryForm.phone_number})</span>
              </div>
              <div className="flex justify-between text-[#7A6A5E]">
                <span>Delivery Destination:</span>
                <span className="font-medium text-[#2A1E18] text-right">
                  {deliveryForm.delivery_type === 'HOSTEL' ? `${deliveryForm.hostel_name}, Room ${deliveryForm.room_no}` : 'Council Desk Pickup'}
                </span>
              </div>
              <div className="flex justify-between text-[#7A6A5E]">
                <span>Status:</span>
                <span className="font-bold text-emerald-700">Processing & Preparing</span>
              </div>
              <div className="pt-2 border-t border-[#E8DCCE] flex justify-between font-bold text-sm text-[#2A1E18]">
                <span>Amount Paid:</span>
                <span className="text-[#6B4A38] font-black">₹{parseFloat(placedOrderResult.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/my-orders" onClick={() => setCheckoutModalOpen(false)}>
                <Button variant="primary" size="sm" icon={Package}>
                  Track in My Orders
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCheckoutModalOpen(false);
                  setCheckoutStep(1);
                }}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
