'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
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

  useEffect(() => {
    setSubmissions(store.getSubmissions());
    setTemplates(store.getTemplates());
    setAllUsers(store.getUsers());
  }, []);

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
        {/* Main Activity Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#141414]/10 overflow-hidden">
            <div className="p-6 border-b border-[#141414]/10 flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-widest text-sm">Recent Activity</h3>
              <button className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] hover:underline">View All</button>
            </div>
            <div className="divide-y divide-[#141414]/10">
              {[1, 2, 3].map((item) => (
                <div key={item} className="p-6 flex items-center justify-between hover:bg-[#141414]/5 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#141414]">Hand Hygiene Competency</p>
                      <p className="text-xs text-[#141414]/50">Submitted by Sarah Connor • 2 hours ago</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-[#141414]/20 group-hover:text-[#F27D26] group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          <div className="bg-[#141414] text-white p-8">
            <h3 className="font-bold uppercase tracking-widest text-xs mb-4 text-[#F27D26]">System Announcement</h3>
            <p className="text-sm leading-relaxed mb-6 italic serif opacity-80">
              &quot;The new Medical Trainers protocols have been updated. Please ensure all relevant assessments are completed by the end of the month.&quot;
            </p>
            <button className="text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-1 hover:text-[#F27D26] hover:border-[#F27D26] transition-all">
              Read Full Memo
            </button>
          </div>

          <div className="bg-white border border-[#141414]/10 p-6">
            <h3 className="font-bold uppercase tracking-widest text-xs mb-4">Quick Links</h3>
            <div className="space-y-3">
              {[
                { label: 'Help Center', href: '#' },
                { label: 'Policy Documents', href: '#' },
                { label: 'Contact Support', href: '#' },
              ].map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href}
                  className="block text-xs font-bold text-[#141414]/60 hover:text-[#F27D26] transition-colors"
                >
                  → {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
