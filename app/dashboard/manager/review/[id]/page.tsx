'use client';

import { useState, useEffect, useRef } from 'react';
import { store } from '@/lib/store';
import { FormSubmission, FormTemplate, QuestionType } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Printer, 
  Download,
  MessageSquare,
  User as UserIcon,
  Calendar,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReviewSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [submission] = useState<FormSubmission | null>(() => {
    const id = params.id as string;
    return store.getSubmissions().find(s => s.id === id) || null;
  });
  
  const [template] = useState<FormTemplate | null>(() => {
    if (!submission) return null;
    return store.getTemplates().find(t => t.id === submission.templateId) || null;
  });

  const [comment, setComment] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!submission || !template) {
      router.push('/dashboard/manager/queue');
    }
  }, [submission, template, router]);

  const handleAction = (status: 'APPROVED' | 'REJECTED') => {
    if (!submission || !user) return;
    
    const updated: FormSubmission = {
      ...submission,
      status,
      managerId: user.id,
      managerName: user.name,
      summary: comment
    };
    
    store.updateSubmission(updated);
    router.push('/dashboard/manager/queue');
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Assessment_${submission?.trainerName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  if (!submission || !template) return null;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/dashboard/manager/queue')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#141414] transition-colors">
          <ArrowLeft size={16} />
          Back to Queue
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all"
          >
            <Printer size={20} />
          </button>
          <button 
            onClick={exportPDF}
            className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414] transition-all"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Review Content */}
        <div className="lg:col-span-2 space-y-8">
          <div ref={reportRef} className="bg-white border border-[#141414]/10 p-8 lg:p-12 shadow-sm">
            {/* Report Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12 border-b border-[#141414]/10 pb-8">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-[#141414] text-white flex items-center justify-center rounded mb-4">
                  <FileText size={24} />
                </div>
                <h1 className="text-2xl font-bold text-[#141414] tracking-tight">{template.title}</h1>
                <p className="text-xs text-[#141414]/40 font-mono uppercase">Submission ID: {submission.id.slice(0, 8)}</p>
              </div>
              <div className="space-y-4 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414]/5 rounded border border-[#141414]/10 text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
                  Status: {submission.status}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Submitted On</p>
                  <p className="text-sm font-bold text-[#141414]">{format(new Date(submission.submittedAt), 'PPP p')}</p>
                </div>
              </div>
            </div>

            {/* Trainer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 bg-[#141414]/5 p-6 border border-[#141414]/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white border border-[#141414]/10 rounded-full flex items-center justify-center text-[#141414]/40">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Trainer</p>
                  <p className="text-sm font-bold text-[#141414]">{submission.trainerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white border border-[#141414]/10 rounded-full flex items-center justify-center text-[#141414]/40">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Department</p>
                  <p className="text-sm font-bold text-[#141414]">Emergency Medicine</p>
                </div>
              </div>
            </div>

            {/* Answers */}
            <div className="space-y-10">
              {template.pages.map((page, pIdx) => (
                <div key={page.id} className="space-y-8">
                  {template.pages.length > 1 && (
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30 whitespace-nowrap">Section {pIdx + 1}</span>
                      <div className="h-px bg-[#141414]/10 w-full" />
                    </div>
                  )}
                  {page.sections.map((item) => {
                    const isQuestion = 'type' in item;
                    if (!isQuestion) {
                      return (
                        <div key={item.id} className="pt-4">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414]/10 pb-2 mb-4">{item.title}</h3>
                        </div>
                      );
                    }
                    return (
                      <div key={item.id} className="space-y-2">
                        <p className="text-xs font-bold text-[#141414]/60">{item.label}</p>
                        <div className="text-sm text-[#141414] border-l-2 border-[#141414]/10 pl-4 py-1 italic serif">
                          {(() => {
                            const value = submission.answers[item.id];
                            if (!value) return <span className="opacity-30">No answer provided</span>;
                            
                            if (item.type === QuestionType.DATE) {
                              try {
                                return format(new Date(value), item.dateTimeConfig?.format === '24H' ? 'PPP HH:mm' : 'PPP p');
                              } catch (e) {
                                return value;
                              }
                            }
                            
                            return value;
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-[#141414]/10 p-6 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-6 flex items-center gap-2">
              <MessageSquare size={14} className="text-[#F27D26]" />
              Manager Feedback
            </h3>
            
            {submission.status === 'PENDING' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Comments / Notes</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your review notes here..."
                    className="w-full p-3 bg-[#141414]/5 border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm h-40 italic serif"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                  <button 
                    onClick={() => handleAction('APPROVED')}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 transition-all"
                  >
                    <CheckCircle2 size={16} />
                    Approve Assessment
                  </button>
                  <button 
                    onClick={() => handleAction('REJECTED')}
                    className="w-full flex items-center justify-center gap-2 py-4 border border-red-500 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all"
                  >
                    <XCircle size={16} />
                    Reject & Request Resubmission
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pt-4 border-t border-[#141414]/5">
                <div className={`flex items-center gap-3 p-4 rounded border ${
                  submission.status === 'APPROVED' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {submission.status === 'APPROVED' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Final Decision</p>
                    <p className="text-sm font-bold">{submission.status}</p>
                  </div>
                </div>
                
                {submission.summary && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Manager Comments</p>
                    <p className="text-sm italic serif text-[#141414]/60 bg-[#141414]/5 p-4 border-l-2 border-[#141414]/10">
                      "{submission.summary}"
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-[#141414]/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Assessed By</p>
                  <p className="text-sm font-bold text-[#141414]">{submission.managerName || 'System'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#141414] text-white p-6">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] mb-2">Manager Guidelines</h4>
            <p className="text-xs opacity-60 italic serif leading-relaxed">
              Please ensure all mandatory clinical competencies are met before approval. If any critical errors are found, reject with specific feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
