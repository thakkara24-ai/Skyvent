import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { eventService } from '../../services/api';
import { Calendar, Save, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { toast } from 'sonner';

export const AdminEventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
              start_datetime: e.start_datetime ? e.start_datetime.slice(0, 16) : '',
              end_datetime: e.end_datetime ? e.end_datetime.slice(0, 16) : '',
              capacity: e.capacity,
              member_price: e.member_price,
              non_member_price: e.non_member_price,
              registration_open: e.registration_open ? e.registration_open.slice(0, 16) : '',
              registration_close: e.registration_close ? e.registration_close.slice(0, 16) : '',
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date & Time"
              type="datetime-local"
              error={errors.start_datetime?.message}
              {...register('start_datetime', { required: 'Start time is required' })}
            />

            <Input
              label="End Date & Time"
              type="datetime-local"
              error={errors.end_datetime?.message}
              {...register('end_datetime', { required: 'End time is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Capacity (Seats)"
              type="number"
              placeholder="100"
              error={errors.capacity?.message}
              {...register('capacity', { required: 'Capacity is required', min: 1 })}
            />

            <Input
              label="Member Price (₹)"
              type="number"
              placeholder="300"
              error={errors.member_price?.message}
              {...register('member_price', { required: 'Member price is required' })}
            />

            <Input
              label="Non-Member Price (₹)"
              type="number"
              placeholder="500"
              error={errors.non_member_price?.message}
              {...register('non_member_price', { required: 'Standard price is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Open"
              type="datetime-local"
              error={errors.registration_open?.message}
              {...register('registration_open', { required: 'Registration open is required' })}
            />

            <Input
              label="Registration Close"
              type="datetime-local"
              error={errors.registration_close?.message}
              {...register('registration_close', { required: 'Registration close is required' })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1">
                Status
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

            <Input
              label="Cover Image URL (Optional)"
              placeholder="https://images.unsplash.com/..."
              {...register('cover_image')}
            />
          </div>

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
