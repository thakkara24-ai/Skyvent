import React, { useState, useEffect } from 'react';
import { productService, extractDataArray } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  ShoppingBag, 
  Plus, 
  Edit2, 
  AlertTriangle, 
  Package, 
  Trash2, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { ImageUploadInput } from '../../components/common/ImageUploadInput';
import { toast } from 'sonner';

// Curated high quality presets for student merchandise
const PRESET_IMAGES = [
  {
    name: 'Vintage Hoodie',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    category: 'APPAREL'
  },
  {
    name: 'Club T-Shirt',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    category: 'APPAREL'
  },
  {
    name: 'Campus Cap',
    url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    category: 'ACCESSORIES'
  },
  {
    name: 'Eco Tote Bag',
    url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    category: 'ACCESSORIES'
  },
  {
    name: 'Hardbound Notebook',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    category: 'STATIONERY'
  },
  {
    name: 'Ceramic Campus Mug',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    category: 'COLLECTIBLES'
  },
];

export const AdminProductsPage = () => {
  const { subscribe } = useSocket();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'APPAREL',
    price: '',
    sku: '',
    sizes: 'S, M, L, XL, XXL',
    stock_quantity: '20',
    low_stock_threshold: '10',
    image: '',
    is_active: true,
  });

  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts();
      setProducts(extractDataArray(res));
    } catch {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const unsub = subscribe('inventory_updated', (data) => {
      fetchProducts();
    });
    return unsub;
  }, [subscribe]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'APPAREL',
      price: '499',
      sku: `SKY-PRD-${Math.floor(100 + Math.random() * 900)}`,
      sizes: 'S, M, L, XL, XXL',
      stock_quantity: '25',
      low_stock_threshold: '10',
      image: PRESET_IMAGES[0].url,
      is_active: true,
    });
    setProductModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      category: p.category,
      price: String(p.price),
      sku: p.sku,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : '',
      stock_quantity: String(p.stock_quantity),
      low_stock_threshold: String(p.low_stock_threshold),
      image: p.image || '',
      is_active: p.is_active,
    });
    setProductModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        image: event.target?.result || ''
      }));
      toast.success('Product image loaded successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price),
      sku: formData.sku,
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean),
      stock_quantity: parseInt(formData.stock_quantity),
      low_stock_threshold: parseInt(formData.low_stock_threshold),
      image: formData.image,
      is_active: formData.is_active,
    };

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload);
        toast.success(`Product '${formData.name}' updated.`);
      } else {
        await productService.createProduct(payload);
        toast.success(`Product '${formData.name}' created.`);
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (p) => {
    if (!window.confirm(`Are you sure you want to delete '${p.name}'?`)) return;
    try {
      await productService.deleteProduct(p.id);
      toast.success(`Product '${p.name}' removed.`);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Merchandise & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Manage organization store apparel, upload product images, and track stock alerts
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreate} className="font-bold">
          Add New Product
        </Button>
      </div>

      {/* Products Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A6A5E]">
            No products found. Click "Add New Product" to populate your student catalog.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Item & Image</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4">Sizes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {products.map((p) => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-lg object-cover border border-[#E8DCCE] shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] border border-[#E8DCCE] flex items-center justify-center text-[#7A6A5E] shrink-0">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[#2A1E18] text-sm">{p.name}</div>
                            <div className="text-[11px] text-[#7A6A5E] line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#6B4A38]">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="default" size="sm">
                          {p.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#2A1E18] text-sm">
                        ₹{Number(p.price).toFixed(0)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isLow ? 'text-rose-700' : 'text-[#2A1E18]'}`}>
                            {p.stock_quantity} units
                          </span>
                          {isLow && (
                            <Badge variant="danger" size="sm">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#7A6A5E] font-medium">
                        {Array.isArray(p.sizes) ? p.sizes.join(', ') : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(p)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash2}
                            onClick={() => handleDeleteProduct(p)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Product Modal with Image Uploader & Presets */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? "Edit Merchandise Product" : "Add New Merchandise Product"}
        subtitle="Manage product specifications, pricing, inventory, and images"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Product Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. SKYVENT Official Hoodie"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="APPAREL">Apparel & Hoodies</option>
                <option value="ACCESSORIES">Accessories & Caps</option>
                <option value="STATIONERY">Stationery & Notebooks</option>
                <option value="COLLECTIBLES">Collectibles & Pins</option>
              </select>
            </div>

            <Input
              label="SKU Identifier *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Price (₹) *"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <Input
              label="Stock Quantity *"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              required
            />
            <Input
              label="Low Stock Alert Threshold *"
              type="number"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
              required
            />
          </div>

          <Input
            label="Available Sizes (Comma separated)"
            value={formData.sizes}
            onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
            placeholder="S, M, L, XL, XXL"
          />

          <ImageUploadInput
            label="Product Image (File Upload or Web Link)"
            value={formData.image}
            onChange={(val) => setFormData({ ...formData, image: val })}
            placeholder="https://images.unsplash.com/..."
            presets={PRESET_IMAGES}
            helperText="Upload apparel/item photo or choose from catalog presets"
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
