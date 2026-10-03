import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/api';
import { Megaphone, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    priority: 'MEDIUM',
    published: true,
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementService.getAnnouncements();
      if (res.data) setAnnouncements(res.data.results || res.data);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreate = () => {
    setEditingAnn(null);
    setFormData({
      title: '',
      content: '',
      audience: 'ALL',
      priority: 'MEDIUM',
      published: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setEditingAnn(a);
    setFormData({
      title: a.title,
      content: a.content,
      audience: a.audience,
      priority: a.priority,
      published: a.published,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAnn) {
        await announcementService.updateAnnouncement(editingAnn.id, formData);
        toast.success('Announcement updated.');
      } else {
        await announcementService.createAnnouncement(formData);
        toast.success('Announcement published and notifications sent.');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.message || 'Failed to save announcement.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await announcementService.deleteAnnouncement(id);
        toast.success('Announcement removed.');
        fetchAnnouncements();
      } catch {
        toast.error('Failed to delete.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Broadcast Announcements
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Publish targeted messages to members, volunteers, and treasurers with automated notification push
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={handleOpenCreate}>
          New Announcement
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          announcements.map((ann) => (
            <Card key={ann.id} padding="lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCE]">
                <div className="flex items-center gap-2">
                  <Badge variant={ann.priority === 'HIGH' || ann.priority === 'URGENT' ? 'danger' : 'coffee'} size="sm">
                    {ann.priority}
                  </Badge>
                  <Badge variant="clay" size="sm">
                    Audience: {ann.audience}
                  </Badge>
                  <span className="text-[11px] text-[#7A6A5E]">
                    {format(new Date(ann.published_at), 'MMMM d, yyyy • h:mm a')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleOpenEdit(ann)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-700 hover:bg-rose-50" icon={Trash2} onClick={() => handleDelete(ann.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="pt-3">
                <h3 className="text-base font-bold text-[#2A1E18] mb-1">{ann.title}</h3>
                <p className="text-xs text-[#7A6A5E] leading-relaxed whitespace-pre-line">
                  {ann.content}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAnn ? "Edit Announcement" : "Create Announcement"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Early-bird ticket sales active"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Audience
              </label>
              <select
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="ALL">All Campus Users</option>
                <option value="MEMBERS">Active Members Only</option>
                <option value="VOLUNTEERS">Volunteers & Staff</option>
                <option value="TREASURERS">Treasurers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Content Body
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              placeholder="Enter announcement details..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Publish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
