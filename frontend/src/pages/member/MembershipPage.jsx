import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { membershipService, extractDataArray } from '../../services/api';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { DemoPaymentModal } from '../../components/common/DemoPaymentModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const MembershipPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await membershipService.getPlans();
      setPlans(extractDataArray(res));
    } catch {
      toast.error('Could not load membership plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    try {
      const res = await membershipService.purchaseMembership(selectedPlan.id);
      if (res.data) {
        toast.success(`Successfully activated ${selectedPlan.name}!`);
        setPaymentModalOpen(false);
        await refreshUser();
      }
    } catch (err) {
      toast.error(err.message || 'Membership purchase failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentMem = user?.current_membership;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6B4A38]/10 text-[#6B4A38] text-xs font-bold uppercase tracking-wider mb-2">
          Campus Privileges
        </div>
        <h1 className="text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          Student Organization Memberships
        </h1>
        <p className="text-sm text-[#7A6A5E] mt-1">
          Support campus activities and unlock exclusive discounts, VIP gala seats, and early-bird event passes.
        </p>
      </div>

      {/* Active Membership Banner (if active) */}
      {currentMem && (
        <Card padding="lg" className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">ACTIVE MEMBERSHIP</Badge>
                <span className="text-xs text-[#7A6A5E] font-medium">Valid until {format(new Date(currentMem.end_date), 'MMMM d, yyyy')}</span>
              </div>
              <h3 className="text-xl font-bold text-[#2A1E18]">{currentMem.plan_name}</h3>
              <p className="text-xs text-emerald-800 font-medium">
                ✓ Currently enjoying {currentMem.discount_percentage}% off all campus events!
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#7A6A5E] block">Status:</span>
              <span className="text-lg font-extrabold text-emerald-800">{currentMem.status}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Plans Comparison Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, index) => {
            const isCurrentPlan = currentMem?.plan_name === plan.name;
            const isFeatured = index === 1; // Middle tier highlight
            const isAlumni = index === 2;

            return (
              <Card
                key={plan.id}
                padding="lg"
                className={`flex flex-col justify-between relative rounded-2xl transition-all duration-300 ${
                  isFeatured
                    ? 'border-2 border-[var(--coffee-brown)] shadow-lg bg-gradient-to-b from-[var(--cream)]/60 to-[var(--card-bg,white)] ring-2 ring-[var(--coffee-brown)]/20'
                    : 'border border-[var(--sand)] hover:border-[var(--clay-brown)]/70 hover:shadow-md bg-[var(--card-bg,white)]'
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--coffee-brown)] text-white text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                    ★ Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--clay-brown)] block">
                        {isFeatured ? 'All-Access Pass' : isAlumni ? 'Elite Patron Tier' : 'Campus Essential'}
                      </span>
                      <h3 className="text-xl font-extrabold text-[var(--ink-brown)] mt-0.5">{plan.name}</h3>
                    </div>
                    {isCurrentPlan && (
                      <Badge variant="success" size="sm" className="font-bold">
                        ✓ Current Plan
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-[var(--warm-gray)] mt-2 min-h-[36px] leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="my-5 pt-4 pb-1 border-t border-[var(--sand)]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-[var(--coffee-brown)]">₹{Number(plan.price).toFixed(0)}</span>
                      <span className="text-xs text-[var(--warm-gray)] font-medium">/ {plan.duration_days} days</span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)] border border-[var(--coffee-brown)]/20">
                        ⚡ {plan.discount_percentage}% discount on event passes
                      </span>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2.5 text-xs text-[var(--ink-brown)] pt-2">
                    <span className="text-[11px] font-bold text-[var(--warm-gray)] uppercase tracking-wider block">
                      Included Privileges:
                    </span>
                    {Array.isArray(plan.benefits) && plan.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[var(--clay-brown)] shrink-0 mt-0.5" />
                        <span className="text-[var(--ink-brown)] font-medium leading-snug">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[var(--sand)]">
                  <Button
                    variant={isCurrentPlan ? 'secondary' : isFeatured ? 'primary' : 'clay'}
                    size="md"
                    className="w-full font-bold shadow-xs transition-transform active:scale-[0.98]"
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? '✓ Active Membership Plan' : `Subscribe (₹${Number(plan.price).toFixed(0)})`}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Demo Payment Modal */}
      {selectedPlan && (
        <DemoPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Subscribe: ${selectedPlan.name}`}
          itemName={`${selectedPlan.name} (${selectedPlan.duration_days} Days)`}
          itemType="Annual Membership Pass"
          amount={selectedPlan.price}
          finalAmount={selectedPlan.price}
          isProcessing={isProcessing}
          onConfirm={handleConfirmPurchase}
        />
      )}
    </div>
  );
};
