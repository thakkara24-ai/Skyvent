import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService, ticketService } from '../../services/api';
import { 
  CreditCard, 
  Calendar, 
  Ticket as TicketIcon, 
  ShoppingBag, 
  Sparkles, 
  QrCode, 
  Clock, 
  MapPin, 
  Megaphone, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard, Skeleton } from '../../components/common/UiHelpers';
import { QRModal } from '../../components/common/QRModal';
import { format } from 'date-fns';

export const MemberDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getMemberDashboard();
      if (res) setData(res.data || res);
    } catch (err) {
      console.error('Failed to load member dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openQrModal = (ticket) => {
    setSelectedTicket(ticket);
    setQrModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const membership = data?.membership;
  const tickets = data?.tickets || [];
  const announcements = data?.announcements || [];
  const recentOrders = data?.recent_orders || [];
  const upcomingEvents = data?.upcoming_events || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#6B4A38] to-[#2A1E18] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Student Member Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-[#E8DCCE]/80 mt-1">
            {user?.department ? `${user.department} • ` : ''} Student ID: {user?.student_id || 'STU-XXXX'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/events">
            <Button variant="secondary" size="sm" icon={Calendar}>
              Explore Events
            </Button>
          </Link>
          <Link to="/membership">
            <Button variant="clay" size="sm" icon={CreditCard}>
              Membership Pass
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Active Passes"
          value={tickets.filter(t => t.status === 'CONFIRMED').length}
          subtitle="Ready for upcoming entry"
          icon={TicketIcon}
          color="coffee"
        />
        <StatCard
          title="Events Attended"
          value={tickets.filter(t => t.status === 'USED').length}
          subtitle="Checked in successfully"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Membership Status"
          value={membership ? 'Active Member' : 'Standard'}
          subtitle={membership ? `${membership.days_remaining} days remaining` : 'No active subscription'}
          icon={ShieldCheck}
          color={membership ? 'clay' : 'coffee'}
        />
      </div>

      {/* Main Grid: Membership + Digital Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Active Tickets & Announcements */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Tickets with Live QR view */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2A1E18] flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-[#6B4A38]" />
                My Event Passes
              </h3>
              <Link to="/my-tickets" className="text-xs font-bold text-[#6B4A38] hover:underline">
                View All
              </Link>
            </div>

            {tickets.length === 0 ? (
              <Card padding="lg" className="text-center py-8">
                <p className="text-xs text-[#7A6A5E] mb-3">You have no active event tickets.</p>
                <Link to="/events">
                  <Button size="sm" variant="primary">Explore Events</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 3).map((t) => (
                  <Card key={t.id} padding="default" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[#6B4A38]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#6B4A38]">{t.ticket_number}</span>
                        <Badge variant={t.status === 'USED' ? 'success' : 'coffee'} size="sm">
                          {t.status === 'USED' ? '✓ Checked In' : 'Active Pass'}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-[#2A1E18]">{t.event?.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-[#7A6A5E] pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8B6353]" />
                          {t.event?.venue}
                        </span>
                        <span>Pass: {t.ticket_type === 'MEMBER' ? 'Member Rate' : 'Standard'}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      icon={QrCode}
                      onClick={() => openQrModal(t)}
                    >
                      Show QR Pass
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Campus Announcements */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#2A1E18] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#8B6353]" />
                Campus Announcements
              </h3>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <Card key={ann.id} padding="default">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-bold text-[#2A1E18]">{ann.title}</h4>
                    <Badge variant={ann.priority === 'HIGH' || ann.priority === 'URGENT' ? 'danger' : 'coffee'} size="sm">
                      {ann.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7A6A5E] leading-relaxed">
                    {ann.content}
                  </p>
                  <span className="text-[10px] text-[#7A6A5E]/70 mt-2 block">
                    Posted on {format(new Date(ann.published_at), 'MMMM d, yyyy')}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Membership Pass Card & Quick Links */}
        <div className="space-y-6">
          {/* Membership Card */}
          <Card padding="lg" className="border-2 border-[#6B4A38]/30 bg-gradient-to-b from-[#FAF8F5] to-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCE]">
              <span className="text-xs font-bold text-[#6B4A38] uppercase tracking-wider">
                Official Membership
              </span>
              <Badge variant={membership ? 'success' : 'default'} size="sm">
                {membership ? 'ACTIVE' : 'NO PLAN'}
              </Badge>
            </div>

            <div className="py-4 space-y-3">
              {membership ? (
                <>
                  <div>
                    <h4 className="text-lg font-extrabold text-[#2A1E18]">{membership.plan_name}</h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      ✓ Unlocks {membership.discount_percentage}% discount on campus events
                    </p>
                  </div>

                  <div className="p-3 bg-[#FAF8F5] border border-[#E8DCCE] rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-[#7A6A5E]">
                      <span>Valid until:</span>
                      <strong className="text-[#2A1E18]">{format(new Date(membership.end_date), 'MMM d, yyyy')}</strong>
                    </div>
                    <div className="flex justify-between text-[#7A6A5E]">
                      <span>Days Remaining:</span>
                      <strong className="text-[#6B4A38]">{membership.days_remaining} Days</strong>
                    </div>
                  </div>

                  {membership.benefits?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-[#2A1E18] uppercase tracking-wider block">Benefits:</span>
                      {membership.benefits.map((b, idx) => (
                        <div key={idx} className="text-xs text-[#7A6A5E] flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <CreditCard className="w-10 h-10 text-[#7A6A5E]/40 mx-auto" />
                  <p className="text-xs text-[#7A6A5E]">
                    You do not have an active membership plan. Subscribe to unlock member-only pricing and early registrations.
                  </p>
                  <Link to="/membership">
                    <Button size="sm" variant="primary" className="w-full">
                      Choose a Plan
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card padding="default">
            <h4 className="text-xs font-bold text-[#2A1E18] uppercase tracking-wider mb-3">
              Quick Shortcuts
            </h4>
            <div className="space-y-2">
              <Link to="/events" className="flex items-center justify-between p-2.5 rounded-lg border border-[#E8DCCE] hover:bg-[#FAF8F5] text-xs font-semibold text-[#2A1E18] transition-colors">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#6B4A38]" /> Browse Upcoming Events</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A6A5E]" />
              </Link>
              <Link to="/my-tickets" className="flex items-center justify-between p-2.5 rounded-lg border border-[#E8DCCE] hover:bg-[#FAF8F5] text-xs font-semibold text-[#2A1E18] transition-colors">
                <span className="flex items-center gap-2"><QrCode className="w-4 h-4 text-[#6B4A38]" /> View Digital Passes</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A6A5E]" />
              </Link>
              <Link to="/membership" className="flex items-center justify-between p-2.5 rounded-lg border border-[#E8DCCE] hover:bg-[#FAF8F5] text-xs font-semibold text-[#2A1E18] transition-colors">
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#8B6353]" /> Manage Membership</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#7A6A5E]" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};
