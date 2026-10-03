import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, GraduationCap, Building2, Save, Shield } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { ImageUploadInput } from '../../components/common/ImageUploadInput';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      student_id: user?.student_id || '',
      department: user?.department || '',
      avatar: user?.avatar || '',
    }
  });

  const avatarVal = watch('avatar');

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await updateProfile(data);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Manage your personal university credentials and contact details
        </p>
      </div>

      <Card padding="lg">
        {/* User Identity Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#E8DCCE]">
          {user?.avatar || avatarVal ? (
            <img
              src={avatarVal || user?.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#6B4A38] shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#6B4A38] text-white flex items-center justify-center font-black text-2xl shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-[#2A1E18]">{user?.name}</h3>
            <p className="text-xs text-[#7A6A5E]">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="coffee" size="sm">Role: {user?.role?.replace('_', ' ')}</Badge>
              {user?.is_email_verified && <Badge variant="success" size="sm">✓ Verified Email</Badge>}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-6">
          <ImageUploadInput
            label="Profile Avatar Photo (Upload File or Paste Link)"
            value={avatarVal}
            onChange={(val) => setValue('avatar', val, { shouldDirty: true })}
            placeholder="https://images.unsplash.com/..."
            helperText="Upload a profile picture from your phone/computer or paste an image URL"
          />

          <Input
            label="Full Name"
            icon={User}
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Student ID #"
              icon={GraduationCap}
              error={errors.student_id?.message}
              {...register('student_id', { required: 'Student ID is required' })}
            />

            <Input
              label="Department / Program"
              icon={Building2}
              error={errors.department?.message}
              {...register('department', { required: 'Department is required' })}
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            icon={Phone}
            {...register('phone')}
          />

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Save}
              isLoading={isSaving}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
