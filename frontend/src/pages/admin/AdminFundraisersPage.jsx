import React, { useState, useEffect } from 'react';
import { fundraiserService, extractDataArray } from '../../services/api';
import { HeartHandshake, Plus, Edit2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { toast } from 'sonner';

export const AdminFundraisersPage = () => {
  const [fundraisers, setFundraisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    raised_amount: '0',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'ACTIVE',
  });

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fundraiserService.createFundraiser({
        ...formData,
        goal_amount: parseFloat(formData.goal_amount),
        raised_amount: parseFloat(formData.raised_amount || 0),
      });
      toast.success('Fundraiser campaign launched.');
      setModalOpen(false);
      fetchFundraisers();
    } catch (err) {
      toast.error(err.message || 'Failed to create fundraiser.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Fundraising & Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Student-led initiatives, lab crowdfunding, and emergency relief grants
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          fundraisers.map((f) => {
            const pct = f.goal_amount > 0 ? Math.min(100, Math.round((f.raised_amount / f.goal_amount) * 100)) : 0;

            return (
              <Card key={f.id} padding="lg" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="coffee" size="sm">{f.status}</Badge>
                  <span className="text-xs text-[#7A6A5E]">
                    {f.tasks_count} Volunteer Tasks
                  </span>
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
                    <span className="font-extrabold text-emerald-800">
                      ₹{Number(f.raised_amount).toLocaleString('en-IN')} raised
                    </span>
                    <span className="text-[#7A6A5E]">
                      Goal: ₹{Number(f.goal_amount).toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8DCCE]">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8DCCE] flex items-center justify-between text-xs text-[#7A6A5E]">
                  <span>Timeline: {f.start_date} to {f.end_date}</span>
                  <span className="font-semibold text-[#6B4A38]">{f.completed_tasks_count} Completed Tasks</span>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Launch Fundraiser Campaign"
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
              label="Initial Raised Amount (₹)"
              type="number"
              value={formData.raised_amount}
              onChange={(e) => setFormData({ ...formData, raised_amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              min={formData.start_date || new Date().toISOString().slice(0, 10)}
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Launch Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
