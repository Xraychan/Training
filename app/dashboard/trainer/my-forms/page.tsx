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
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function MyFormsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [templates, setTemplates] = useState<Record<string, FormTemplate>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [subRes, tempRes] = await Promise.all([
          fetch('/api/submissions'),
          fetch('/api/templates')
        ]);
        const subData = await subRes.json();
        const tempData = await tempRes.json();
        
        setSubmissions(subData.submissions || []);
        
        const tempMap: Record<string, FormTemplate> = {};
        (tempData.templates || []).forEach((t: FormTemplate) => {
          tempMap[t.id] = t;
        });
        setTemplates(tempMap);
      } catch (err) {
        console.error('Failed to load submissions', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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

  const handlePrint = (s: FormSubmission) => {
    const title = templates[s.templateId]?.title || 'Assessment';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #141414; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 26px; margin-bottom: 4px; }
            .subtitle { color: #888; font-size: 13px; margin-bottom: 8px; }
            .meta-row { display: flex; gap: 32px; margin-bottom: 24px; }
            .meta-item { }
            .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: bold; }
            .meta-value { font-size: 14px; font-weight: bold; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .APPROVED { background: #dcfce7; color: #16a34a; }
            .PENDING_REVIEW { background: #fff7ed; color: #ea580c; }
            .REJECTED { background: #fee2e2; color: #dc2626; }
            hr { margin: 24px 0; border: none; border-top: 1px solid #e5e5e5; }
            .note { background: #f9f9f9; border-left: 4px solid #F27D26; padding: 16px; font-size: 13px; color: #555; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">Assessment Record</p>
          <hr />
          <div class="meta-row">
            <div class="meta-item">
              <div class="meta-label">Submitted</div>
              <div class="meta-value">${format(new Date(s.submittedAt), 'MMM dd, yyyy HH:mm')}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Manager</div>
              <div class="meta-value">${s.managerName || 'Pending Assignment'}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Status</div>
              <span class="status ${s.status}">${s.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <hr />
          <div class="note">Form responses are stored securely in the system. Contact your manager for the full detailed report.</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#F27D26] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[#141414]/40 animate-pulse">Loading assessments...</p>
      </div>
    );
  }

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
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Manager</th>
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
                        {s.managerName || <span className="italic opacity-40">Pending Review</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.open(`/dashboard/manager/review/${s.id}`, '_blank')}
                            className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all" 
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handlePrint(s)}
                            className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all" 
                            title="Print"
                          >
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
