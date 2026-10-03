import React, { useState, useEffect } from 'react';
import { eventService, attendanceService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Clock, 
  Sparkles, 
  Camera, 
  RotateCcw,
  Volume2,
  Calendar
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminAttendancePage = () => {
  const { subscribe } = useSocket();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check-In Form state
  const [ticketInput, setTicketInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  const fetchEvents = async () => {
    try {
      const res = await eventService.getEvents();
      if (res.data) {
        setEvents(res.data);
        if (res.data.length > 0 && !selectedEventId) {
          setSelectedEventId(String(res.data[0].id));
          setSelectedEvent(res.data[0]);
        }
      }
    } catch {
      toast.error('Failed to load events list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceList = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await attendanceService.getEventAttendance(eventId);
      if (res.data) setAttendances(res.data.results || res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const evt = events.find((e) => String(e.id) === String(selectedEventId));
      setSelectedEvent(evt || null);
      fetchAttendanceList(selectedEventId);
    }
  }, [selectedEventId, events]);

  // Real-time listener for attendance updates
  useEffect(() => {
    const unsub = subscribe('attendance_updated', (data) => {
      if (String(data.event_id) === String(selectedEventId)) {
        fetchAttendanceList(selectedEventId);
        // Update local event counter
        setSelectedEvent((prev) => prev ? {
          ...prev,
          checked_in_count: data.checked_in_count,
          tickets_sold_count: data.tickets_sold_count
        } : prev);
      }
    });
    return unsub;
  }, [selectedEventId, subscribe]);

  const handlePerformCheckIn = async (inputCode, method = 'MANUAL') => {
    const code = (inputCode || ticketInput).trim();
    if (!code) {
      toast.error('Please enter a ticket number or scan a QR code.');
      return;
    }

    setIsProcessing(true);
    setCheckInResult(null);

    const isQr = code.startsWith('SKY_QR_');
    const payload = {
      event_id: selectedEventId ? parseInt(selectedEventId) : undefined,
      method: isQr ? 'QR' : method,
      ...(isQr ? { qr_token: code } : { ticket_number: code })
    };

    try {
      const res = await attendanceService.checkIn(payload);
      if (res.data) {
        setCheckInResult({
          success: true,
          data: res.data,
          message: res.message
        });
        toast.success(`✓ Check-In: Welcome ${res.data.attendee_name}!`);
        setTicketInput('');
        fetchAttendanceList(selectedEventId);
      }
    } catch (err) {
      setCheckInResult({
        success: false,
        message: err.message || 'Check-in validation failed.',
        code: err.code,
        errors: err.errors
      });
      toast.error(err.message || 'Check-in rejected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateQRScan = (qrCode) => {
    handlePerformCheckIn(qrCode, 'QR');
  };

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const checkedInCount = selectedEvent?.checked_in_count || 0;
  const ticketsSoldCount = selectedEvent?.tickets_sold_count || 0;
  const rate = ticketsSoldCount > 0 ? Math.round((checkedInCount / ticketsSoldCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Event Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Digital Verification Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Event Check-In Station
          </h1>
        </div>

        <div className="w-full sm:w-72">
          <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
            Active Event Desk
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({evt.checked_in_count || 0}/{evt.tickets_sold_count || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Attendance Metric Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="default" className="text-center">
          <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Checked In</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{checkedInCount}</span>
        </Card>
        <Card padding="default" className="text-center">
          <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Total Passes Sold</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18]">{ticketsSoldCount}</span>
        </Card>
        <Card padding="default" className="text-center">
          <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Attendance Rate</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#6B4A38]">{rate}%</span>
        </Card>
        <Card padding="default" className="text-center">
          <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Venue Capacity</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#7A6A5E]">{selectedEvent?.capacity || 0}</span>
        </Card>
      </div>

      {/* Main Check-In Work Area (Scanner + Results + Live Log) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Scanner & Manual Verification Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card padding="lg" className="border-2 border-[#6B4A38]/30">
            <h3 className="text-base font-bold text-[#2A1E18] mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#6B4A38]" />
              Scan QR Pass or Enter Ticket Number
            </h3>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePerformCheckIn(ticketInput, 'MANUAL');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1.5">
                  Ticket # / QR Identifier
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    placeholder="e.g. SKY-EVT-2026-0001 or SKY_QR_..."
                    className="flex-1 px-3.5 py-2.5 text-sm font-mono font-bold bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:border-[#6B4A38] focus:bg-white focus:outline-none"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isProcessing}
                    className="font-bold shrink-0"
                  >
                    Verify Pass
                  </Button>
                </div>
              </div>
            </form>

            {/* Scanner Simulator Buttons for Rapid Testing */}
            <div className="mt-6 pt-5 border-t border-[#E8DCCE] space-y-2">
              <span className="text-xs font-bold text-[#7A6A5E] uppercase tracking-wider block">
                ⚡ Rapid QR Simulator (Quick Test Check-In)
              </span>
              <p className="text-[11px] text-[#7A6A5E]">
                Simulate camera scanner reading digital pass barcodes from student mobile phones:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Camera}
                  onClick={() => handleSimulateQRScan('SKY_QR_WS_001_seedtoken01')}
                >
                  Scan Pass #001
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Camera}
                  onClick={() => handleSimulateQRScan('SKY_QR_WS_002_seedtoken02')}
                >
                  Scan Pass #002
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={Camera}
                  onClick={() => handleSimulateQRScan('SKY_QR_INVALID_TEST')}
                >
                  Scan Invalid Token
                </Button>
              </div>
            </div>
          </Card>

          {/* Validation Status Feedback Banner */}
          {checkInResult && (
            <div
              className={`p-5 rounded-xl border-2 transition-all animate-in fade-in duration-200 ${
                checkInResult.success
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  : 'bg-rose-50 border-rose-500 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {checkInResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold">
                    {checkInResult.success ? 'CHECK-IN GRANTED' : 'ENTRY REJECTED'}
                  </h4>
                  <p className="text-xs font-medium leading-relaxed">
                    {checkInResult.message}
                  </p>

                  {checkInResult.success && checkInResult.data && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-emerald-800 font-medium block">Attendee:</span>
                        <strong className="text-emerald-950">{checkInResult.data.attendee_name}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-medium block">Student ID:</span>
                        <strong className="text-emerald-950">{checkInResult.data.student_id || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-medium block">Pass Type:</span>
                        <strong className="text-emerald-950">{checkInResult.data.ticket_type}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-medium block">Ticket #:</span>
                        <strong className="text-emerald-950 font-mono">{checkInResult.data.ticket_number}</strong>
                      </div>
                    </div>
                  )}

                  {!checkInResult.success && checkInResult.errors && (
                    <div className="mt-2 text-xs text-rose-800">
                      Previous check-in by: <strong>{checkInResult.errors.attendee_name}</strong> ({checkInResult.errors.ticket_number})
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 6 Cols: Live Checked-In Attendees Feed */}
        <div className="lg:col-span-6">
          <Card padding="lg" className="h-full flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCE] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#2A1E18]">Live Checked-In Attendees</h3>
                <p className="text-xs text-[#7A6A5E]">Real-time stream updated via WebSockets</p>
              </div>
              <Badge variant="success" size="sm">
                {attendances.length} Checked In
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-[#E8DCCE]/60 pr-1">
              {attendances.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#7A6A5E]">
                  No attendees checked in for this event yet.
                </div>
              ) : (
                attendances.map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#2A1E18]">{att.user?.name || 'Attendee'}</span>
                        {att.user?.student_id && (
                          <span className="text-[10px] text-[#7A6A5E]">({att.user.student_id})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#7A6A5E]">
                        Pass #{att.ticket?.ticket_number} • Method: <strong>{att.method}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[#6B4A38] font-bold block">
                        {att.checked_in_at ? format(new Date(att.checked_in_at), 'h:mm:ss a') : ''}
                      </span>
                      <span className="text-[10px] text-[#7A6A5E]">
                        by {att.checked_in_by?.name || 'Staff'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
