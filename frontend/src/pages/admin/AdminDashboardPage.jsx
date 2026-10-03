import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  Ticket as TicketIcon, 
  QrCode, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard, Skeleton } from '../../components/common/UiHelpers';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useSocket();

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getAdminDashboard();
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Subscribe to all real-time events to auto-update dashboard
    const unsub1 = subscribe('ticket_purchased', fetchDashboard);
    const unsub2 = subscribe('attendance_updated', fetchDashboard);
    const unsub3 = subscribe('inventory_updated', fetchDashboard);
    const unsub4 = subscribe('finance_updated', fetchDashboard);
    const unsub5 = subscribe('order_created', fetchDashboard);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [subscribe]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const needsAttention = data?.needs_attention || [];
  const revenueSources = data?.revenue_by_source || [];
  const monthlyTrend = data?.monthly_trend || [];
  const eventsPerformance = data?.events_performance || [];
  const recentActivity = data?.recent_activity || [];

  const PIE_COLORS = ['#6B4A38', '#8B6353', '#7A6A5E', '#2A1E18', '#A08070'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Organization Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Real-time overview of members, ticketing attendance, merchandise inventory, and accounting balance
          </p>
        </div>

        <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchDashboard}>
          Refresh Live Data
        </Button>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Members"
          value={stats.total_members || 0}
          subtitle={`${stats.active_memberships || 0} active subscriptions`}
          icon={Users}
          color="coffee"
        />
        <StatCard
          title="Tickets Sold"
          value={stats.tickets_sold || 0}
          subtitle={`${stats.checked_in_attendance || 0} checked in (${stats.attendance_rate || 0}%)`}
          icon={TicketIcon}
          color="clay"
        />
        <StatCard
          title="Total Income"
          value={`₹${Number(stats.total_income || 0).toLocaleString('en-IN')}`}
          subtitle={`₹${Number(stats.merchandise_revenue || 0).toLocaleString('en-IN')} merchandise sales`}
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Current Net Balance"
          value={`₹${Number(stats.current_balance || 0).toLocaleString('en-IN')}`}
          subtitle={`Total Expenses: ₹${Number(stats.total_expenses || 0).toLocaleString('en-IN')}`}
          icon={Wallet}
          color="coffee"
        />
      </div>

      {/* Dynamic "NEEDS ATTENTION" Section */}
      {needsAttention.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A1E18]">
              Needs Attention ({needsAttention.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {needsAttention.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  item.type === 'urgent'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : item.type === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : 'bg-[#FAF8F5] border-[#E8DCCE] text-[#2A1E18]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold">{item.title}</span>
                    <Badge variant={item.type === 'urgent' ? 'danger' : 'warning'} size="sm">
                      Action Required
                    </Badge>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-black/5 flex justify-end">
                  <Link
                    to={item.action_url}
                    className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                  >
                    <span>{item.action_text}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income vs Expense (2 cols) */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-[#2A1E18]">Financial Growth (6-Month Trend)</h3>
              <p className="text-xs text-[#7A6A5E]">Comparison of monthly income and expenses in INR</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7A6A5E' }} />
                <YAxis tick={{ fontSize: 11, fill: '#7A6A5E' }} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#2A1E18', color: '#FAF8F5', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income (₹)" fill="#6B4A38" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses (₹)" fill="#8B6353" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by Source (1 col) */}
        <Card padding="lg">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#2A1E18]">Revenue by Stream</h3>
            <p className="text-xs text-[#7A6A5E]">Source breakdown</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueSources.filter(s => s.amount > 0)}
                  dataKey="amount"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {revenueSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#2A1E18', color: '#FAF8F5', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#E8DCCE] text-xs">
            {revenueSources.map((item, idx) => (
              <div key={item.source} className="flex items-center justify-between text-[#7A6A5E]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {item.source}:
                </span>
                <span className="font-semibold text-[#2A1E18]">₹{Number(item.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Lower Row: Event Performance & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Performance (2 cols) */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#2A1E18]">Event Attendance & Capacity</h3>
              <p className="text-xs text-[#7A6A5E]">Real-time tickets and check-in numbers</p>
            </div>
            <Link to="/admin/attendance" className="text-xs font-bold text-[#6B4A38] hover:underline">
              Check-In Station →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                  <th className="pb-2">Event Title</th>
                  <th className="pb-2">Capacity</th>
                  <th className="pb-2">Tickets Sold</th>
                  <th className="pb-2">Checked In</th>
                  <th className="pb-2 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {eventsPerformance.map((evt) => {
                  const rate = evt.tickets_sold > 0 ? Math.round((evt.checked_in / evt.tickets_sold) * 100) : 0;
                  return (
                    <tr key={evt.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-2.5 font-bold text-[#2A1E18]">{evt.title}</td>
                      <td className="py-2.5 text-[#7A6A5E]">{evt.capacity} seats</td>
                      <td className="py-2.5 font-semibold text-[#2A1E18]">{evt.tickets_sold}</td>
                      <td className="py-2.5 font-semibold text-emerald-800">{evt.checked_in}</td>
                      <td className="py-2.5 text-right font-bold text-[#6B4A38]">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Activity Stream (1 col) */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#2A1E18]">Live Activity Trail</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {recentActivity.map((act) => (
              <div key={act.id} className="text-xs space-y-0.5 border-b border-[#E8DCCE]/40 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2A1E18]">{act.user_name}</span>
                  <span className="text-[10px] text-[#7A6A5E] font-mono">
                    {format(new Date(act.timestamp), 'h:mm a')}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6A5E]">
                  {act.action?.replace(/_/g, ' ')} on {act.entity}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
