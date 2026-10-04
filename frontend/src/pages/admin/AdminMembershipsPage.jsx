import React, { useState, useEffect } from 'react';
import { membershipService, extractDataArray } from '../../services/api';
import { Plus, Edit2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { toast } from 'sonner';

export const AdminMembershipsPage = () => {
  const [plans, setPlans] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '365',
    discount_percentage: '20',
    benefitsText: ''
  });

  const fetchData = async () => {
    try {
      const [pRes, mRes] = await Promise.all([
        membershipService.getPlans(),
        membershipService.getMemberships()
      ]);
      setPlans(extractDataArray(pRes));
      setMemberships(extractDataArray(mRes));
    } catch {
      toast.error('Failed to load memberships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNewPlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      duration_days: '365',
      discount_percentage: '20',
      benefitsText: '20% event discounts\nPriority ticket registration\nMember badge'
    });
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      discount_percentage: String(plan.discount_percentage),
      benefitsText: Array.isArray(plan.benefits) ? plan.benefits.join('\n') : ''
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration_days: parseInt(formData.duration_days),
      discount_percentage: parseFloat(formData.discount_percentage),
      benefits: formData.benefitsText.split('\n').map(s => s.trim()).filter(Boolean),
      is_active: true
    };

    try {
      if (editingPlan) {
        await membershipService.updatePlan(editingPlan.id, payload);
        toast.success('Membership plan updated.');
      } else {
        await membershipService.createPlan(payload);
        toast.success('New membership plan created.');
      }
      setPlanModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save plan.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Membership Plans & Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Configure student membership tiers and monitor active member benefits
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenNewPlan}>
          Add New Plan
        </Button>
      </div>

      {/* Plans List */}
      <div>
        <h3 className="text-base font-bold text-[#2A1E18] mb-4">Membership Tiers</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <Card key={p.id} padding="lg" className="flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#2A1E18]">{p.name}</h4>
                    <span className="text-lg font-extrabold text-[#6B4A38]">₹{Number(p.price).toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-[#7A6A5E] leading-relaxed">{p.description}</p>
                  <div className="text-xs font-semibold text-emerald-800">
                    {p.discount_percentage}% discount on events • {p.duration_days} days
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E8DCCE] mt-4 flex justify-end">
                  <Button size="sm" variant="outline" icon={Edit2} onClick={() => handleOpenEditPlan(p)}>
                    Edit Plan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Subscribed Members Table */}
      <div>
        <h3 className="text-base font-bold text-[#2A1E18] mb-4">Active Member Subscriptions</h3>
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Days Left</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF8F5]/80">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2A1E18]">{m.user?.name}</div>
                      <div className="text-[11px] text-[#7A6A5E]">{m.user?.email}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2A1E18]">{m.plan?.name}</td>
                    <td className="py-3 px-4 text-[#7A6A5E]">{m.start_date}</td>
                    <td className="py-3 px-4 text-[#7A6A5E]">{m.end_date}</td>
                    <td className="py-3 px-4 font-bold text-[#6B4A38]">{m.days_remaining} Days</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={m.effective_status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {m.effective_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Create / Edit Plan Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? "Edit Membership Plan" : "Create New Membership Plan"}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <Input
            label="Plan Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Standard Student Pass"
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

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Price (₹)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <Input
              label="Duration (Days)"
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
              required
            />
            <Input
              label="Discount %"
              type="number"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Benefits (One item per line)
            </label>
            <textarea
              value={formData.benefitsText}
              onChange={(e) => setFormData({ ...formData, benefitsText: e.target.value })}
              rows={3}
              placeholder="e.g. 25% discount on events&#10;Early bird pass registration"
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
