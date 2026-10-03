import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService, productService, membershipService } from '../../services/api';
import { 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  Users, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  QrCode, 
  ShieldCheck, 
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { format } from 'date-fns';

export const LandingPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evtsRes, prodsRes, plansRes] = await Promise.all([
          eventService.getEvents({ upcoming: 'true' }),
          productService.getProducts(),
          membershipService.getPlans()
        ]);
        if (evtsRes.data) setEvents(evtsRes.data.slice(0, 3));
        if (prodsRes.data) setProducts(prodsRes.data.slice(0, 3));
        if (plansRes.data) setPlans(plansRes.data);
      } catch (err) {
        console.error('Failed to load landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDemoLogin = async (email, role) => {
    try {
      setDemoLoggingIn(true);
      await login(email, 'Skyvent@2026');
      if (['SUPER_ADMIN', 'PRESIDENT', 'TREASURER', 'VOLUNTEER'].includes(role)) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDemoLoggingIn(false);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-[#E8DCCE]/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6B4A38]/10 text-[#6B4A38] border border-[#6B4A38]/20 text-xs font-bold uppercase tracking-widest mb-6 animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-[#8B6353]" />
            Connect • Organize • Celebrate
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#2A1E18] tracking-tight max-w-4xl mx-auto leading-[1.1]">
            One Campus. <br className="hidden sm:block" />
            <span className="text-[#6B4A38]">One Community.</span> <br className="hidden sm:block" />
            One Platform.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#7A6A5E] max-w-2xl mx-auto leading-relaxed">
            Manage members, events, passes, merchandise, volunteer tasks and finances from one single connected platform. No more scattered spreadsheets or lost paper records.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/register">
              <Button size="lg" variant="primary" icon={ArrowRight} className="w-full sm:w-auto text-sm font-bold">
                Join SKYVENT Today
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline" icon={Calendar} className="w-full sm:w-auto text-sm font-semibold">
                Explore Campus Events
              </Button>
            </Link>
          </div>

          {/* 1-Click Demo Account Shortcuts */}
          <div className="mt-12 pt-8 border-t border-[#E8DCCE]/80 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A6A5E] block mb-3">
              ⚡ Quick Hackathon Demo Logins (Instant 1-Click Access)
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleDemoLogin('admin@skyvent.demo', 'SUPER_ADMIN')}
                className="px-3 py-1.5 text-xs font-semibold bg-[#2A1E18] text-white rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
              >
                Super Admin
              </button>
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleDemoLogin('president@skyvent.demo', 'PRESIDENT')}
                className="px-3 py-1.5 text-xs font-semibold bg-[#6B4A38] text-white rounded-lg hover:bg-[#563B2C] transition-colors cursor-pointer disabled:opacity-50"
              >
                President
              </button>
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleDemoLogin('treasurer@skyvent.demo', 'TREASURER')}
                className="px-3 py-1.5 text-xs font-semibold bg-[#8B6353] text-white rounded-lg hover:bg-[#785344] transition-colors cursor-pointer disabled:opacity-50"
              >
                Treasurer
              </button>
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleDemoLogin('volunteer@skyvent.demo', 'VOLUNTEER')}
                className="px-3 py-1.5 text-xs font-semibold bg-[#7A6A5E] text-white rounded-lg hover:bg-[#68574C] transition-colors cursor-pointer disabled:opacity-50"
              >
                Volunteer / Check-In
              </button>
              <button
                type="button"
                disabled={demoLoggingIn}
                onClick={() => handleDemoLogin('member@skyvent.demo', 'MEMBER')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                Student Member
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Workflow Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8B6353] mb-2">Why SKYVENT</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18]">
            One Connected System, Zero Disconnected Tools
          </h3>
          <p className="text-sm text-[#7A6A5E] mt-2">
            Every action flows seamlessly from membership privileges to ticket check-ins, merchandise inventory, and financial balances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="border-t-4 border-t-[#6B4A38]">
            <div className="w-10 h-10 rounded-xl bg-[#6B4A38]/10 text-[#6B4A38] flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-[#2A1E18]">1. Membership & Pricing</h4>
            <p className="text-xs text-[#7A6A5E] mt-2 leading-relaxed">
              Active memberships automatically unlock special member discounts on events and merchandise, dynamically verified on the server.
            </p>
          </Card>

          <Card padding="lg" className="border-t-4 border-t-[#8B6353]">
            <div className="w-10 h-10 rounded-xl bg-[#8B6353]/10 text-[#8B6353] flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-[#2A1E18]">2. Digital Tickets & QR Entry</h4>
            <p className="text-xs text-[#7A6A5E] mt-2 leading-relaxed">
              Unique encrypted QR passes. Instant check-in desk scanning updates event attendance in real time over WebSockets without page reload.
            </p>
          </Card>

          <Card padding="lg" className="border-t-4 border-t-[#2A1E18]">
            <div className="w-10 h-10 rounded-xl bg-[#2A1E18]/10 text-[#2A1E18] flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-[#2A1E18]">3. Live Unified Finance</h4>
            <p className="text-xs text-[#7A6A5E] mt-2 leading-relaxed">
              Ticket sales, merchandise purchases, and approved reimbursements automatically compute the true organization net balance in SQLite.
            </p>
          </Card>
        </div>
      </section>

      {/* Featured Upcoming Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#2A1E18]">Featured Campus Events</h3>
            <p className="text-xs text-[#7A6A5E] mt-1">Discover what's happening across departments</p>
          </div>
          <Link to="/events" className="text-xs font-bold text-[#6B4A38] hover:text-[#2A1E18] flex items-center gap-1">
            View All Events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((evt) => (
            <Card key={evt.id} padding="none" hoverable className="overflow-hidden flex flex-col group">
              <div className="h-44 bg-[#E8DCCE] relative overflow-hidden">
                {evt.cover_image ? (
                  <img
                    src={evt.cover_image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#7A6A5E]">
                    <Calendar className="w-12 h-12 opacity-40" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge variant="coffee" size="sm">
                    {evt.category}
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#2A1E18] line-clamp-1 group-hover:text-[#6B4A38] transition-colors">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-[#7A6A5E] line-clamp-2 mt-1.5 leading-relaxed">
                    {evt.description}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-[#7A6A5E]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E8DCCE] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7A6A5E] block font-medium">Pricing:</span>
                    <span className="text-xs font-bold text-emerald-800">
                      ₹{Number(evt.member_price).toFixed(0)} <span className="font-normal text-[10px] text-[#7A6A5E]">(Member)</span>
                    </span>
                    <span className="text-xs font-medium text-[#7A6A5E] ml-2">
                      / ₹{Number(evt.non_member_price).toFixed(0)}
                    </span>
                  </div>
                  <Link to={`/events/${evt.id}`}>
                    <Button size="sm" variant="primary">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 border-y border-[#E8DCCE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8B6353] mb-2">How It Works</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18]">
              4 Simple Steps to Campus Engagement
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                1
              </div>
              <h4 className="font-bold text-base text-[#2A1E18]">Join & Verify</h4>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Register with your university student email and confirm with real 6-digit email OTP.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                2
              </div>
              <h4 className="font-bold text-base text-[#2A1E18]">Choose Membership</h4>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Subscribe to annual student or scholar passes to unlock up to 40% savings on all activities.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                3
              </div>
              <h4 className="font-bold text-base text-[#2A1E18]">Reserve & Pass</h4>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Claim your event ticket with instant demo settlement and receive your digital QR pass.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                4
              </div>
              <h4 className="font-bold text-base text-[#2A1E18]">Scan & Attend</h4>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Present your QR token at check-in desks for instant verification and attendance recording.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Official Merchandise Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#2A1E18]">Official Organization Merchandise</h3>
            <p className="text-xs text-[#7A6A5E] mt-1">High quality campus hoodies, tees, caps, and stationery</p>
          </div>
          <Link to="/login" className="text-xs font-bold text-[#6B4A38] hover:text-[#2A1E18] flex items-center gap-1">
            Shop Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((prod) => (
            <Card key={prod.id} padding="none" hoverable className="overflow-hidden flex flex-col">
              <div className="h-44 bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center">
                {prod.image ? (
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-[#7A6A5E]/40" />
                )}
                {prod.is_low_stock && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="warning" size="sm">Only {prod.stock_quantity} Left</Badge>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#2A1E18] line-clamp-1">{prod.name}</h4>
                  <p className="text-xs text-[#7A6A5E] line-clamp-2 mt-1">{prod.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E8DCCE] flex items-center justify-between">
                  <span className="text-base font-extrabold text-[#6B4A38]">
                    ₹{Number(prod.price).toFixed(0)}
                  </span>
                  <Link to="/login">
                    <Button size="sm" variant="outline">
                      Order Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
