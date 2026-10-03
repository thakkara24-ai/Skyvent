import React, { useState, useEffect, useRef } from 'react';
import { eventService, attendanceService, extractDataArray } from '../../services/api';
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
  CameraOff,
  Upload,
  RotateCcw,
  Volume2,
  Calendar,
  Image as ImageIcon,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';
import jsQR from 'jsqr';

export const AdminAttendancePage = () => {
  const { subscribe } = useSocket();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Scanner Tab: 'camera' | 'upload' | 'manual'
  const [activeTab, setActiveTab] = useState('camera');

  // Manual Check-In Form state
  const [ticketInput, setTicketInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  // Camera Scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const lastScannedCodeRef = useRef(null);

  const fetchEvents = async () => {
    try {
      const res = await eventService.getEvents();
      const list = extractDataArray(res);
      setEvents(list);
      if (list.length > 0 && !selectedEventId) {
        setSelectedEventId(String(list[0].id));
        setSelectedEvent(list[0]);
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
      setAttendances(extractDataArray(res));
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

  // --------------------------------------------------------------------------
  // Camera Management & Live Stream Decoding
  // --------------------------------------------------------------------------
  const startCamera = async () => {
    setCameraError(null);
    try {
      // Clear any prior stream / intervals first
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try {
          await videoRef.current.play();
        } catch (e) {
          console.log('Video autoplay exception:', e);
        }
      }
      setIsCameraActive(true);

      // Start continuous scanning loop
      scanIntervalRef.current = setInterval(() => {
        scanVideoFrame();
      }, 200);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not available or permission denied. You can use Image Upload or Manual Entry.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const scanVideoFrame = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (code && code.data && code.data !== lastScannedCodeRef.current) {
      lastScannedCodeRef.current = code.data;
      handlePerformCheckIn(code.data, 'QR');
      // Reset lastScannedCode after 3.5 seconds to allow rescanning if needed
      setTimeout(() => {
        lastScannedCodeRef.current = null;
      }, 3500);
    }
  };

  // --------------------------------------------------------------------------
  // QR Image File Upload Decoding (Multi-Scale Robust Detector)
  // --------------------------------------------------------------------------
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Multi-pass attempt: 1) Original scale, 2) Downscaled 800px max, 3) 500px scale
        const tryDecode = (width, height) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          return jsQR(imgData.data, width, height, { inversionAttempts: 'attemptBoth' });
        };

        // Pass 1: Direct scale
        let code = tryDecode(img.width, img.height);

        // Pass 2: Downscale for high-res mobile photos (e.g. 3000px wide)
        if (!code && (img.width > 800 || img.height > 800)) {
          const maxDim = 800;
          const scale = Math.min(maxDim / img.width, maxDim / img.height);
          const scaledW = Math.round(img.width * scale);
          const scaledH = Math.round(img.height * scale);
          code = tryDecode(scaledW, scaledH);
        }

        // Pass 3: Intermediate 1200px scale
        if (!code && (img.width > 1200 || img.height > 1200)) {
          const maxDim = 1200;
          const scale = Math.min(maxDim / img.width, maxDim / img.height);
          code = tryDecode(Math.round(img.width * scale), Math.round(img.height * scale));
        }

        if (code && code.data) {
          toast.info(`QR Pass Decoded: ${code.data.substring(0, 24)}...`);
          handlePerformCheckIn(code.data, 'QR');
        } else {
          toast.error('No readable QR pass found in this image. Please upload a clear photo or screenshot of your ticket pass.');
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
    // Reset file input so re-uploading same file triggers event
    e.target.value = '';
  };

  // --------------------------------------------------------------------------
  // Check-In Execution Flow
  // --------------------------------------------------------------------------
  const handlePerformCheckIn = async (inputCode, method = 'MANUAL') => {
    const rawCode = (inputCode || ticketInput).trim();
    if (!rawCode) {
      toast.error('Please enter a ticket number or scan a QR code.');
      return;
    }

    setIsProcessing(true);
    setCheckInResult(null);

    // Clean leading hash / spaces for ticket numbers
    const cleanCode = rawCode.replace(/^[#\s]+/, '');
    const isQrToken = rawCode.startsWith('SKY_QR_') || rawCode.startsWith('SKYVENT-TKT-') || rawCode.length > 25;

    const payload = {
      event_id: selectedEventId ? parseInt(selectedEventId) : undefined,
      method: isQrToken ? 'QR' : method,
      qr_token: rawCode,
      ticket_number: cleanCode
    };

    try {
      const res = await attendanceService.checkIn(payload);
      if (res.data) {
        setCheckInResult({
          success: true,
          data: res.data,
          message: res.message
        });
        toast.success(`✓ Check-In Granted: Welcome, ${res.data.attendee_name}!`);
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
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-0.5">
            Scan attendee QR passes, upload pass images, or verify ticket numbers in real time
          </p>
        </div>

        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
            Active Event Desk
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none shadow-xs"
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
        {/* Left 6 Cols: Multi-Mode Scanner Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card padding="lg" className="border-2 border-[#6B4A38]/30">
            {/* Scanner Mode Tabs */}
            <div className="flex border-b border-[#E8DCCE] pb-3 mb-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-[#6B4A38] text-white'
                    : 'text-[#7A6A5E] hover:bg-[#FAF8F5]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Live Camera Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-[#6B4A38] text-white'
                    : 'text-[#7A6A5E] hover:bg-[#FAF8F5]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload QR Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-[#6B4A38] text-white'
                    : 'text-[#7A6A5E] hover:bg-[#FAF8F5]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Manual Code
              </button>
            </div>

            {/* Mode 1: Live Video Camera */}
            {activeTab === 'camera' && (
              <div className="space-y-3 text-center">
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-[#E8DCCE]">
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                    playsInline
                    muted
                    autoPlay
                  />

                  {isCameraActive ? (
                    <>
                      {/* Viewfinder Target Box Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-44 h-44 border-2 border-emerald-400 rounded-lg relative">
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />
                          <div className="w-full h-0.5 bg-emerald-400/80 absolute top-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] py-1 px-2 rounded-md">
                        Align attendee QR code pass within the green box
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-white space-y-2">
                      <CameraOff className="w-10 h-10 mx-auto text-[#E8DCCE]/60" />
                      <p className="text-xs text-[#E8DCCE]">Camera is currently turned off.</p>
                      {cameraError && <p className="text-[11px] text-rose-300">{cameraError}</p>}
                      <Button size="sm" variant="outline" onClick={startCamera} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                        Turn On Camera
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[#7A6A5E] px-1">
                  <span>Auto-detect active</span>
                  <Button size="xs" variant="ghost" onClick={isCameraActive ? stopCamera : startCamera}>
                    {isCameraActive ? 'Turn Off Camera' : 'Start Camera'}
                  </Button>
                </div>
              </div>
            )}

            {/* Mode 2: Upload Image of QR Code */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-[#6B4A38]/40 hover:border-[#6B4A38] bg-[#FAF8F5] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <Upload className="w-10 h-10 text-[#6B4A38] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-[#2A1E18]">Click or Drag QR Pass Image Here</span>
                  <span className="text-[11px] text-[#7A6A5E] mt-1">Supports PNG, JPG, Screenshots, Mobile Pass photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Mode 3: Manual Input */}
            {activeTab === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePerformCheckIn(ticketInput, 'MANUAL');
                }}
                className="space-y-3"
              >
                <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider">
                  Ticket Number or QR Token
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
              </form>
            )}

            {/* 1-Click Test Pass Simulators */}
            <div className="mt-5 pt-4 border-t border-[#E8DCCE] space-y-2">
              <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">
                ⚡ Rapid Test Simulations
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={QrCode}
                  onClick={() => handlePerformCheckIn('SKY_QR_WS_001_seedtoken01', 'QR')}
                >
                  Test Pass #001
                </Button>
                <Button
                  size="xs"
                  variant="secondary"
                  icon={QrCode}
                  onClick={() => handlePerformCheckIn('SKY_QR_WS_002_seedtoken02', 'QR')}
                >
                  Test Pass #002
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  icon={QrCode}
                  onClick={() => handlePerformCheckIn('SKY_QR_INVALID_TEST', 'QR')}
                >
                  Test Invalid Pass
                </Button>
              </div>
            </div>
          </Card>

          {/* Validation Status Feedback Banner */}
          {checkInResult && (
            <div
              className={`p-5 rounded-xl border-2 transition-all animate-in fade-in duration-200 ${
                checkInResult.success
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                  : 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {checkInResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold tracking-tight">
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
                    <div className="mt-2 text-xs text-rose-800 font-medium">
                      Already checked in for: <strong>{checkInResult.errors.attendee_name}</strong> ({checkInResult.errors.ticket_number})
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
