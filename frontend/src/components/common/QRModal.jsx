import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Clock, Ticket as TicketIcon, User, Printer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const QRModal = ({
  isOpen,
  onClose,
  ticket,
}) => {
  if (!ticket) return null;

  const event = ticket.event || {};
  const user = ticket.user || {};

  const handlePrint = () => {
    window.print();
  };

  let formattedDate = 'Upcoming Date';
  let formattedTime = 'Event Time';
  if (event.start_datetime) {
    try {
      const d = new Date(event.start_datetime);
      formattedDate = format(d, 'EEEE, MMMM d, yyyy');
      formattedTime = format(d, 'h:mm a');
    } catch {
      // ignore
    }
  }

  const isCheckedIn = ticket.status === 'USED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Digital Entry Pass"
      subtitle="Official University Organization Ticket"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-center">
        {/* Pass Container */}
        <div className="bg-[#FAF8F5] border-2 border-dashed border-[#E8DCCE] rounded-2xl p-5 text-left relative overflow-hidden shadow-inner">
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[#E8DCCE] pb-3 mb-4">
            <div>
              <span className="text-[10px] font-black tracking-widest text-[#8B6353] uppercase block">
                SKYVENT PASS
              </span>
              <h4 className="text-base font-bold text-[#2A1E18] leading-tight mt-0.5">
                {event.title || 'Campus Event'}
              </h4>
            </div>
            <Badge
              variant={isCheckedIn ? 'success' : ticket.status === 'CANCELLED' ? 'danger' : 'coffee'}
              size="sm"
            >
              {isCheckedIn ? '✓ CHECKED IN' : ticket.status || 'CONFIRMED'}
            </Badge>
          </div>

          {/* QR Code Center */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#E8DCCE] shadow-xs mb-4">
            <div className="p-2 bg-white rounded-lg">
              <QRCodeSVG
                value={ticket.qr_token || ticket.ticket_number}
                size={160}
                level="H"
                includeMargin={true}
                fgColor="#2A1E18"
              />
            </div>
            <p className="text-[11px] font-mono font-bold text-[#6B4A38] mt-2 tracking-wider">
              {ticket.ticket_number}
            </p>
            <p className="text-[10px] text-[#7A6A5E] mt-0.5">
              Present this QR code at the entrance verification desk
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-2 text-xs border-t border-[#E8DCCE] pt-3">
            <div className="flex items-center text-[#2A1E18] gap-2">
              <User className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
              <span className="font-semibold">{user.name || 'Attendee'}</span>
              {user.student_id && (
                <span className="text-[#7A6A5E] text-[11px]">({user.student_id})</span>
              )}
            </div>
            <div className="flex items-center text-[#2A1E18] gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-[#2A1E18] gap-2">
              <Clock className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center text-[#2A1E18] gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
              <span className="truncate">{event.venue || 'Campus Venue'}</span>
            </div>
          </div>

          {/* Footer Pass metadata */}
          <div className="mt-3 pt-2.5 border-t border-[#E8DCCE] flex items-center justify-between text-[11px] text-[#7A6A5E]">
            <span>Pass Type: <strong className="text-[#2A1E18]">{ticket.ticket_type === 'MEMBER' ? 'Member Pass' : 'Standard Pass'}</strong></span>
            <span>Amount: <strong className="text-[#6B4A38]">₹{Number(ticket.price || 0).toFixed(0)}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handlePrint} icon={Printer}>
            Print Pass
          </Button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
