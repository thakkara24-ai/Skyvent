import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { Download, Ticket, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { toast } from 'sonner';

const CATEGORY_LABELS = {
  FUNDRAISER: 'Fundraising & Donations',
  EVENT_TICKET: 'Event Tickets & Passes',
  MEMBERSHIP: 'Membership Subscriptions',
  MERCHANDISE: 'Merchandise Sales',
  REIMBURSEMENT: 'Volunteer Reimbursements',
  OPERATIONS: 'Club Operations & Logistics',
  CATERING: 'Food & Catering',
  MARKETING: 'Marketing & Publicity',
  OTHER: 'General & Miscellaneous',
};

const REVENUE_COLORS = ['#2A9D8F', '#6B4A38', '#E76F51', '#F4A261', '#457B9D', '#8B6353'];
const EXPENSE_COLORS = ['#E63946', '#F4A261', '#6B4A38', '#2A9D8F', '#1D3557', '#8B6353'];

export const AdminReportsPage = () => {
  const [range, setRange] = useState('30days');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getReports({ range });
      if (res.data) setReport(res.data);
    } catch {
      toast.error('Failed to generate analytical report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skyvent-financial-report-${range}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success('Report JSON downloaded.');
  };

  const incomeItems = report?.income_breakdown || [];
  const totalIncome = incomeItems.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0);

  const expenseItems = report?.expense_breakdown || [];
  const totalExpenses = expenseItems.reduce((acc, i) => acc + parseFloat(i.amount || 0), 0);

  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const amount = parseFloat(item.amount || 0);
      const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
      return (
        <div className="bg-[#2A1E18] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs space-y-1">
          <p className="font-bold text-amber-200">{categoryLabel}</p>
          <p className="font-mono text-sm font-extrabold">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Financial & Governance Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Real-time balance audits, revenue streams, and expense breakdown reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E8DCCE] shadow-xs">
            {[
              { key: 'today', label: 'Today' },
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
              { key: 'this_month', label: 'This Month' },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  range === r.key
                    ? 'bg-[#6B4A38] text-white shadow-xs'
                    : 'text-[#7A6A5E] hover:text-[#2A1E18] hover:bg-[#FAF8F5]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button size="sm" variant="outline" icon={Download} onClick={handleExportJSON}>
            Export JSON
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="default" className="border-l-4 border-l-emerald-600 bg-white">
              <div className="flex items-center justify-between text-[#7A6A5E]">
                <span className="text-xs font-bold uppercase tracking-wider">Total Inflow</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-black text-emerald-700 mt-2 block">
                ₹{Number(report?.income || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#7A6A5E] mt-1 block">Verified income across channels</span>
            </Card>

            <Card padding="default" className="border-l-4 border-l-rose-600 bg-white">
              <div className="flex items-center justify-between text-[#7A6A5E]">
                <span className="text-xs font-bold uppercase tracking-wider">Total Outflow</span>
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-2xl font-black text-rose-700 mt-2 block">
                ₹{Number(report?.expenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#7A6A5E] mt-1 block">Disbursed expenses & operations</span>
            </Card>

            <Card padding="default" className="border-l-4 border-l-[#6B4A38] bg-white">
              <div className="flex items-center justify-between text-[#7A6A5E]">
                <span className="text-xs font-bold uppercase tracking-wider">Net Surplus / Balance</span>
                <Wallet className="w-4 h-4 text-[#6B4A38]" />
              </div>
              <span className="text-2xl font-black text-[#6B4A38] mt-2 block">
                ₹{Number(report?.net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#7A6A5E] mt-1 block">Operating reserve for period</span>
            </Card>

            <Card padding="default" className="border-l-4 border-l-amber-600 bg-white">
              <div className="flex items-center justify-between text-[#7A6A5E]">
                <span className="text-xs font-bold uppercase tracking-wider">Participation Volume</span>
                <Ticket className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-black text-[#2A1E18] mt-2 block">
                {report?.tickets_sold || 0} <span className="text-xs font-semibold text-[#7A6A5E]">Passes</span> / {report?.orders_count || 0} <span className="text-xs font-semibold text-[#7A6A5E]">Orders</span>
              </span>
              <span className="text-[11px] text-[#7A6A5E] mt-1 block">Total verified student checkouts</span>
            </Card>
          </div>

          {/* Breakdown Visualizations with Clean Modern Donut Charts & Legends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Streams */}
            <Card padding="lg" className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#2A1E18]">Revenue Streams Breakdown</h3>
                  <p className="text-xs text-[#7A6A5E]">Income categorized by source</p>
                </div>
                <Badge variant="success" size="sm">₹{Number(report?.income || 0).toLocaleString('en-IN')}</Badge>
              </div>

              {incomeItems.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#7A6A5E]">
                  No revenue transactions recorded for this timeframe.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeItems}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          cornerRadius={6}
                        >
                          {incomeItems.map((entry, index) => (
                            <Cell key={`income-cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Clean Formatted Legend List */}
                  <div className="space-y-2 pt-2 border-t border-[#E8DCCE]">
                    {incomeItems.map((item, idx) => {
                      const color = REVENUE_COLORS[idx % REVENUE_COLORS.length];
                      const val = parseFloat(item.amount || 0);
                      const pct = totalIncome > 0 ? ((val / totalIncome) * 100).toFixed(1) : '0';
                      const label = CATEGORY_LABELS[item.category] || item.category;

                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#FAF8F5]">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-[#2A1E18]">{label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#7A6A5E]">{pct}%</span>
                            <span className="font-extrabold text-[#2A1E18] w-24 text-right">
                              ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Expense Categories */}
            <Card padding="lg" className="bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#2A1E18]">Expense & Reimbursement Breakdown</h3>
                  <p className="text-xs text-[#7A6A5E]">Disbursed operational costs</p>
                </div>
                <Badge variant="danger" size="sm">₹{Number(report?.expenses || 0).toLocaleString('en-IN')}</Badge>
              </div>

              {expenseItems.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-[#7A6A5E]">
                  No expense records found for this timeframe.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseItems}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          cornerRadius={6}
                        >
                          {expenseItems.map((entry, index) => (
                            <Cell key={`expense-cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Clean Formatted Legend List */}
                  <div className="space-y-2 pt-2 border-t border-[#E8DCCE]">
                    {expenseItems.map((item, idx) => {
                      const color = EXPENSE_COLORS[idx % EXPENSE_COLORS.length];
                      const val = parseFloat(item.amount || 0);
                      const pct = totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) : '0';
                      const label = CATEGORY_LABELS[item.category] || item.category;

                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#FAF8F5]">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-[#2A1E18]">{label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#7A6A5E]">{pct}%</span>
                            <span className="font-extrabold text-[#2A1E18] w-24 text-right">
                              ₹{val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
