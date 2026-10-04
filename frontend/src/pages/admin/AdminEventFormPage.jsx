import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventService } from '../../services/api';
import { Calendar, Save, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ImageUploadInput } from '../../components/common/ImageUploadInput';
import { toast } from 'sonner';

const EVENT_PRESET_IMAGES = [
  {
    name: 'Hackathon & Code',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    category: 'Technical'
  },
  {
    name: 'Campus Gala Evening',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    category: 'Cultural'
  },
  {
    name: 'Design & Workshop',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    category: 'Workshop'
  },
  {
    name: 'Music & Acoustic Fest',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    category: 'Social'
  },
  {
    name: 'Career & Alumni Meet',
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    category: 'Career'
  }
];

const toLocalDatetimeInput = (dateObj) => {
  if (!dateObj) return '';
  const d = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toISOWithTimezone = (localDatetimeStr) => {
  if (!localDatetimeStr) return null;
  const d = new Date(localDatetimeStr);
  if (isNaN(d.getTime())) return localDatetimeStr;
  return d.toISOString();
};

export const AdminEventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reasonable defaults for new events:
  // - starts in 2 hours
  // - ends tomorrow (+26 hours)
  // - registration opens 15 mins ago (active immediately)
  // - registration closes 1 hr before event end
  const now = new Date();
  const startDefault = new Date(now.getTime() + 2 * 3600 * 1000);
  const endDefault = new Date(now.getTime() + 26 * 3600 * 1000);
  const regOpenDefault = new Date(now.getTime() - 15 * 60 * 1000);
  const regCloseDefault = new Date(now.getTime() + 25 * 3600 * 1000);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      category: 'TECHNICAL',
      status: 'PUBLISHED',
      capacity: '50',
      member_price: '0.00',
      non_member_price: '0.00',
      start_datetime: toLocalDatetimeInput(startDefault),
      end_datetime: toLocalDatetimeInput(endDefault),
      registration_open: toLocalDatetimeInput(regOpenDefault),
      registration_close: toLocalDatetimeInput(regCloseDefault),
      cover_image: '',
    }
  });

  const coverImageVal = watch('cover_image');

  useEffect(() => {
    if (isEdit) {
      const loadEvent = async () => {
        try {
          const res = await eventService.getEvent(id);
          if (res.data) {
            const e = res.data;
            reset({
              title: e.title,
              description: e.description,
              category: e.category,
              venue: e.venue,
              start_datetime: toLocalDatetimeInput(e.start_datetime),
              end_datetime: toLocalDatetimeInput(e.end_datetime),
              capacity: e.capacity,
              member_price: e.member_price,
              non_member_price: e.non_member_price,
              registration_open: toLocalDatetimeInput(e.registration_open),
              registration_close: toLocalDatetimeInput(e.registration_close),
              status: e.status,
              cover_image: e.cover_image || ''
            });
          }
        } catch {
          toast.error('Failed to load event data.');
        } finally {
          setLoading(false);
        }
      };
      loadEvent();
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        start_datetime: toISOWithTimezone(data.start_datetime),
        end_datetime: toISOWithTimezone(data.end_datetime),
        registration_open: toISOWithTimezone(data.registration_open),
        registration_close: toISOWithTimezone(data.registration_close),
        capacity: parseInt(data.capacity),
        member_price: parseFloat(data.member_price),
        non_member_price: parseFloat(data.non_member_price),
      };

      if (isEdit) {
        await eventService.updateEvent(id, payload);
        toast.success('Event updated successfully.');
      } else {
        await eventService.createEvent(payload);
        toast.success('Event created and published.');
      }
      navigate('/admin/events');
    } catch (err) {
      toast.error(err.message || 'Failed to save event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/admin/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6A5E] hover:text-[#2A1E18]">
        <ArrowLeft className="w-4 h-4" /> Back to events list
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          {isEdit ? "Edit Campus Event" : "Create New Campus Event"}
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Specify dates, venue, capacity constraints, and member discounts
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Event Title"
            placeholder="e.g. Annual Campus Gala 2026"
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />

          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Event Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the schedule, guest speakers, activities and dress code..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
              {...register('description', { required: 'Description is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
                {...register('category')}
              >
                <option value="CULTURAL">Cultural & Gala</option>
                <option value="TECHNICAL">Technical & Hackathon</option>
                <option value="WORKSHOP">Workshop & Seminar</option>
                <option value="SPORTS">Sports & Fitness</option>
                <option value="SOCIAL">Social & Networking</option>
                <option value="CAREER">Career & Alumni</option>
              </select>
            </div>

            <Input
              label="Venue Location"
              placeholder="e.g. Grand University Auditorium"
              error={errors.venue?.message}
              {...register('venue', { required: 'Venue is required' })}
            />
          </div>

          {/* Event Schedule (No Past Dates Allowed for Event Start/End) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time *"
              type="datetime-local"
              min={toLocalDatetimeInput(new Date())}
              error={errors.start_datetime?.message}
              {...register('start_datetime', { 
                required: 'Start time is required',
                validate: (val) => isEdit || new Date(val) >= new Date() || 'Event start time cannot be in the past'
              })}
            />

            <Input
              label="End Date & Time *"
              type="datetime-local"
              min={toLocalDatetimeInput(new Date())}
              error={errors.end_datetime?.message}
              {...register('end_datetime', { 
                required: 'End time is required',
                validate: (val) => isEdit || new Date(val) >= new Date() || 'Event end time cannot be in the past'
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Capacity (Seats) *"
              type="number"
              placeholder="100"
              error={errors.capacity?.message}
              {...register('capacity', { required: 'Capacity is required', min: 1 })}
            />

            <Input
              label="Member Price (₹) *"
              type="number"
              placeholder="300"
              error={errors.member_price?.message}
              {...register('member_price', { required: 'Member price is required' })}
            />

            <Input
              label="Non-Member Price (₹) *"
              type="number"
              placeholder="500"
              error={errors.non_member_price?.message}
              {...register('non_member_price', { required: 'Standard price is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Open *"
              type="datetime-local"
              error={errors.registration_open?.message}
              {...register('registration_open', { required: 'Registration open is required' })}
            />

            <Input
              label="Registration Close *"
              type="datetime-local"
              min={toLocalDatetimeInput(new Date())}
              error={errors.registration_close?.message}
              {...register('registration_close', { 
                required: 'Registration close is required',
                validate: (val) => isEdit || new Date(val) >= new Date() || 'Registration close cannot be in the past'
              })}
            />
          </div>


          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
              Event Status
            </label>
            <select
              className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
              {...register('status')}
            >
              <option value="PUBLISHED">Published (Open for Registration)</option>
              <option value="DRAFT">Draft</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <ImageUploadInput
            label="Event Cover Image (File Upload or Web Link)"
            value={coverImageVal}
            onChange={(val) => setValue('cover_image', val, { shouldDirty: true })}
            placeholder="https://images.unsplash.com/..."
            presets={EVENT_PRESET_IMAGES}
            helperText="Upload a banner from your computer (PNG, JPG, WEBP) or paste an image link"
          />

          <div className="pt-4 border-t border-[#E8DCCE] flex justify-end gap-3">
            <Button variant="ghost" size="md" onClick={() => navigate('/admin/events')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              isLoading={isSubmitting}
            >
              {isEdit ? 'Save Changes' : 'Publish Event'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
