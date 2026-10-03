import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/api';
import { Calendar, Search, MapPin, Users, Filter, Clock, Sparkles } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { format } from 'date-fns';

export const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'CULTURAL', label: 'Cultural & Gala' },
    { value: 'TECHNICAL', label: 'Technical & Hackathon' },
    { value: 'WORKSHOP', label: 'Workshop & Masterclass' },
    { value: 'SOCIAL', label: 'Social & Festival' },
    { value: 'CAREER', label: 'Career & Alumni' },
  ];

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents({
        category: selectedCategory,
        search: searchQuery,
      });
      if (res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6B4A38]/10 text-[#6B4A38] text-xs font-bold uppercase tracking-wider mb-2">
          Campus Calendar
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2A1E18] tracking-tight">
          Explore Campus Events
        </h1>
        <p className="text-sm text-[#7A6A5E] mt-1 max-w-2xl">
          Discover conferences, hackathons, galas, workshops and cultural evenings organized across campus.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3 rounded-xl border border-[#E8DCCE]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A5E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, venue, keywords..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#6B4A38] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#7A6A5E] hover:text-[#2A1E18] hover:bg-[#E8DCCE]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-80 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found"
          description="Try changing your search terms or filter categories."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedCategory('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((evt) => {
            let formattedDate = 'Upcoming';
            try {
              formattedDate = format(new Date(evt.start_datetime), 'EEE, MMM d • h:mm a');
            } catch {
              // ignore
            }

            const capacityPercent = evt.capacity > 0 ? Math.min(100, Math.round((evt.tickets_sold_count / evt.capacity) * 100)) : 0;
            const isFull = evt.seats_remaining <= 0;

            return (
              <Card key={evt.id} padding="none" hoverable className="overflow-hidden flex flex-col group">
                <div className="h-48 bg-[#E8DCCE] relative overflow-hidden">
                  {evt.cover_image ? (
                    <img
                      src={evt.cover_image}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#7A6A5E]">
                      <Calendar className="w-12 h-12 opacity-30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge variant="coffee" size="sm">
                      {evt.category}
                    </Badge>
                    {isFull && <Badge variant="danger" size="sm">Full</Badge>}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#2A1E18] group-hover:text-[#6B4A38] transition-colors line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#7A6A5E] line-clamp-2 mt-1.5 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-4 space-y-1.5 text-xs text-[#7A6A5E]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#8B6353] shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Capacity Progress */}
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] text-[#7A6A5E] mb-1">
                        <span>Reserved: {evt.tickets_sold_count}/{evt.capacity}</span>
                        <span>{capacityPercent}% filled</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8DCCE]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            capacityPercent >= 85 ? 'bg-amber-600' : 'bg-[#6B4A38]'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E8DCCE] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-medium text-[#7A6A5E] block">Member Price:</span>
                      <span className="text-sm font-bold text-emerald-800">
                        ₹{Number(evt.member_price).toFixed(0)}
                      </span>
                      <span className="text-xs text-[#7A6A5E] ml-1.5">
                        (Reg: ₹{Number(evt.non_member_price).toFixed(0)})
                      </span>
                    </div>

                    <Link to={`/events/${evt.id}`}>
                      <Button size="sm" variant={isFull ? 'outline' : 'primary'}>
                        {isFull ? 'View Info' : 'Reserve Pass'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
