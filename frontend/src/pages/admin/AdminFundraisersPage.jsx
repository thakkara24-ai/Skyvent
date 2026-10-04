import React, { useState, useEffect } from 'react';
import { fundraiserService, extractDataArray } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  HeartHandshake, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Search, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { toast } from 'sonner';

export const AdminFundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    raised_amount: '0',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'ACTIVE',
  });

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingFundraiser, setDeletingFundraiser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { lastEvent } = useSocket();

  const fetchFundraisers = async () => {
    try {
      const res = await fundraiserService.getFundraisers();
      setFundraisers(extractDataArray(res));
    } catch {
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundraisers();
  }, []);

  // Listen for live websocket events
  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'fundraiser_updated' || lastEvent.type === 'finance_updated')) {
      fetchFundraisers();
    }
  }, [lastEvent]);

  const handleOpenCreateModal = () => {
    setEditingFundraiser(null);
    setFormData({
      title: '',
      description: '',
      goal_amount: '',
      raised_amount: '0',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (f) => {
    setEditingFundraiser(f);
    setFormData({
      title: f.title || '',
      description: f.description || '',
      goal_amount: String(f.goal_amount || ''),
      raised_amount: String(f.raised_amount || '0'),
      start_date: f.start_date || new Date().toISOString().slice(0, 10),
      end_date: f.end_date || '',
      status: f.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenDeleteModal = (f) => {
    setDeletingFundraiser(f);
    setDeleteModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        goal_amount: parseFloat(formData.goal_amount),
        raised_amount: parseFloat(formData.raised_amount || 0),
      };

      if (editingFundraiser) {
        await fundraiserService.updateFundraiser(editingFundraiser.id, payload);
        toast.success(`Fundraiser "${formData.title}" updated successfully.`);
      } else {
        await fundraiserService.createFundraiser(payload);
        toast.success(`Fundraiser campaign "${formData.title}" launched.`);
      }
      setModalOpen(false);
      fetchFundraisers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save fundraiser.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFundraiser) return;
    setIsDeleting(true);
    try {
      await fundraiserService.deleteFundraiser(deletingFundraiser.id);
      toast.success(`Fundraiser "${deletingFundraiser.title}" deleted.`);
      setDeleteModalOpen(false);
      setDeletingFundraiser(null);
      fetchFundraisers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete fundraiser.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredFundraisers = fundraisers.filter((f) => {
    const matchesSearch = 
      f.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'coffee';
      case 'PLANNED': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Fundraising & Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Student-led initiatives, lab crowdfunding, and emergency relief grants
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
          New Campaign
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E8DCCE]/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#7A6A5E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#E8DCCE] rounded-xl focus:outline-none focus:border-[#6B4A38]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'PLANNED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#6B4A38] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#7A6A5E] border border-[#E8DCCE] hover:bg-[#E8DCCE]/40'
              }`}
            >
              {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : filteredFundraisers.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <EmptyState
            icon={HeartHandshake}
            title="No campaigns found"
            description={searchQuery ? "No fundraisers match your filter criteria." : "Create your first student fundraiser campaign to start receiving contributions."}
            action={
              <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
                Launch Campaign
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFundraisers.map((f) => {
            const goal = Number(f.goal_amount || 0);
            const raised = Number(f.raised_amount || 0);
            const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

            return (
              <Card key={f.id} padding="lg" className="space-y-4 hover:border-[#6B4A38]/60 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(f.status)} size="sm">
                      {f.status}
                    </Badge>
                    
                    {/* Action Buttons: Edit & Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(f)}
                        title="Edit Campaign"
                        className="p-1.5 rounded-lg text-[#7A6A5E] hover:text-[#2A1E18] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(f)}
                        title="Delete Campaign"
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#2A1E18]">{f.title}</h3>
                    <p className="text-xs text-[#7A6A5E] line-clamp-2 mt-1 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ₹{raised.toLocaleString('en-IN', { minimumFractionDigits: 0 })} raised
                      </span>
                      <span className="text-[#7A6A5E]">
                        Goal: ₹{goal.toLocaleString('en-IN', { minimumFractionDigits: 0 })} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8DCCE]">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8DCCE] flex items-center justify-between text-xs text-[#7A6A5E]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8B6353]" />
                    {f.start_date} → {f.end_date}
                  </span>
                  <span className="font-semibold text-[#6B4A38] bg-[#6B4A38]/10 px-2.5 py-0.5 rounded-md">
                    {f.completed_tasks_count || 0} / {f.tasks_count || 0} Tasks Done
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFundraiser ? "Edit Fundraiser Campaign" : "Launch Fundraiser Campaign"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Campaign Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Campus Maker Lab Prototyping Fund"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Description & Purpose
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="What will these funds be used for?"
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Goal Amount (₹)"
              type="number"
              value={formData.goal_amount}
              onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
              required
            />
            <Input
              label="Current Raised Amount (₹)"
              type="number"
              value={formData.raised_amount}
              onChange={(e) => setFormData({ ...formData, raised_amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              min={formData.start_date}
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              >
                <option value="ACTIVE">Active</option>
                <option value="PLANNED">Planned</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              {editingFundraiser ? 'Save Changes' : 'Launch Campaign'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Fundraiser Campaign"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-950">Confirm Campaign Deletion</p>
              <p className="mt-1 text-rose-800">
                Are you sure you want to delete <span className="font-bold text-rose-950">"{deletingFundraiser?.title}"</span>? All associated volunteer tasks will also be removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
            >
              Delete Campaign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
