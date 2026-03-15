'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole, FormSubmission, FormTemplate, User } from '@/lib/types';
import { motion } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetches = [
          fetch('/api/submissions').then(r => r.json()),
          fetch('/api/templates').then(r => r.json()),
        ];

        // Only admins can fetch the full user list
        if (user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) {
          fetches.push(fetch('/api/users').then(r => r.json()));
        }

        const results = await Promise.all(fetches);
        const subData = results[0];
        const tplData = results[1];
        const userData = results[2];

        setSubmissions(subData.submissions || []);
        setTemplates(tplData.templates || []);
        if (userData) setAllUsers(userData.users || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const pendingCount = submissions.filter(s => s.status === 'PENDING').length;
  const completedCount = submissions.filter(s => s.status === 'APPROVED').length;
  const activeFormsCount = templates.length;
  const totalTrainersCount = allUsers.filter(u => u.role === UserRole.TRAINER).length;

  const canAccessAssessments = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  const displayStats = [
    ...(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? [{
      label: 'Active Forms',
      value: activeFormsCount.toString(),
      icon: FileText,
      color: 'text-blue-600'
    }] : []),
    {
      label: 'Pending Reviews',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'text-orange-600',
      href: pendingCount > 0 && canAccessAssessments ? '/dashboard/manager/queue' : undefined
    },
    {
      label: 'Completed',
      value: completedCount.toString(),
      icon: CheckCircle2,
      color: 'text-green-600',
      href: completedCount > 0 && canAccessAssessments ? '/dashboard/manager/queue' : undefined
    },
    ...(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN ? [{
      label: 'Total Trainers',
      value: totalTrainersCount.toString(),
      icon: Users,
      color: 'text-indigo-600',
      href: '/dashboard/admin/users'
    }] : [])
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#F27D26] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 animate-pulse">Gathering intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-[#141414]/50 italic serif">
            Here&apos;s what&apos;s happening in your {user.role.toLowerCase().replace('_', ' ')} portal today.
          </p>
        </div>
        
        {user.role === UserRole.TRAINER && (
          <Link 
            href="/dashboard/trainer/new-assessment"
            className="bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center gap-2 self-start"
          >
            <Plus size={18} />
            New Assessment
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, i) => {
          const content = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white border border-[#141414]/10 p-6 shadow-sm transition-shadow h-full ${
                stat.href ? 'cursor-pointer hover:shadow-md hover:border-[#F27D26]' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-[#141414]/5 rounded ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30">Live</span>
              </div>
              <p className="text-2xl font-bold text-[#141414]">{stat.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{stat.label}</p>
            </motion.div>
          );

          return stat.href ? (
            <Link href={stat.href} key={stat.label} className="block">
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notice Board Area */}
        <div className="lg:col-span-2 space-y-6">
          <NoticeBoard />
        </div>

        {/* Status / Info Area (Optional future use) */}
        <div className="space-y-6">
          <div className="bg-white border border-[#141414]/10 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
             <TrendingUp size={40} className="text-[#141414]/10 mb-4" />
             <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/30">Analytics Insight</p>
             <p className="text-sm italic serif text-[#141414]/50 mt-2">More data insights will appear here as assessments are processed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoticeBoard() {
  const { user } = useAuth();
  const [notice, setNotice] = useState<{ id: string; content: string; updatedBy: string; updatedAt: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotice = async () => {
    try {
      const res = await fetch('/api/notice');
      const data = await res.json();
      setNotice(data);
    } catch (err) {
      console.error('Failed to fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotice();
  }, []);

  if (isLoading) return <div className="bg-[#141414] animate-pulse h-[250px]" />;
  if (!notice) return null;

  const canEdit = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(user?.role as UserRole);

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, updatedBy: user.id })
      });
      if (res.ok) {
        const updated = await res.json();
        setNotice(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save notice:', err);
    }
  };

  return (
    <div className="bg-[#141414] text-white p-8 group relative min-h-[250px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold uppercase tracking-widest text-xs text-[#F27D26]">Notice</h3>
        {canEdit && !isEditing && (
          <button 
            onClick={() => {
              setEditContent(notice.content.replace(/^"|"$/g, ''));
              setIsEditing(true);
            }}
            className="text-[10px] font-bold uppercase tracking-widest border border-white/20 px-3 py-1 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            Edit Notice
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 flex-grow flex flex-col">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-4 text-sm font-serif italic text-white/90 focus:outline-none focus:border-[#F27D26] min-h-[120px] resize-none"
            placeholder="Enter notice message..."
          />
          <div className="flex justify-end gap-3 mt-auto">
            <button 
              onClick={() => setIsEditing(false)}
              className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="bg-[#F27D26] text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 hover:bg-[#F27D26]/90 transition-all"
            >
              Save Change
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col">
          <p className="text-xl md:text-2xl leading-relaxed mb-6 italic serif opacity-90">
            {notice.content.startsWith('"') ? notice.content : `"${notice.content}"`}
          </p>
          <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
            <span>Posted on {new Date(notice.updatedAt).toLocaleDateString()}</span>
            <span>Ref: {notice.id.split('-')[1]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

