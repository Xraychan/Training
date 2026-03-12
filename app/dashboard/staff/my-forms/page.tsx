'use client';

import { useState, useEffect, useMemo } from 'react';
import { store } from '@/lib/store';
import { FormSubmission, FormTemplate } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function MyFormsPage() {
  const { user } = useAuth();
  
  const submissions = useMemo(() => {
    if (!user) return [];
    return store.getSubmissions().filter(s => s.staffId === user.id);
  }, [user]);
  
  const templates = useMemo(() => {
    const templateMap: Record<string, FormTemplate> = {};
    store.getTemplates().forEach(t => { templateMap[t.id] = t; });
    return templateMap;
  }, []);

  useEffect(() => {
    // Data is initialized via useMemo
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-50 border-green-200';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-orange-600 bg-orange-50 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return CheckCircle2;
      case 'REJECTED': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#141414] tracking-tight">My Progress</h1>
        <p className="text-[#141414]/50 italic serif">Track your completed assessments and certifications.</p>
      </div>

      <div className="bg-white border border-[#141414]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Assessment</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Submitted On</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Status</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Assessor</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/5">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sm italic serif text-[#141414]/30">
                    You haven&apos;t submitted any assessments yet.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => {
                  const StatusIcon = getStatusIcon(s.status);
                  return (
                    <tr key={s.id} className="hover:bg-[#141414]/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#141414]/5 rounded text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                            <FileText size={16} />
                          </div>
                          <span className="text-sm font-bold text-[#141414]">{templates[s.templateId]?.title || 'Unknown Form'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-[#141414]/60 font-mono">
                        {format(new Date(s.submittedAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${getStatusColor(s.status)}`}>
                          <StatusIcon size={12} />
                          {s.status}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-[#141414]/60">
                        {s.assessorName || <span className="italic opacity-40">Pending Review</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all" title="Download PDF">
                            <Download size={16} />
                          </button>
                          <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all" title="Print">
                            <Printer size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
