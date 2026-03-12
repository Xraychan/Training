'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { FormSubmission, FormTemplate } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function ManagerQueuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates] = useState<Record<string, FormTemplate>>(() => {
    const templateMap: Record<string, FormTemplate> = {};
    store.getTemplates().forEach(t => { templateMap[t.id] = t; });
    return templateMap;
  });
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSubmissions(store.getSubmissions());
  }, []);

  const pendingSubmissions = submissions
    .filter(s => s.status !== 'APPROVED')
    .filter(s => 
      s.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      templates[s.templateId]?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const completedSubmissions = submissions
    .filter(s => s.status === 'APPROVED')
    .filter(s => 
      s.trainerName.toLowerCase().includes(completedSearchQuery.toLowerCase()) ||
      templates[s.templateId]?.title.toLowerCase().includes(completedSearchQuery.toLowerCase())
    );

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingSubmissions.length && pendingSubmissions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingSubmissions.map(s => s.id)));
    }
  };

  const handleBulkApprove = () => {
    if (!user) return;
    
    selectedIds.forEach(id => {
      const submission = submissions.find(s => s.id === id);
      if (submission && submission.status === 'PENDING') {
        const updated: FormSubmission = {
          ...submission,
          status: 'APPROVED',
          managerId: user.id,
          managerName: user.name,
          summary: 'Bulk approved from queue'
        };
        store.updateSubmission(updated);
      }
    });

    setSubmissions([...store.getSubmissions()]);
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight">Review Queue</h1>
          <p className="text-[#141414]/50 italic serif">Assess and provide feedback on trainer submissions.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#141414]/10 p-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <div 
          onClick={toggleSelectAll}
          className={`w-5 h-5 border-2 flex items-center justify-center cursor-pointer transition-all ${
            selectedIds.size > 0 && selectedIds.size === pendingSubmissions.length 
              ? 'bg-[#141414] border-[#141414] text-white' 
              : selectedIds.size > 0 
                ? 'bg-[#141414]/20 border-[#141414]'
                : 'border-[#141414]/10'
          }`}
        >
          {selectedIds.size > 0 && selectedIds.size === pendingSubmissions.length && <CheckCircle2 size={12} />}
          {selectedIds.size > 0 && selectedIds.size < pendingSubmissions.length && <div className="w-2 h-0.5 bg-[#141414]" />}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
          <input
            type="text"
            placeholder="Search by trainer name or form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/10 focus:outline-none focus:border-[#F27D26] transition-colors text-sm"
          />
        </div>
        
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 pl-4 border-l border-[#141414]/10"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">{selectedIds.size} Selected</span>
            <button 
              onClick={handleBulkApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all"
            >
              <CheckCircle2 size={14} />
              Approve All
            </button>
          </motion.div>
        )}
        
        <button className="flex items-center gap-2 px-4 py-2 border border-[#141414]/10 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all">
          <Filter size={14} />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingSubmissions.length === 0 ? (
          <div className="bg-white border border-[#141414]/10 p-20 text-center">
            <p className="text-sm italic serif text-[#141414]/30">No submissions found in the queue.</p>
          </div>
        ) : (
          pendingSubmissions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white border p-6 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                selectedIds.has(s.id) ? 'border-[#F27D26] bg-[#F27D26]/5 shadow-sm' : 'border-[#141414]/10 hover:border-[#141414]/30'
              }`}
            >
              <div className="flex items-center gap-6 flex-1">
                <div 
                  onClick={() => toggleSelect(s.id)}
                  className={`w-5 h-5 border-2 flex items-center justify-center cursor-pointer transition-all ${
                    selectedIds.has(s.id) ? 'bg-[#F27D26] border-[#F27D26] text-white' : 'border-[#141414]/10 hover:border-[#F27D26]'
                  }`}
                >
                  {selectedIds.has(s.id) && <CheckCircle2 size={12} />}
                </div>

                <div className="w-12 h-12 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#141414]">{templates[s.templateId]?.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-xs font-bold text-[#141414]/60 uppercase tracking-widest">Trainer: {s.trainerName}</p>
                    <p className="text-[10px] text-[#141414]/40 font-mono uppercase">Submitted: {format(new Date(s.submittedAt), 'MMM dd, HH:mm')}</p>
                    {s.managerName && (
                      <p className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest border-l border-[#141414]/10 pl-4">
                        Assessed by: <span className="text-[#F27D26]">{s.managerName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${
                  s.status === 'PENDING' ? 'text-orange-600 bg-orange-50 border-orange-200' : 
                  s.status === 'APPROVED' ? 'text-green-600 bg-green-50 border-green-200' :
                  'text-red-600 bg-red-50 border-red-200'
                }`}>
                  {s.status}
                </div>
                <button 
                  onClick={() => router.push(`/dashboard/manager/review/${s.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all"
                >
                  {s.status === 'PENDING' ? 'Review' : 'View Details'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="pt-8 mt-12 border-t border-[#141414]/10">
        <h2 className="text-2xl font-bold text-[#141414] tracking-tight mb-6">Completed</h2>
        
        {/* Completed Search */}
        <div className="bg-white border border-[#141414]/10 p-4 flex items-center gap-4 mb-6 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
            <input
              type="text"
              placeholder="Search completed by trainer name or form..."
              value={completedSearchQuery}
              onChange={(e) => setCompletedSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/10 focus:outline-none focus:border-[#F27D26] transition-colors text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {completedSubmissions.length === 0 ? (
            <div className="bg-white border border-[#141414]/10 p-20 text-center">
              <p className="text-sm italic serif text-[#141414]/30">No completed submissions found.</p>
            </div>
          ) : (
            completedSubmissions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border p-6 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6 border-[#141414]/10 hover:border-[#141414]/30"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-12 h-12 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#141414]">{templates[s.templateId]?.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <p className="text-xs font-bold text-[#141414]/60 uppercase tracking-widest">Trainer: {s.trainerName}</p>
                      <p className="text-[10px] text-[#141414]/40 font-mono uppercase">Submitted: {format(new Date(s.submittedAt), 'MMM dd, HH:mm')}</p>
                      {s.managerName && (
                        <p className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-widest border-l border-[#141414]/10 pl-4">
                          Assessed by: <span className="text-[#F27D26]">{s.managerName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 border-green-200">
                    {s.status}
                  </div>
                  <button 
                    onClick={() => router.push(`/dashboard/manager/review/${s.id}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all"
                  >
                    View Details
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
