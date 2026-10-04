import React, { useState, useEffect } from 'react';
import { ticketService, extractDataArray } from '../../services/api';
import { Ticket as TicketIcon, QrCode, Calendar, MapPin, Download } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { QRModal } from '../../components/common/QRModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const MyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchTickets = async () => {
    try {
      const res = await ticketService.getTickets({ status: statusFilter !== 'ALL' ? statusFilter : undefined });
      setTickets(extractDataArray(res));
    } catch {
      toast.error('Could not load your tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleOpenQR = (ticket) => {
    setSelectedTicket(ticket);
    setQrModalOpen(true);
  };

  const handleDownloadPdf = async (ticket) => {
    setDownloadingId(ticket.id);
    try {
      const response = await ticketService.downloadTicketPdf(ticket.id);
      const blob = new Blob([response.data || response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SKYVENT_Pass_${ticket.ticket_number || ticket.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Ticket PDF downloaded.');
    } catch {
      toast.error('Failed to download ticket PDF pass.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenCancel = (ticket) => {
    setTicketToCancel(ticket);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!ticketToCancel) return;
    setIsCancelling(true);
    try {
      await ticketService.cancelTicket(ticketToCancel.id);
      toast.success(`Ticket #${ticketToCancel.ticket_number} cancelled.`);
      setCancelModalOpen(false);
      fetchTickets();
    } catch (err) {
      toast.error(err.message || 'Could not cancel ticket.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            My Event Passes
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            View your digital QR entrance tickets and attendance history
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#E8DCCE]">
          {['ALL', 'CONFIRMED', 'USED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#6B4A38] text-white'
                  : 'text-[#7A6A5E] hover:text-[#2A1E18]'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'CONFIRMED' ? 'Active' : st === 'USED' ? 'Attended' : 'Cancelled'}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No passes found"
          description="You don't have any tickets under this category."
          actionText="Explore Campus Events"
          onAction={() => window.location.href = '/events'}
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const event = ticket.event || {};
            let formattedDate = 'Upcoming';
            try {
              formattedDate = format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy • h:mm a');
            } catch {
              // ignore
            }

            const isUsed = ticket.status === 'USED';
            const isCancelled = ticket.status === 'CANCELLED';

            return (
              <Card
                key={ticket.id}
                padding="lg"
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-l-4 ${
                  isUsed
                    ? 'border-l-emerald-600'
                    : isCancelled
                    ? 'border-l-rose-500 opacity-75'
                    : 'border-l-[#6B4A38]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#6B4A38]">
                      {ticket.ticket_number}
                    </span>
                    <Badge
                      variant={isUsed ? 'success' : isCancelled ? 'danger' : 'coffee'}
                      size="sm"
                    >
                      {isUsed ? '✓ Attended' : isCancelled ? 'Cancelled' : 'Active Pass'}
                    </Badge>
                    <span className="text-[11px] text-[#7A6A5E]">
                      Pass: {ticket.ticket_type === 'MEMBER' ? 'Member Rate' : 'Standard'} (₹{Number(ticket.price).toFixed(0)})
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#2A1E18]">
                    {event.title || 'Campus Event'}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#7A6A5E]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8B6353]" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8B6353]" />
                      {event.venue}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isCancelled && (
                    <>
                      <Button
                        variant="primary"
                        size="md"
                        icon={QrCode}
                        onClick={() => handleOpenQR(ticket)}
                      >
                        Show QR Pass
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        icon={Download}
                        isLoading={downloadingId === ticket.id}
                        onClick={() => handleDownloadPdf(ticket)}
                        title="Download PDF Pass"
                      >
                        PDF
                      </Button>
                    </>
                  )}

                  {!isUsed && !isCancelled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-700 hover:bg-rose-50"
                      onClick={() => handleOpenCancel(ticket)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={selectedTicket}
      />

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Ticket Reservation?"
        message={`Are you sure you want to cancel ticket #${ticketToCancel?.ticket_number} for '${ticketToCancel?.event?.title}'? A refund transaction will be logged.`}
        confirmText="Yes, Cancel Ticket"
        variant="danger"
        isProcessing={isCancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};
