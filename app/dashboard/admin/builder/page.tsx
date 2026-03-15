'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { FormTemplate, UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye,
  FileText,
  Calendar,
  User as UserIcon,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export default function FormBuilderListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/templates', { credentials: 'include' });
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (e) {
      console.error('Failed to load templates', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    fetchTemplates();
  }, [user, router]);

  const handleDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      setTemplates(prev => prev.filter(t => t.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#F27D26] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[#141414]/40 animate-pulse">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight">Form Builder</h1>
          <p className="text-[#141414]/50 italic serif">Create and manage assessment templates for your trainers.</p>
        </div>
        
        <button 
          onClick={() => router.push('/dashboard/admin/builder/new')}
          className="bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center gap-2 self-start"
        >
          <Plus size={18} />
          Create New Form
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#141414]/10 p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/10 focus:outline-none focus:border-[#F27D26] transition-colors text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-transparent border border-[#141414]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#F27D26]">
            <option>All Departments</option>
            <option>Medical</option>
            <option>Nursing</option>
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTemplates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#141414]/10 group hover:border-[#F27D26] transition-all flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#141414]/5 rounded text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                    <FileText size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414]">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-[#141414] mb-2 group-hover:text-[#F27D26] transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-[#141414]/60 line-clamp-2 mb-6 italic serif">
                  {template.description || 'No description provided.'}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">
                    <Calendar size={12} />
                    Updated {format(new Date(template.updatedAt), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">
                    <UserIcon size={12} />
                    Created by {template.createdBy === 'user-1' ? 'Super Admin' : 'Admin'}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#141414]/5 border-t border-[#141414]/10 grid grid-cols-3 gap-2">
                <button 
                  onClick={() => router.push(`/dashboard/admin/builder/edit/${template.id}`)}
                  className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-all"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-all">
                  <Copy size={12} />
                  Clone
                </button>
                {confirmDeleteId === template.id ? (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all"
                    >Confirm?</button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="py-2 px-2 text-[10px] hover:bg-[#141414]/10 transition-all"
                    ><X size={12} /></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId(template.id)}
                    className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State / Add New Card */}
        <button 
          onClick={() => router.push('/dashboard/admin/builder/new')}
          className="border-2 border-dashed border-[#141414]/10 p-12 flex flex-col items-center justify-center gap-4 group hover:border-[#F27D26] hover:bg-[#F27D26]/5 transition-all"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#141414]/20 flex items-center justify-center text-[#141414]/20 group-hover:border-[#F27D26] group-hover:text-[#F27D26] transition-all">
            <Plus size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 group-hover:text-[#F27D26]">Create New Template</span>
        </button>
      </div>
    </div>
  );
}
