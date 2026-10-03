import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService, ticketService } from '../../services/api';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket as TicketIcon, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  QrCode, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { DemoPaymentModal } from '../../components/common/DemoPaymentModal';
import { QRModal } from '../../components/common/QRModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);

  const fetchEvent = async () => {
    try {
      const res = await eventService.getEvent(id);
      if (res.data) {
        setEvent(res.data);
        if (res.data.user_ticket) {
          setCurrentTicket(res.data.user_ticket);
        }
      }
    } catch (err) {
      toast.error('Could not load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleOpenPayment = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in or register to purchase tickets.');
      navigate('/login');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const res = await ticketService.purchaseTicket(event.id);
      if (res.data) {
        toast.success(`Ticket confirmed! Pass #${res.data.ticket_number}`);
        setPaymentModalOpen(false);
        setCurrentTicket(res.data);
        setQrModalOpen(true);
        fetchEvent();
      }
    } catch (err) {
      toast.error(err.message || 'Ticket purchase could not be completed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h3 className="text-lg font-bold text-[#2A1E18]">Event not found</h3>
        <Link to="/events" className="mt-4 inline-block">
          <Button variant="primary" icon={ArrowLeft}>Back to Events</Button>
        </Link>
      </div>
    );
  }

  let formattedStart = 'Date TBA';
  let formattedEnd = '';
  try {
    formattedStart = format(new Date(event.start_datetime), 'EEEE, MMMM d, yyyy • h:mm a');
    formattedEnd = format(new Date(event.end_datetime), 'h:mm a');
  } catch {
    // ignore
  }

  const isMember = user?.has_active_membership;
  const applicablePrice = event.applicable_price !== undefined ? event.applicable_price : (isMember ? Number(event.member_price) : Number(event.non_member_price));
  const memberDiscount = isMember ? Math.max(0, Number(event.non_member_price) - Number(event.member_price)) : 0;
  const isFull = event.seats_remaining <= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6A5E] hover:text-[#2A1E18]">
        <ArrowLeft className="w-4 h-4" /> Back to all events
      </Link>

      {/* Cover Banner */}
      <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden bg-[#2A1E18] border border-[#E8DCCE]">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <Calendar className="w-20 h-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="clay" size="sm">
              {event.category}
            </Badge>
            {isFull && <Badge variant="danger" size="sm">Fully Booked</Badge>}
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h3 className="text-lg font-bold text-[#2A1E18] mb-3">Event Details</h3>
            <p className="text-sm text-[#7A6A5E] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E8DCCE]">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#8B6353] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#2A1E18] block">Date & Time</span>
                  <span className="text-[#7A6A5E]">{formattedStart} - {formattedEnd}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#8B6353] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#2A1E18] block">Venue</span>
                  <span className="text-[#7A6A5E]">{event.venue}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#8B6353] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#2A1E18] block">Capacity</span>
                  <span className="text-[#7A6A5E]">
                    {event.tickets_sold_count} / {event.capacity} registered ({event.seats_remaining} seats remaining)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#8B6353] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#2A1E18] block">Registration Window</span>
                  <span className="text-[#7A6A5E]">
                    Closes {format(new Date(event.registration_close), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Pass & Registration Box */}
        <div className="space-y-4">
          <Card padding="lg" className="border-2 border-[#6B4A38]/30">
            <h3 className="text-base font-bold text-[#2A1E18] pb-3 border-b border-[#E8DCCE]">
              Pass Reservation
            </h3>

            {/* Pricing Comparison */}
            <div className="py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#7A6A5E]">Standard Student:</span>
                <span className="text-sm font-semibold text-[#2A1E18]">
                  ₹{Number(event.non_member_price).toFixed(0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  Active Member Rate:
                </div>
                <span className="text-base font-extrabold text-emerald-800">
                  ₹{Number(event.member_price).toFixed(0)}
                </span>
              </div>

              {!isMember && (
                <p className="text-[11px] text-[#7A6A5E] pt-1">
                  Want the ₹{Number(event.member_price).toFixed(0)} member price?{' '}
                  <Link to="/membership" className="text-[#6B4A38] font-bold hover:underline">
                    Activate Membership
                  </Link>
                </p>
              )}
            </div>

            {/* Action State */}
            {event.user_has_ticket ? (
              <div className="space-y-3 pt-3 border-t border-[#E8DCCE]">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  You have a confirmed pass for this event!
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  icon={QrCode}
                  onClick={() => setQrModalOpen(true)}
                  className="w-full font-bold"
                >
                  View Digital QR Pass
                </Button>
              </div>
            ) : isFull ? (
              <div className="pt-3 border-t border-[#E8DCCE]">
                <Button variant="outline" size="lg" disabled className="w-full opacity-60">
                  Event Fully Booked
                </Button>
              </div>
            ) : (
              <div className="pt-3 border-t border-[#E8DCCE] space-y-2">
                <Button
                  variant="primary"
                  size="lg"
                  icon={TicketIcon}
                  onClick={handleOpenPayment}
                  className="w-full font-bold shadow-sm"
                >
                  Reserve Pass (₹{applicablePrice.toFixed(0)})
                </Button>
                <div className="text-[10px] text-center text-[#7A6A5E]">
                  Demo Payment Simulator • Instant digital pass delivery
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Demo Payment Modal */}
      <DemoPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Reserve Pass: ${event.title}`}
        itemName={event.title}
        itemType="Event Ticket Pass"
        amount={event.non_member_price}
        discount={memberDiscount}
        finalAmount={applicablePrice}
        isProcessing={isProcessingPayment}
        onConfirm={handleConfirmPayment}
      />

      {/* QR Ticket Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={currentTicket ? { ...currentTicket, event, user } : null}
      />
    </div>
  );
};
