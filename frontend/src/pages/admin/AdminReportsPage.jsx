import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { BarChart3, Download, Calendar, TrendingUp, TrendingDown, Users, ShoppingBag, Ticket } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

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
    a.download = `skyvent-report-${range}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success('Report JSON downloaded.');
  };

  const PIE_COLORS = ['#6B4A38', '#8B6353', '#7A6A5E', '#2A1E18', '#A08070', '#C2B4A6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Analytical Reports & Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Generate customized time-range reports for student council auditing and executive meetings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E8DCCE]">
            {[
              { key: 'today', label: 'Today' },
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
              { key: 'this_month', label: 'This Month' },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  range === r.key
                    ? 'bg-[#6B4A38] text-white'
                    : 'text-[#7A6A5E] hover:text-[#2A1E18]'
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
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card padding="default">
              <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Period Income</span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1 block">
                ₹{Number(report?.income || 0).toLocaleString('en-IN')}
              </span>
            </Card>

            <Card padding="default">
              <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Period Expenses</span>
              <span className="text-xl sm:text-2xl font-extrabold text-rose-800 mt-1 block">
                ₹{Number(report?.expenses || 0).toLocaleString('en-IN')}
              </span>
            </Card>

            <Card padding="default">
              <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Net Period Balance</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#6B4A38] mt-1 block">
                ₹{Number(report?.net || 0).toLocaleString('en-IN')}
              </span>
            </Card>

            <Card padding="default">
              <span className="text-[11px] font-bold text-[#7A6A5E] uppercase tracking-wider block">Activity Count</span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#2A1E18] mt-1 block">
                {report?.tickets_sold || 0} Passes / {report?.orders_count || 0} Orders
              </span>
            </Card>
          </div>

          {/* Breakdown Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            <Card padding="lg">
              <h3 className="text-base font-bold text-[#2A1E18] mb-4">Revenue Stream Breakdown</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report?.income_breakdown || []}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {(report?.income_breakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Expense Breakdown */}
            <Card padding="lg">
              <h3 className="text-base font-bold text-[#2A1E18] mb-4">Expense Categories Breakdown</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report?.expense_breakdown || []}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {(report?.expense_breakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
