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

export default function AssessorQueuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates] = useState<Record<string, FormTemplate>>(() => {
    const templateMap: Record<string, FormTemplate> = {};
    store.getTemplates().forEach(t => { templateMap[t.id] = t; });
    return templateMap;
  });
  const [submissions] = useState<FormSubmission[]>(() => store.getSubmissions());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Data is initialized in useState
  }, []);

  const filteredSubmissions = submissions.filter(s => 
    s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    templates[s.templateId]?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#141414] tracking-tight">Review Queue</h1>
        <p className="text-[#141414]/50 italic serif">Assess and provide feedback on staff submissions.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-[#141414]/10 p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
          <input
            type="text"
            placeholder="Search by staff name or form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/10 focus:outline-none focus:border-[#F27D26] transition-colors text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[#141414]/10 text-xs font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all">
          <Filter size={14} />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white border border-[#141414]/10 p-20 text-center">
            <p className="text-sm italic serif text-[#141414]/30">No submissions found in the queue.</p>
          </div>
        ) : (
          filteredSubmissions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-[#141414]/10 p-6 hover:border-[#F27D26] transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#141414]">{templates[s.templateId]?.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-xs font-bold text-[#141414]/60 uppercase tracking-widest">Staff: {s.staffName}</p>
                    <p className="text-[10px] text-[#141414]/40 font-mono uppercase">Submitted: {format(new Date(s.submittedAt), 'MMM dd, HH:mm')}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${
                  s.status === 'PENDING' ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-green-600 bg-green-50 border-green-200'
                }`}>
                  {s.status}
                </div>
                <button 
                  onClick={() => router.push(`/dashboard/assessor/review/${s.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all"
                >
                  Review
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
