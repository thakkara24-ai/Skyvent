import React, { useState, useEffect } from 'react';
import { productService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { ShoppingBag, Plus, Edit2, AlertTriangle, Package, Trash2, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { toast } from 'sonner';

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
      if (res.data) setProducts(res.data.results || res.data);
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
      image: '',
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Merchandise & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Manage organization store apparel, size variations, and automatic stock alerts
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreate}>
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
            No products in inventory. Add your first item.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Item & Description</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Available Sizes</th>
                  <th className="py-3 px-4">Stock Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {products.map((p) => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5]/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#2A1E18]">{p.name}</div>
                        <div className="text-[11px] text-[#7A6A5E] line-clamp-1">{p.description}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#2A1E18]">{p.sku}</td>
                      <td className="py-3 px-4">
                        <Badge variant="coffee" size="sm">{p.category}</Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#2A1E18]">₹{Number(p.price).toFixed(0)}</td>
                      <td className="py-3 px-4 text-[#7A6A5E]">
                        {Array.isArray(p.sizes) ? p.sizes.join(', ') : 'Standard'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-extrabold text-sm ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {p.stock_quantity} units
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-amber-700 font-medium">
                            Low Stock Alert (≤ {p.low_stock_threshold})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(p)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? "Edit Product Details" : "Add New Merchandise Product"}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. SKYVENT Official Hoodie"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Description
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
              label="SKU Identifier"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Price (₹)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              required
            />
            <Input
              label="Low Stock Alert Threshold"
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

          <Input
            label="Image URL (Optional)"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
