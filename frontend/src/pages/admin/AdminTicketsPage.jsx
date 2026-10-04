import React, { useState, useEffect } from 'react';
import { ticketService, eventService, authService, extractDataArray } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Search, QrCode, Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { QRModal } from '../../components/common/QRModal';
import { toast } from 'sonner';

export const AdminTicketsPage = () => {
  const { subscribe } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Issue Ticket Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    event_id: '',
    user_id: '',
    user_email: '',
    ticket_type: 'REGULAR',
    price: '',
  });

  const fetchTickets = async () => {
    try {
      const res = await ticketService.getTickets({
        search,
        status: statusFilter || undefined,
      });
      setTickets(extractDataArray(res));
    } catch {
      toast.error('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventsAndUsers = async () => {
    try {
      const [evtsRes, usersRes] = await Promise.all([
        eventService.getEvents(),
        authService.getUsers(),
      ]);
      setEvents(extractDataArray(evtsRes));
      setUsers(extractDataArray(usersRes));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEventsAndUsers();
    const unsub = subscribe('ticket_purchased', () => {
      fetchTickets();
    });
    return unsub;
  }, [subscribe]);

  const handleOpenCreateModal = () => {
    setFormData({
      event_id: events.length > 0 ? String(events[0].id) : '',
      user_id: users.length > 0 ? String(users[0].id) : '',
      user_email: '',
      ticket_type: 'REGULAR',
      price: events.length > 0 ? String(events[0].non_member_price) : '0',
    });
    setCreateModalOpen(true);
  };

  const handleEventChange = (eventId) => {
    const evt = events.find((e) => String(e.id) === String(eventId));
    setFormData((prev) => ({
      ...prev,
      event_id: eventId,
      price: evt ? (prev.ticket_type === 'MEMBER' ? String(evt.member_price) : String(evt.non_member_price)) : prev.price
    }));
  };

  const handleTicketTypeChange = (type) => {
    const evt = events.find((e) => String(e.id) === String(formData.event_id));
    setFormData((prev) => ({
      ...prev,
      ticket_type: type,
      price: evt ? (type === 'MEMBER' ? String(evt.member_price) : String(evt.non_member_price)) : prev.price
    }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.event_id) {
      toast.error('Please select an event.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        event_id: parseInt(formData.event_id),
        user_id: formData.user_id ? parseInt(formData.user_id) : undefined,
        user_email: formData.user_email || undefined,
        ticket_type: formData.ticket_type,
        price: formData.price,
      };

      const res = await ticketService.createTicket(payload);
      toast.success(res.message || 'Ticket issued successfully!');
      setCreateModalOpen(false);
      fetchTickets();
    } catch (err) {
      toast.error(err.message || 'Failed to issue ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQR = (t) => {
    setSelectedTicket(t);
    setQrModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Issued Tickets & Passes
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Master registry of attendee tickets, complimentary passes, and QR verification tokens
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreateModal}
          className="font-bold"
        >
          Issue New Ticket
        </Button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-[#E8DCCE]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A5E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket number, student name, email, event title..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">Active / Confirmed</option>
          <option value="USED">Used / Checked In</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Tickets Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A6A5E]">
            No tickets found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Ticket Number</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Attendee</th>
                  <th className="py-3 px-4">Pass Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">QR Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF8F5]/80">
                    <td className="py-3 px-4 font-mono font-bold text-[#6B4A38]">
                      {t.ticket_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2A1E18]">
                      {t.event?.title || 'Event'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2A1E18]">{t.user?.name}</div>
                      <div className="text-[11px] text-[#7A6A5E]">{t.user?.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#2A1E18]">
                        {t.ticket_type === 'MEMBER' ? 'Member Rate' : 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2A1E18]">
                      ₹{Number(t.price).toFixed(0)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={t.status === 'USED' ? 'success' : t.status === 'CANCELLED' ? 'danger' : 'coffee'}
                        size="sm"
                      >
                        {t.status === 'USED' ? '✓ Checked In' : t.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={QrCode}
                        onClick={() => handleOpenQR(t)}
                      >
                        View QR
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Issue Ticket Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Issue Event Ticket / Pass"
        subtitle="Manually grant or register an attendee ticket with QR code"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Select Campus Event *
            </label>
            <select
              value={formData.event_id}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              required
            >
              <option value="">Select Event...</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.seats_remaining} seats remaining)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Select Registered Student Member
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
            >
              <option value="">Select Existing Member...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — {u.department || 'General'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Or Enter Attendee Email (If not in list)
            </label>
            <Input
              type="email"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              placeholder="e.g. attendee@campus.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Pass Type
              </label>
              <select
                value={formData.ticket_type}
                onChange={(e) => handleTicketTypeChange(e.target.value)}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="REGULAR">Regular Pass</option>
                <option value="MEMBER">Member Discounted Pass</option>
                <option value="VIP">VIP / Guest Pass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Amount Charged (₹)
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0 for complimentary"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
              Issue Pass & Generate QR
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Pass Viewer */}
      {selectedTicket && (
        <QRModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
};
