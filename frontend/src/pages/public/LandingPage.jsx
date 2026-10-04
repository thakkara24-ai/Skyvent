import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService, productService, extractDataArray } from '../../services/api';
import { 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  ArrowRight, 
  GraduationCap, 
  QrCode, 
  TrendingUp,
  MapPin,
  Building2,
  Users,
  Award,
  BookOpen
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evtsRes, prodsRes] = await Promise.all([
          eventService.getEvents({ upcoming: 'true' }),
          productService.getProducts(),
        ]);
        setEvents(extractDataArray(evtsRes).slice(0, 3));
        setProducts(extractDataArray(prodsRes).slice(0, 3));
      } catch (err) {
        console.error('Failed to load landing data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20 text-[var(--ink-brown)]">
      {/* Hero Section with LD College Campus Background - Crisp, Dark, Rich Vignette */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-20 sm:pb-28 bg-[#18110D]">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src="/ld_college_campus.jpg"
            alt="L.D. College of Engineering Campus"
            className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.05]"
          />
          {/* Rich dark vignette overlay - no excessive white washout */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
          <div className="absolute inset-0 bg-[var(--coffee-brown)]/20 mix-blend-overlay" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6 animate-in fade-in duration-300">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 text-xs font-semibold uppercase tracking-wider shadow-sm">
              <GraduationCap className="w-3.5 h-3.5 text-[var(--sand)]" />
              Connect • Organize • Celebrate
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--coffee-brown)]/90 backdrop-blur-md text-white border border-white/20 text-xs font-semibold shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-[var(--sand)]" />
              L.D. College of Engineering (LDCE)
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.15] drop-shadow-md">
            Student Organization <br className="hidden sm:block" />
            <span className="text-[var(--sand)]">Management Platform</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-normal">
            Manage student memberships, campus events, secure QR ticketing, digital attendance, merchandise store, and financial treasury from one unified connected platform.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/register">
              <Button size="lg" variant="primary" icon={ArrowRight} className="w-full sm:w-auto text-sm font-bold shadow-xl">
                Join SKYVENT Today
              </Button>
            </Link>
            <Link to="/events">
              <button className="w-full sm:w-auto text-sm font-semibold px-6 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/35 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Calendar className="w-4 h-4" />
                Explore Campus Events
              </button>
            </Link>
          </div>

          {/* Campus Highlights Floating Stat Bar */}
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-center shadow-lg">
              <span className="block text-xl sm:text-2xl font-black text-white">14+</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Engineering Branches</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-center shadow-lg">
              <span className="block text-xl sm:text-2xl font-black text-white">50+</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Clubs & Fests</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-center shadow-lg">
              <span className="block text-xl sm:text-2xl font-black text-white">10,000+</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Student Members</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-center shadow-lg">
              <span className="block text-xl sm:text-2xl font-black text-white">Live QR</span>
              <span className="text-[11px] text-gray-300 uppercase tracking-wider font-semibold">Realtime Passes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Workflow Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--clay-brown)] mb-2">Why SKYVENT</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-brown)]">
            One Connected System, Zero Disconnected Tools
          </h3>
          <p className="text-sm text-[var(--warm-gray)] mt-2">
            Every action flows seamlessly from membership privileges to ticket check-ins, merchandise inventory, and financial balances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg" className="border-t-4 border-t-[var(--coffee-brown)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)] flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-[var(--ink-brown)]">1. Membership & Pricing</h4>
            <p className="text-xs text-[var(--warm-gray)] mt-2 leading-relaxed">
              Active memberships automatically unlock special member discounts on events and merchandise, dynamically verified on the server.
            </p>
          </Card>

          <Card padding="lg" className="border-t-4 border-t-[var(--clay-brown)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--clay-brown)]/10 text-[var(--clay-brown)] flex items-center justify-center mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-[var(--ink-brown)]">2. Digital Tickets & QR Entry</h4>
            <p className="text-xs text-[var(--warm-gray)] mt-2 leading-relaxed">
              Unique encrypted QR passes. Instant check-in desk scanning updates event attendance in real time over WebSockets without page reload.
            </p>
          </Card>

          <Card padding="lg" className="border-t-4 border-t-[var(--ink-brown)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--ink-brown)]/10 text-[var(--ink-brown)] flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-[var(--ink-brown)]">3. Live Unified Finance</h4>
            <p className="text-xs text-[var(--warm-gray)] mt-2 leading-relaxed">
              Ticket sales, merchandise purchases, and approved reimbursements automatically compute the true organization net balance in SQLite.
            </p>
          </Card>
        </div>
      </section>

      {/* Dedicated LD College Campus Life & Community Feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--card-bg,white)] border border-[var(--sand)] rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Image showcase */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[var(--sand)] shadow-md group">
              <img
                src="/ld_college_campus.jpg"
                alt="L.D. College of Engineering Heritage Building"
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--coffee-brown)] text-white text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  L.D. College of Engineering
                </span>
                <p className="text-xs text-white/90 font-medium">
                  Iconic Heritage Clock Tower & Central Campus Lawns
                </p>
              </div>
            </div>

            {/* Right Col: Details & College Highlights */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--coffee-brown)] mb-2">
                  <Building2 className="w-4 h-4" />
                  Collegiate Excellence
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-brown)]">
                  Powering Student Life at L.D. College of Engineering
                </h3>
                <p className="text-sm text-[var(--warm-gray)] mt-2 leading-relaxed">
                  SKYVENT empowers LDCE student clubs, IEEE, CSI, SAE, cultural committees, and technical fests with centralized event management, verifiable passes, and transparent financial records.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--sand)] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-brown)]">
                    <Award className="w-4 h-4 text-[var(--coffee-brown)]" />
                    <span>Annual Technical Fests</span>
                  </div>
                  <p className="text-[11px] text-[var(--warm-gray)]">
                    Seamless ticketing, slot registration, and team tracking for Lakshya and tech symposiums.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--sand)] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-brown)]">
                    <Users className="w-4 h-4 text-[var(--clay-brown)]" />
                    <span>14 Departmental Societies</span>
                  </div>
                  <p className="text-[11px] text-[var(--warm-gray)]">
                    Manage student memberships with dynamic tier perks and attendance verification.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--sand)] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-brown)]">
                    <ShoppingBag className="w-4 h-4 text-[var(--coffee-brown)]" />
                    <span>LDCE Club Merchandise</span>
                  </div>
                  <p className="text-[11px] text-[var(--warm-gray)]">
                    Official hoodies, varsity jackets, and club merchandise with real-time stock decrements.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--sand)] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink-brown)]">
                    <BookOpen className="w-4 h-4 text-[var(--clay-brown)]" />
                    <span>Volunteer Check-In Desk</span>
                  </div>
                  <p className="text-[11px] text-[var(--warm-gray)]">
                    Instant camera QR scanning for door volunteers with real-time WebSocket attendance updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[var(--ink-brown)]">Featured Campus Events</h3>
            <p className="text-xs text-[var(--warm-gray)] mt-1">Discover what's happening across departments</p>
          </div>
          <Link to="/events" className="text-xs font-bold text-[var(--coffee-brown)] hover:text-[var(--ink-brown)] flex items-center gap-1">
            View All Events <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((evt) => (
            <Card key={evt.id} padding="none" hoverable className="overflow-hidden flex flex-col group">
              <div className="h-44 bg-[var(--sand)] relative overflow-hidden">
                {evt.cover_image ? (
                  <img
                    src={evt.cover_image}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--warm-gray)]">
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
                  <h4 className="text-base font-bold text-[var(--ink-brown)] line-clamp-1 group-hover:text-[var(--coffee-brown)] transition-colors">
                    {evt.title}
                  </h4>
                  <p className="text-xs text-[var(--warm-gray)] line-clamp-2 mt-1.5 leading-relaxed">
                    {evt.description}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-[var(--warm-gray)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[var(--clay-brown)] shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--sand)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--warm-gray)] block font-medium">Pricing:</span>
                    <span className="text-xs font-bold text-emerald-800">
                      ₹{Number(evt.member_price).toFixed(0)} <span className="font-normal text-[10px] text-[var(--warm-gray)]">(Member)</span>
                    </span>
                    <span className="text-xs font-medium text-[var(--warm-gray)] ml-2">
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
      <section className="bg-[var(--card-bg,white)] py-16 border-y border-[var(--sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--clay-brown)] mb-2">How It Works</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink-brown)]">
              4 Simple Steps to Campus Engagement
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                1
              </div>
              <h4 className="font-bold text-base text-[var(--ink-brown)]">Join & Verify</h4>
              <p className="text-xs text-[var(--warm-gray)] leading-relaxed">
                Register with your university student email and confirm with real 6-digit email OTP.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                2
              </div>
              <h4 className="font-bold text-base text-[var(--ink-brown)]">Choose Membership</h4>
              <p className="text-xs text-[var(--warm-gray)] leading-relaxed">
                Subscribe to annual student or scholar passes to unlock up to 40% savings on all activities.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                3
              </div>
              <h4 className="font-bold text-base text-[var(--ink-brown)]">Reserve & Pass</h4>
              <p className="text-xs text-[var(--warm-gray)] leading-relaxed">
                Claim your event ticket with instant digital payment settlement and receive your digital QR pass.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm">
                4
              </div>
              <h4 className="font-bold text-base text-[var(--ink-brown)]">Scan & Attend</h4>
              <p className="text-xs text-[var(--warm-gray)] leading-relaxed">
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
            <h3 className="text-2xl font-bold text-[var(--ink-brown)]">Official Organization Merchandise</h3>
            <p className="text-xs text-[var(--warm-gray)] mt-1">High quality campus hoodies, tees, caps, and stationery</p>
          </div>
          <Link to="/login" className="text-xs font-bold text-[var(--coffee-brown)] hover:text-[var(--ink-brown)] flex items-center gap-1">
            Shop Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((prod) => (
            <Card key={prod.id} padding="none" hoverable className="overflow-hidden flex flex-col">
              <div className="h-44 bg-[var(--cream)] relative overflow-hidden flex items-center justify-center">
                {prod.image ? (
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-[var(--warm-gray)]/40" />
                )}
                {prod.is_low_stock && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="warning" size="sm">Only {prod.stock_quantity} Left</Badge>
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-[var(--ink-brown)] line-clamp-1">{prod.name}</h4>
                  <p className="text-xs text-[var(--warm-gray)] line-clamp-2 mt-1">{prod.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--sand)] flex items-center justify-between">
                  <span className="text-base font-extrabold text-[var(--coffee-brown)]">
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
