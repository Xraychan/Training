'use client';

import { useState } from 'react';
import { 
  FormTemplate, 
  FormPage, 
  FormQuestion, 
  FormSection, 
  QuestionType,
  FormSubmission
} from '@/lib/types';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Printer, 
  Save,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface FormRendererProps {
  template: FormTemplate;
  user: any;
  onComplete: (submission: FormSubmission) => void;
  onCancel: () => void;
}

export default function FormRenderer({ template, user, onComplete, onCancel }: FormRendererProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentPage = template.pages[currentPageIndex];
  const isLastPage = currentPageIndex === template.pages.length - 1;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      const newErrors = { ...errors };
      delete newErrors[questionId];
      setErrors(newErrors);
    }
  };

  const validatePage = () => {
    const newErrors: Record<string, string> = {};
    currentPage.sections.forEach(item => {
      if ('type' in item && item.required) {
        if (!answers[item.id] && answers[item.id] !== 0) {
          newErrors[item.id] = 'This field is required';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage()) {
      if (isLastPage) {
        setShowSummary(true);
      } else {
        setCurrentPageIndex(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    } else {
      onCancel();
    }
  };

  const handleSubmit = () => {
    const submission: FormSubmission = {
      id: uuidv4(),
      templateId: template.id,
      staffId: user.id,
      staffName: user.name,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      answers,
    };
    onComplete(submission);
  };

  if (showSummary) {
    return (
      <div className="max-w-3xl mx-auto p-8 lg:p-12 space-y-12 bg-white border border-[#141414]/10 shadow-xl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#141414] text-white flex items-center justify-center rounded-full mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-3xl font-bold text-[#141414] tracking-tight">Review Your Submission</h2>
          <p className="text-[#141414]/50 italic serif">Please verify all details before final submission.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-[#141414]/10 py-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Assessment Form</p>
            <p className="font-bold text-[#141414]">{template.title}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Staff Member</p>
            <p className="font-bold text-[#141414]">{user.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Date & Time</p>
            <p className="font-bold text-[#141414]">{format(new Date(), 'PPP p')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Department</p>
            <p className="font-bold text-[#141414]">Emergency Medicine</p>
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414]">Answer Summary</h3>
          <div className="space-y-6">
            {template.pages.flatMap(p => p.sections).filter(s => 'type' in s).map((q: any) => (
              <div key={q.id} className="space-y-2">
                <p className="text-xs font-bold text-[#141414]/60">{q.label}</p>
                <p className="text-sm text-[#141414] border-l-2 border-[#141414]/10 pl-4 py-1">
                  {answers[q.id] || <span className="italic text-[#141414]/30">Not answered</span>}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-[#141414]/10">
          <button 
            onClick={handleBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all"
          >
            <ChevronLeft size={16} />
            Back to Edit
          </button>
          <button 
            onClick={handleSubmit}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all"
          >
            <Save size={16} />
            Submit Assessment
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all">
            <Printer size={16} />
            Print Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-[#141414]/10 shadow-xl overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1 bg-[#141414]/5 w-full">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentPageIndex + 1) / template.pages.length) * 100}%` }}
          className="h-full bg-[#F27D26]"
        />
      </div>

      <div className="p-8 lg:p-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-2xl font-bold text-[#141414] tracking-tight">{template.title}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mt-1">
              Page {currentPageIndex + 1} of {template.pages.length}
            </p>
          </div>
          <button onClick={onCancel} className="text-[#141414]/30 hover:text-red-500 transition-colors">
            Cancel
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {currentPage.sections.map((item) => {
              const isQuestion = 'type' in item;

              if (!isQuestion) {
                return (
                  <div key={item.id} className="space-y-2 border-l-4 border-[#141414] pl-6 py-2">
                    <h3 className="text-xl font-bold text-[#141414] uppercase tracking-tight">{item.title}</h3>
                    <p className="text-sm text-[#141414]/60 italic serif">{item.description}</p>
                  </div>
                );
              }

              return (
                <div key={item.id} className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-[#141414] flex items-center gap-1">
                        {item.label}
                        {item.required && <span className="text-red-500">*</span>}
                      </label>
                      {item.description && (
                        <p className="text-xs text-[#141414]/50 italic serif">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    {item.type === QuestionType.TEXT && (
                      <input
                        type="text"
                        value={answers[item.id] || ''}
                        onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                        placeholder={item.placeholder}
                        className={`w-full p-4 bg-[#141414]/5 border-b-2 ${errors[item.id] ? 'border-red-500' : 'border-[#141414]/10'} focus:border-[#F27D26] focus:outline-none transition-colors text-sm`}
                      />
                    )}

                    {item.type === QuestionType.TEXTAREA && (
                      <textarea
                        value={answers[item.id] || ''}
                        onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                        placeholder={item.placeholder}
                        className={`w-full p-4 bg-[#141414]/5 border-b-2 ${errors[item.id] ? 'border-red-500' : 'border-[#141414]/10'} focus:border-[#F27D26] focus:outline-none transition-colors text-sm h-32`}
                      />
                    )}

                    {item.type === QuestionType.DATE && (
                      <input
                        type="date"
                        value={answers[item.id] || ''}
                        onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                        className={`w-full p-4 bg-[#141414]/5 border-b-2 ${errors[item.id] ? 'border-red-500' : 'border-[#141414]/10'} focus:border-[#F27D26] focus:outline-none transition-colors text-sm`}
                      />
                    )}

                    {errors[item.id] && (
                      <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                        <AlertCircle size={10} />
                        {errors[item.id]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-16 pt-8 border-t border-[#141414]/10">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#141414] transition-colors"
          >
            <ArrowLeft size={16} />
            {currentPageIndex === 0 ? 'Cancel' : 'Previous'}
          </button>
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-4 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all"
          >
            {isLastPage ? 'Review Summary' : 'Next Step'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
