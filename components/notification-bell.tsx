'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { AppNotification, User, UserRole } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationBellProps {
  user: User;
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        const all: AppNotification[] = data.notifications || [];
        const filtered = all.filter(n => {
          if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true;
          return n.targetDepartmentId === user.departmentId && n.targetGroupId === user.groupId;
        });
        setNotifications(filtered);
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error('Failed to mark notification read', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#141414]/40 hover:text-[#141414] hover:bg-[#141414]/5 rounded-full transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#F27D26] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white border border-[#141414]/10 shadow-2xl z-[200] overflow-hidden rounded-lg"
          >
            <div className="p-4 border-b border-[#141414]/10 bg-[#F9F8F7] flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]">Notifications</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={async () => {
                    await fetch('/api/notifications', { method: 'DELETE' });
                    setNotifications([]);
                  }}
                  className="text-[10px] text-[#141414]/40 hover:text-red-500 font-bold uppercase"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className={`p-4 border-b border-[#141414]/5 hover:bg-[#F9F8F7] transition-colors cursor-pointer relative group ${!n.read ? 'bg-[#F27D26]/5' : ''}`}
                    onClick={(e) => !n.read && handleMarkRead(e, n.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-[#F27D26] text-white' : 'bg-[#141414]/5 text-[#141414]/40'}`}>
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs leading-relaxed ${!n.read ? 'text-[#141414] font-medium' : 'text-[#141414]/60'}`}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#141414]/30">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {!n.read && (
                      <button 
                        onClick={(e) => handleMarkRead(e, n.id)}
                        className="absolute right-2 top-2 p-1 text-[#141414]/10 hover:text-[#F27D26] opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Mark as read"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 bg-[#F9F8F7] text-center border-t border-[#141414]/10">
                <p className="text-[10px] text-[#141414]/40 font-medium">
                  Showing updates for your Group
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
