import React, { useState, useEffect } from 'react';
import { notificationService, extractDataArray } from '../../services/api';
import { Bell, CheckCheck, Check, Info, Calendar, Ticket, CreditCard, ShoppingBag, Wallet } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      const list = extractDataArray(res);
      setNotifications(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Action failed.');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {
      // ignore
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return format(d, 'MMMM d, yyyy • h:mm a');
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'MEMBERSHIP': return CreditCard;
      case 'EVENT': return Calendar;
      case 'TICKET': return Ticket;
      case 'ORDER': return ShoppingBag;
      case 'FINANCE': return Wallet;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            System alerts, ticket passes, membership updates, and announcements
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <Button
            size="sm"
            variant="outline"
            icon={CheckCheck}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You are all caught up on campus alerts and events."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const Icon = getTypeIcon(notif.notification_type);
            const dateStr = formatDateTime(notif.created_at);

            return (
              <Card
                key={notif.id}
                padding="default"
                className={`flex items-start justify-between gap-4 transition-all ${
                  !notif.is_read ? 'bg-white border-l-4 border-l-[#6B4A38] shadow-xs' : 'bg-[#FAF8F5]/60 opacity-85'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.is_read ? 'bg-[#6B4A38]/10 text-[#6B4A38]' : 'bg-[#E8DCCE]/40 text-[#7A6A5E]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={!notif.is_read ? 'coffee' : 'default'} size="sm">
                        {notif.notification_type || 'SYSTEM'}
                      </Badge>
                      <span className="text-xs font-bold text-[#2A1E18]">
                        {notif.title}
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6A5E] leading-relaxed">
                      {notif.message}
                    </p>
                    {dateStr && (
                      <span className="text-[10px] text-[#7A6A5E]/70 block pt-1">
                        {dateStr}
                      </span>
                    )}
                  </div>
                </div>

                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1.5 rounded-lg text-[#7A6A5E] hover:text-[#2A1E18] hover:bg-[#FAF8F5] cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
