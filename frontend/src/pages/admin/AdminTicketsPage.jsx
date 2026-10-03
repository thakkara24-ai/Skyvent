import React, { useState, useEffect } from 'react';
import { ticketService } from '../../services/api';
import { Ticket as TicketIcon, Search, QrCode, Filter } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { QRModal } from '../../components/common/QRModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await ticketService.getTickets({
        search,
        status: statusFilter || undefined,
      });
      if (res.data) setTickets(res.data.results || res.data);
    } catch {
      toast.error('Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const handleOpenQR = (t) => {
    setSelectedTicket(t);
    setQrModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          Issued Tickets & Passes
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Master registry of all attendee passes, check-in statuses, and QR verification codes
        </p>
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
                        Pass
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};
