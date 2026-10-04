import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/api';
import { 
  CreditCard, 
  Calendar, 
  Ticket as TicketIcon, 
  GraduationCap, 
  QrCode, 
  MapPin, 
  Megaphone, 
  ArrowRight,
  ShieldCheck,
  Shield,
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

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[var(--coffee-brown)] to-[var(--ink-brown)] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-[var(--sand)]" />
            <span>
              Student Member {user?.role && user.role !== 'MEMBER' ? `• ${user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'TREASURER' ? 'Treasurer' : user.role === 'MERCHANDISE' ? 'Merchandise Manager' : 'Volunteer'}` : 'Portal'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-[var(--sand)]/80 mt-1">
            {user?.department ? `${user.department} • ` : ''} Student ID: {user?.student_id || 'STU-XXXX'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user?.role && user.role !== 'MEMBER' && (
            <Link to="/admin">
              <Button variant="clay" size="sm" icon={Shield} className="font-bold border border-white/20 shadow-xs">
                Open {user.role === 'TREASURER' ? 'Treasurer' : user.role === 'MERCHANDISE' ? 'Merch' : user.role === 'VOLUNTEER' ? 'Volunteer' : 'Admin'} Console
              </Button>
            </Link>
          )}
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
              <h3 className="text-lg font-bold text-[var(--ink-brown)] flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-[var(--coffee-brown)]" />
                My Event Passes
              </h3>
              <Link to="/my-tickets" className="text-xs font-bold text-[var(--coffee-brown)] hover:underline">
                View All
              </Link>
            </div>

            {tickets.length === 0 ? (
              <Card padding="lg" className="text-center py-8">
                <p className="text-xs text-[var(--warm-gray)] mb-3">You have no active event tickets.</p>
                <Link to="/events">
                  <Button size="sm" variant="primary">Explore Events</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 3).map((t) => (
                  <Card key={t.id} padding="default" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[var(--coffee-brown)]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[var(--coffee-brown)]">{t.ticket_number}</span>
                        <Badge variant={t.status === 'USED' ? 'success' : 'coffee'} size="sm">
                          {t.status === 'USED' ? '✓ Checked In' : 'Active Pass'}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-[var(--ink-brown)]">{t.event?.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-[var(--warm-gray)] pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[var(--clay-brown)]" />
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
              <h3 className="text-lg font-bold text-[var(--ink-brown)] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[var(--clay-brown)]" />
                Campus Announcements
              </h3>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <Card key={ann.id} padding="default">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-bold text-[var(--ink-brown)]">{ann.title}</h4>
                    <Badge variant={ann.priority === 'HIGH' || ann.priority === 'URGENT' ? 'danger' : 'coffee'} size="sm">
                      {ann.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--warm-gray)] leading-relaxed">
                    {ann.content}
                  </p>
                  <span className="text-[10px] text-[var(--warm-gray)]/70 mt-2 block">
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
          <Card padding="lg" className="border-2 border-[var(--coffee-brown)]/30 bg-gradient-to-b from-[var(--cream)] to-white">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--sand)]">
              <span className="text-xs font-bold text-[var(--coffee-brown)] uppercase tracking-wider">
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
                    <h4 className="text-lg font-extrabold text-[var(--ink-brown)]">{membership.plan_name}</h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      ✓ Unlocks {membership.discount_percentage}% discount on campus events
                    </p>
                  </div>

                  <div className="p-3 bg-[var(--cream)] border border-[var(--sand)] rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-[var(--warm-gray)]">
                      <span>Valid until:</span>
                      <strong className="text-[var(--ink-brown)]">{format(new Date(membership.end_date), 'MMM d, yyyy')}</strong>
                    </div>
                    <div className="flex justify-between text-[var(--warm-gray)]">
                      <span>Days Remaining:</span>
                      <strong className="text-[var(--coffee-brown)]">{membership.days_remaining} Days</strong>
                    </div>
                  </div>

                  {membership.benefits?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-[var(--ink-brown)] uppercase tracking-wider block">Benefits:</span>
                      {membership.benefits.map((b, idx) => (
                        <div key={idx} className="text-xs text-[var(--warm-gray)] flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <CreditCard className="w-10 h-10 text-[var(--warm-gray)]/40 mx-auto" />
                  <p className="text-xs text-[var(--warm-gray)]">
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
            <h4 className="text-xs font-bold text-[var(--ink-brown)] uppercase tracking-wider mb-3">
              Quick Shortcuts
            </h4>
            <div className="space-y-2">
              <Link to="/events" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--sand)] hover:bg-[var(--cream)] text-xs font-semibold text-[var(--ink-brown)] transition-colors">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[var(--coffee-brown)]" /> Browse Upcoming Events</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--warm-gray)]" />
              </Link>
              <Link to="/my-tickets" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--sand)] hover:bg-[var(--cream)] text-xs font-semibold text-[var(--ink-brown)] transition-colors">
                <span className="flex items-center gap-2"><QrCode className="w-4 h-4 text-[var(--coffee-brown)]" /> View Digital Passes</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--warm-gray)]" />
              </Link>
              <Link to="/membership" className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--sand)] hover:bg-[var(--cream)] text-xs font-semibold text-[var(--ink-brown)] transition-colors">
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-[var(--clay-brown)]" /> Manage Membership</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--warm-gray)]" />
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
