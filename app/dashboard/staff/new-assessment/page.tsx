'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { FormTemplate } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function StaffNewAssessmentPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>(() => store.getTemplates());

  useEffect(() => {
    // Data is initialized in useState
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#141414] tracking-tight">New Assessment</h1>
        <p className="text-[#141414]/50 italic serif">Select a competency or training form to begin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-[#141414]/10 p-8 hover:border-[#F27D26] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-[#141414]/5 rounded text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                  <FileText size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30">Available</span>
              </div>
              <h3 className="text-xl font-bold text-[#141414] mb-2">{template.title}</h3>
              <p className="text-sm text-[#141414]/60 italic serif mb-8">
                {template.description || 'Complete this assessment to update your certification status.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#141414]/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">
                  <Clock size={12} />
                  ~15 mins
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">
                  <CheckCircle2 size={12} />
                  Required
                </div>
              </div>
              <button 
                onClick={() => router.push(`/dashboard/staff/assessment/${template.id}`)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#141414] hover:text-[#F27D26] transition-colors"
              >
                Start Now
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
