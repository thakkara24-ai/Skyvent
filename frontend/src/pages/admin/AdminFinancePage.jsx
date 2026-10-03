import React, { useState, useEffect } from 'react';
import { financeService, extractDataArray } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { ImageUploadInput } from '../../components/common/ImageUploadInput';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminFinancePage = () => {
  const { subscribe } = useSocket();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'claims' | 'summary'

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // New Expense Claim Modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpenseData, setNewExpenseData] = useState({
    title: '',
    amount: '',
    category: 'REIMBURSEMENT',
    description: '',
    receipt: '',
  });

  const fetchData = async () => {
    try {
      const [sRes, tRes, eRes] = await Promise.all([
        financeService.getSummary(),
        financeService.getTransactions(),
        financeService.getExpenses()
      ]);
      if (sRes.data) setSummary(sRes.data);
      setTransactions(extractDataArray(tRes));
      setExpenses(extractDataArray(eRes));
    } catch {
      toast.error('Failed to load finance ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsub = subscribe('finance_updated', () => {
      fetchData();
    });
    return unsub;
  }, [subscribe]);

  const handleOpenReview = (exp, defaultStatus = 'APPROVED') => {
    setSelectedExpense(exp);
    setReviewStatus(defaultStatus);
    setRejectionReason('');
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedExpense) return;
    setIsReviewing(true);
    try {
      await financeService.reviewExpense(selectedExpense.id, {
        status: reviewStatus,
        rejection_reason: rejectionReason,
      });
      toast.success(`Expense claim #${selectedExpense.id} marked as ${reviewStatus.toLowerCase()}.`);
      setReviewModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to review expense.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await financeService.createExpense({
        ...newExpenseData,
        amount: parseFloat(newExpenseData.amount),
      });
      toast.success('Expense claim submitted for approval.');
      setExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to submit claim.');
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-2xl" />;
  }

  const netBalance = summary?.net_balance || 0;
  const totalIncome = summary?.total_income || 0;
  const totalExpenses = summary?.total_expenses || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Treasury & Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Real-time accounting of memberships, ticket sales, merchandise revenue, and volunteer expense reimbursements
          </p>
        </div>

        <Button size="sm" variant="primary" icon={Plus} onClick={() => setExpenseModalOpen(true)}>
          Submit Expense Claim
        </Button>
      </div>

      {/* Summary Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card padding="lg" className="border-l-4 border-l-emerald-600 bg-gradient-to-br from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A5E]">Total Revenue Inflow</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-2">
            ₹{Number(totalIncome).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#7A6A5E] mt-1">Memberships, Tickets, Merch & Campaigns</p>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-rose-600 bg-gradient-to-br from-white to-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A5E]">Total Disbursements</span>
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-800 mt-2">
            ₹{Number(totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#7A6A5E] mt-1">Logistics, Catering, Stage & Claims</p>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-[#6B4A38] bg-gradient-to-br from-white to-[#FAF8F5]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A5E]">Net Available Balance</span>
            <Wallet className="w-5 h-5 text-[#6B4A38]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] mt-2">
            ₹{Number(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-[#7A6A5E] mt-1">
            {summary?.pending_reimbursements_count || 0} pending claim(s) awaiting review
          </p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E8DCCE] pb-2">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#6B4A38] text-white'
              : 'text-[#7A6A5E] hover:bg-[#FAF8F5]'
          }`}
        >
          Transactions Ledger ({transactions.length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'bg-[#6B4A38] text-white'
              : 'text-[#7A6A5E] hover:bg-[#FAF8F5]'
          }`}
        >
          Reimbursement Claims ({expenses.length})
          {expenses.filter(e => e.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
              {expenses.filter(e => e.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Transactions Table */}
      {activeTab === 'transactions' && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {transactions.map((tx) => {
                  const isIncome = tx.transaction_type === 'INCOME';
                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5]/80">
                      <td className="py-3 px-4">
                        <Badge variant={isIncome ? 'success' : 'danger'} size="sm">
                          {isIncome ? '+ INCOME' : '- EXPENSE'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#2A1E18]">
                        {tx.category_display || tx.category}
                      </td>
                      <td className="py-3 px-4 text-[#7A6A5E] max-w-sm truncate">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-sm">
                        <span className={isIncome ? 'text-emerald-700' : 'text-rose-700'}>
                          {isIncome ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7A6A5E]">
                        {tx.created_by?.name || 'System / Auto'}
                      </td>
                      <td className="py-3 px-4 text-right text-[#7A6A5E] font-mono text-[11px]">
                        {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Expense Claims Review Table */}
      {activeTab === 'claims' && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Claim Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Claimant</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {expenses.map((exp) => {
                  const isPending = exp.status === 'PENDING';
                  return (
                    <tr key={exp.id} className="hover:bg-[#FAF8F5]/80">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#2A1E18]">{exp.title}</div>
                        <div className="text-[11px] text-[#7A6A5E] line-clamp-1">{exp.description}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#2A1E18]">
                        {exp.category_display || exp.category}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#2A1E18]">{exp.submitted_by?.name}</div>
                        <div className="text-[10px] text-[#7A6A5E]">{exp.submitted_by?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-sm text-[#2A1E18]">
                        ₹{Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={exp.status === 'PAID' ? 'success' : exp.status === 'APPROVED' ? 'info' : exp.status === 'REJECTED' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {exp.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="clay"
                              onClick={() => handleOpenReview(exp, 'PAID')}
                            >
                              Approve & Disburse
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-700 hover:bg-rose-50"
                              onClick={() => handleOpenReview(exp, 'REJECTED')}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7A6A5E]">
                            Reviewed by {exp.approved_by?.name || 'Staff'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Review Claim Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Review Reimbursement Claim"
        subtitle={selectedExpense?.title}
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#FAF8F5] border border-[#E8DCCE] rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">Claimant:</span>
              <strong className="text-[#2A1E18]">{selectedExpense?.submitted_by?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">Amount:</span>
              <strong className="text-lg font-extrabold text-[#6B4A38]">₹{Number(selectedExpense?.amount || 0).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A6A5E]">Description:</span>
              <span className="text-[#2A1E18] text-right">{selectedExpense?.description}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Decision
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
            >
              <option value="PAID">Approve & Disburse Funds (Logs Expense Transaction)</option>
              <option value="APPROVED">Approve (Pending Disbursement)</option>
              <option value="REJECTED">Reject Claim</option>
            </select>
          </div>

          {reviewStatus === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="Explain why this expense claim was rejected..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewStatus === 'REJECTED' ? 'danger' : 'primary'}
              size="sm"
              isLoading={isReviewing}
              onClick={handleConfirmReview}
            >
              Confirm Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Expense Modal */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Submit Volunteer Expense Claim"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <Input
            label="Expense Title"
            value={newExpenseData.title}
            onChange={(e) => setNewExpenseData({ ...newExpenseData, title: e.target.value })}
            placeholder="e.g. Gala Stage Lighting Console Rental"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount (₹)"
              type="number"
              value={newExpenseData.amount}
              onChange={(e) => setNewExpenseData({ ...newExpenseData, amount: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={newExpenseData.category}
                onChange={(e) => setNewExpenseData({ ...newExpenseData, category: e.target.value })}
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              >
                <option value="REIMBURSEMENT">Volunteer Reimbursement</option>
                <option value="OPERATIONS">Operations & Logistics</option>
                <option value="CATERING">Food & Catering</option>
                <option value="MARKETING">Marketing & Banners</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Description & Purpose
            </label>
            <textarea
              value={newExpenseData.description}
              onChange={(e) => setNewExpenseData({ ...newExpenseData, description: e.target.value })}
              rows={3}
              placeholder="Detail the expense items and vendors..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              required
            />
          </div>

          <ImageUploadInput
            label="Receipt Proof / Invoice (Upload File or Paste Link)"
            value={newExpenseData.receipt}
            onChange={(val) => setNewExpenseData({ ...newExpenseData, receipt: val })}
            placeholder="https://images.unsplash.com/..."
            helperText="Upload a scanned bill, UPI receipt screenshot, or paste invoice image link"
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
