import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ShieldCheck, CreditCard, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export const DemoPaymentModal = ({
  isOpen,
  onClose,
  title = "Complete Payment",
  itemName,
  itemType = "Event Pass",
  amount,
  discount = 0,
  finalAmount,
  onConfirm,
  isProcessing = false,
}) => {
  const [selectedMethod, setSelectedMethod] = useState('demo_upi');

  const total = finalAmount !== undefined ? finalAmount : Math.max(0, amount - discount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Fast & Secure Demo Settlement"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Hackathon Demo Notice Banner */}
        <div className="bg-[#E8DCCE]/40 border border-[#E8DCCE] rounded-xl p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#6B4A38] shrink-0 mt-0.5" />
          <div className="text-xs text-[#2A1E18]">
            <span className="font-semibold text-[#6B4A38] block mb-0.5">Demo Payment Simulator</span>
            This transaction uses simulated university funds. No actual bank card or money will be charged.
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="bg-[#FAF8F5] border border-[#E8DCCE]/70 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between text-xs text-[#7A6A5E]">
            <span>Item / Service:</span>
            <span className="font-semibold text-[#2A1E18] text-right">{itemName}</span>
          </div>
          <div className="flex justify-between text-xs text-[#7A6A5E]">
            <span>Category:</span>
            <span className="font-medium text-[#2A1E18]">{itemType}</span>
          </div>
          <div className="flex justify-between text-xs text-[#7A6A5E]">
            <span>Standard Price:</span>
            <span className="font-medium text-[#2A1E18]">₹{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-700 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Active Member Benefit:
              </span>
              <span>-₹{Number(discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="pt-2 border-t border-[#E8DCCE] flex justify-between items-baseline">
            <span className="text-sm font-bold text-[#2A1E18]">Total Payable:</span>
            <span className="text-xl font-extrabold text-[#6B4A38]">
              ₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider">
            Simulated Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('demo_upi')}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                selectedMethod === 'demo_upi'
                  ? 'border-[#6B4A38] bg-[#6B4A38]/5 text-[#6B4A38]'
                  : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${selectedMethod === 'demo_upi' ? 'text-[#6B4A38]' : 'text-gray-300'}`} />
              <span>Campus UPI (Instant)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('demo_card')}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                selectedMethod === 'demo_card'
                  ? 'border-[#6B4A38] bg-[#6B4A38]/5 text-[#6B4A38]'
                  : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
              }`}
            >
              <CreditCard className={`w-4 h-4 ${selectedMethod === 'demo_card' ? 'text-[#6B4A38]' : 'text-gray-300'}`} />
              <span>Student Wallet</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={isProcessing}
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Authorize Demo Payment (₹{Number(total).toFixed(0)})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
