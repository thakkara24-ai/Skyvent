import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/api';
import { Calendar, Plus, Edit2, Trash2, Users, MapPin, Clock, Eye } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await eventService.getEvents();
      if (res.data) setEvents(res.data);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenDelete = (evt) => {
    setEventToDelete(evt);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(eventToDelete.id);
      toast.success(`Event '${eventToDelete.title}' removed.`);
      setDeleteModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to remove event.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Event Management
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Create campus events, define member/non-member pricing, and set capacity thresholds
          </p>
        </div>

        <Link to="/admin/events/new">
          <Button size="sm" variant="primary" icon={Plus}>
            Create New Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events created yet"
          actionText="Create First Event"
          onAction={() => navigate('/admin/events/new')}
        />
      ) : (
        <div className="space-y-4">
          {events.map((evt) => {
            let formattedDate = 'Date TBA';
            try {
              formattedDate = format(new Date(evt.start_datetime), 'EEEE, MMMM d, yyyy • h:mm a');
            } catch {
              // ignore
            }

            return (
              <Card key={evt.id} padding="lg" className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="coffee" size="sm">{evt.category}</Badge>
                    <Badge variant={evt.status === 'PUBLISHED' ? 'success' : evt.status === 'CANCELLED' ? 'danger' : 'warning'} size="sm">
                      {evt.status}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-[#2A1E18]">{evt.title}</h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A6A5E]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#8B6353]" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8B6353]" />
                      {evt.venue}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#8B6353]" />
                      {evt.tickets_sold_count}/{evt.capacity} registered ({evt.checked_in_count} checked in)
                    </span>
                  </div>

                  <div className="text-xs pt-1">
                    Pricing: <strong className="text-emerald-800 font-bold">₹{Number(evt.member_price).toFixed(0)} Member</strong> / ₹{Number(evt.non_member_price).toFixed(0)} Regular
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/events/${evt.id}`}>
                    <Button variant="ghost" size="sm" icon={Eye}>
                      Preview
                    </Button>
                  </Link>
                  <Link to={`/admin/events/${evt.id}/edit`}>
                    <Button variant="outline" size="sm" icon={Edit2}>
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-700 hover:bg-rose-50"
                    icon={Trash2}
                    onClick={() => handleOpenDelete(evt)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event?"
        message={`Are you sure you want to delete '${eventToDelete?.title}'? This action cannot be undone.`}
        confirmText="Yes, Delete Event"
        variant="danger"
        isProcessing={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
