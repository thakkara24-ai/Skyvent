import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  QrCode, 
  Smartphone,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const DemoPaymentModal = ({
  isOpen,
  onClose,
  title = "Complete Payment",
  itemName,
  itemType = "Membership Plan",
  amount,
  discount = 0,
  finalAmount,
  onConfirm,
  isProcessing = false,
}) => {
  // Tabs: 'upi_qr' | 'upi_id' | 'demo_wallet'
  const [paymentMode, setPaymentMode] = useState('upi_qr');
  const [upiIdInput, setUpiIdInput] = useState('student@oksbi');
  const [upiVerified, setUpiVerified] = useState(true);

  const total = finalAmount !== undefined ? finalAmount : Math.max(0, amount - discount);
  const upiPayload = `upi://pay?pa=skyvent.campus@okhdfcbank&pn=SKYVENT%20Student%20Org&am=${Number(total).toFixed(2)}&cu=INR&tn=${encodeURIComponent(itemName || 'SKYVENT')}`;

  const handlePay = () => {
    onConfirm?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Fast & Secure UPI & Campus Settlement"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {/* Notice Banner */}
        <div className="bg-[#E8DCCE]/40 border border-[#E8DCCE] rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#6B4A38] shrink-0 mt-0.5" />
          <div className="text-xs text-[#2A1E18]">
            <span className="font-semibold text-[#6B4A38]">Campus Payment Portal</span> • Instant student settlement with UPI QR & UPI ID.
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="bg-[#FAF8F5] border border-[#E8DCCE]/80 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-[#7A6A5E]">
            <span>Item:</span>
            <span className="font-bold text-[#2A1E18] text-right">{itemName}</span>
          </div>
          <div className="flex justify-between text-[#7A6A5E]">
            <span>Category:</span>
            <span className="font-medium text-[#2A1E18]">{itemType}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Member Privilege:
              </span>
              <span>-₹{Number(discount).toFixed(2)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-[#E8DCCE] flex justify-between items-baseline">
            <span className="text-xs font-bold text-[#2A1E18] uppercase tracking-wider">Total Payable:</span>
            <span className="text-xl font-black text-[#6B4A38]">
              ₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1.5">
            Select Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode('upi_qr')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                paymentMode === 'upi_qr'
                  ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold shadow-xs'
                  : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span className="text-[11px]">UPI QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('upi_id')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                paymentMode === 'upi_id'
                  ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold shadow-xs'
                  : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[11px]">UPI ID / VPA</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('demo_wallet')}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                paymentMode === 'demo_wallet'
                  ? 'border-[#6B4A38] bg-[#6B4A38]/10 text-[#6B4A38] font-bold shadow-xs'
                  : 'border-[#E8DCCE] bg-white text-[#7A6A5E] hover:bg-[#FAF8F5]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[11px]">Student Wallet</span>
            </button>
          </div>
        </div>

        {/* Option 1: UPI QR Code View */}
        {paymentMode === 'upi_qr' && (
          <div className="p-4 bg-white border border-[#E8DCCE] rounded-xl text-center space-y-3">
            <div className="inline-block p-3 bg-white border-2 border-[#6B4A38] rounded-xl shadow-xs">
              <QRCodeSVG
                value={upiPayload}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-[#2A1E18]">
                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
              </div>
              <div className="text-[11px] font-mono text-[#7A6A5E]">
                UPI ID: <strong className="text-[#6B4A38]">skyvent.campus@okhdfcbank</strong>
              </div>
            </div>
          </div>
        )}

        {/* Option 2: UPI ID View */}
        {paymentMode === 'upi_id' && (
          <div className="p-4 bg-white border border-[#E8DCCE] rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Enter Your UPI ID / VPA
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  placeholder="e.g. yourname@oksbi"
                  className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg font-mono focus:outline-none focus:border-[#6B4A38]"
                />
                <button
                  type="button"
                  onClick={() => setUpiVerified(true)}
                  className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E8DCCE] text-[#6B4A38] text-xs font-bold rounded-lg hover:bg-[#E8DCCE]/40 cursor-pointer"
                >
                  ✓ Verified
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#7A6A5E]">
              A payment request of <strong>₹{Number(total).toFixed(2)}</strong> will be sent to your UPI app.
            </p>
          </div>
        )}

        {/* Option 3: Student Wallet View */}
        {paymentMode === 'demo_wallet' && (
          <div className="p-4 bg-white border border-[#E8DCCE] rounded-xl space-y-2 text-xs text-[#2A1E18]">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Campus Card Balance:</span>
              <span className="font-bold text-emerald-700">₹5,000.00 (Active)</span>
            </div>
            <p className="text-[11px] text-[#7A6A5E]">
              Amount will be settled instantly via university account ledger.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E8DCCE]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isProcessing}
            onClick={handlePay}
            className="font-bold"
          >
            {paymentMode === 'upi_qr'
              ? `Confirm UPI Payment (₹${Number(total).toFixed(0)})`
              : paymentMode === 'upi_id'
              ? `Pay via UPI ID (₹${Number(total).toFixed(0)})`
              : `Deduct from Wallet (₹${Number(total).toFixed(0)})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
