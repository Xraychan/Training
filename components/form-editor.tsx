'use client';

import { useState, useEffect } from 'react';
import { 
  FormTemplate, 
  FormPage, 
  FormQuestion, 
  FormSection, 
  QuestionType 
} from '@/lib/types';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Settings2, 
  Type, 
  Hash, 
  Calendar, 
  List, 
  CheckSquare, 
  CircleDot,
  AlignLeft,
  Layout,
  Heading,
  Save,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, Reorder } from 'motion/react';

interface FormEditorProps {
  initialTemplate?: FormTemplate;
  onSave: (template: FormTemplate) => void;
  onCancel: () => void;
}

export default function FormEditor({ initialTemplate, onSave, onCancel }: FormEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [template, setTemplate] = useState<FormTemplate>(initialTemplate || {
    id: uuidv4(),
    title: 'New Assessment Form',
    description: '',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [{ id: uuidv4(), sections: [] }]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const activePage = template.pages[activePageIndex];

  if (!mounted) return null;

  const updateTemplate = (updates: Partial<FormTemplate>) => {
    setTemplate(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
  };

  const addPage = () => {
    const newPage: FormPage = { id: uuidv4(), sections: [] };
    updateTemplate({ pages: [...template.pages, newPage] });
    setActivePageIndex(template.pages.length);
  };

  const removePage = (index: number) => {
    if (template.pages.length <= 1) return;
    const newPages = template.pages.filter((_, i) => i !== index);
    updateTemplate({ pages: newPages });
    setActivePageIndex(Math.max(0, index - 1));
  };

  const addItem = (type: 'QUESTION' | 'SECTION', qType?: QuestionType) => {
    const newItem: any = type === 'SECTION' 
      ? { id: uuidv4(), title: 'New Section', description: '' } as FormSection
      : { 
          id: uuidv4(), 
          type: qType || QuestionType.TEXT, 
          label: 'New Question', 
          required: false,
          description: '',
          placeholder: '',
          prefilledValue: ''
        } as FormQuestion;

    const newPages = [...template.pages];
    newPages[activePageIndex].sections.push(newItem);
    updateTemplate({ pages: newPages });
    setEditingItemId(newItem.id);
  };

  const updateItem = (itemId: string, updates: any) => {
    const newPages = [...template.pages];
    const page = newPages[activePageIndex];
    const index = page.sections.findIndex(item => item.id === itemId);
    if (index !== -1) {
      page.sections[index] = { ...page.sections[index], ...updates };
      updateTemplate({ pages: newPages });
    }
  };

  const removeItem = (itemId: string) => {
    const newPages = [...template.pages];
    newPages[activePageIndex].sections = newPages[activePageIndex].sections.filter(item => item.id !== itemId);
    updateTemplate({ pages: newPages });
    if (editingItemId === itemId) setEditingItemId(null);
  };

  const moveItem = (index: number, direction: 'UP' | 'DOWN') => {
    const newPages = [...template.pages];
    const items = [...newPages[activePageIndex].sections];
    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    newPages[activePageIndex].sections = items;
    updateTemplate({ pages: newPages });
  };

  return (
    <div className="flex flex-col h-full bg-[#E4E3E0]">
      {/* Header */}
      <header className="bg-white border-b border-[#141414]/10 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-[#141414]/5 rounded transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <input
              type="text"
              value={template.title}
              onChange={(e) => updateTemplate({ title: e.target.value })}
              className="text-lg font-bold bg-transparent border-b border-transparent focus:border-[#F27D26] focus:outline-none px-1"
            />
            <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold">Drafting Assessment Template</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all">
            <Eye size={14} />
            Preview
          </button>
          <button 
            onClick={() => onSave(template)}
            className="flex items-center gap-2 px-6 py-2 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all"
          >
            <Save size={14} />
            Save Template
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Controls */}
        <aside className="w-72 bg-white border-r border-[#141414]/10 p-6 flex flex-col gap-8 overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Structure</h3>
            <div className="space-y-2">
              <button 
                onClick={() => addItem('SECTION')}
                className="w-full flex items-center gap-3 p-3 border border-[#141414]/10 hover:border-[#141414] transition-all text-sm font-medium group"
              >
                <Heading size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" />
                Section Header
              </button>
              <button 
                onClick={addPage}
                className="w-full flex items-center gap-3 p-3 border border-[#141414]/10 hover:border-[#141414] transition-all text-sm font-medium group"
              >
                <Layout size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" />
                New Page Break
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Questions</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { type: QuestionType.TEXT, label: 'Short Text', icon: Type },
                { type: QuestionType.TEXTAREA, label: 'Long Text', icon: AlignLeft },
                { type: QuestionType.NUMBER, label: 'Number', icon: Hash },
                { type: QuestionType.DATE, label: 'Date', icon: Calendar },
                { type: QuestionType.SELECT, label: 'Dropdown', icon: List },
                { type: QuestionType.RADIO, label: 'Single Choice', icon: CircleDot },
                { type: QuestionType.CHECKBOX, label: 'Multiple Choice', icon: CheckSquare },
              ].map((q) => (
                <button 
                  key={q.type}
                  onClick={() => addItem('QUESTION', q.type)}
                  className="flex items-center gap-3 p-3 border border-[#141414]/10 hover:border-[#141414] transition-all text-sm font-medium group"
                >
                  <q.icon size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" />
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Page Tabs */}
            <div className="flex items-center gap-2 border-b border-[#141414]/10 mb-8 overflow-x-auto pb-px">
              {template.pages.map((page, idx) => (
                <div key={page.id} className="flex items-center group">
                  <button
                    onClick={() => setActivePageIndex(idx)}
                    className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${
                      activePageIndex === idx 
                        ? 'border-[#141414] text-[#141414]' 
                        : 'border-transparent text-[#141414]/40 hover:text-[#141414]'
                    }`}
                  >
                    Page {idx + 1}
                  </button>
                  {template.pages.length > 1 && (
                    <button 
                      onClick={() => removePage(idx)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 transition-all rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Page Content */}
            <div className="space-y-4">
              {activePage.sections.length === 0 ? (
                <div className="border-2 border-dashed border-[#141414]/10 p-20 text-center">
                  <p className="text-sm italic serif text-[#141414]/30">This page is empty. Add elements from the sidebar.</p>
                </div>
              ) : (
                activePage.sections.map((item, idx) => {
                  const isEditing = editingItemId === item.id;
                  const isQuestion = 'type' in item;

                  return (
                  <motion.div
                      key={item.id}
                      layout
                      className={`bg-white border ${isEditing ? 'border-[#F27D26] shadow-lg' : 'border-[#141414]/10'} group transition-all`}
                    >
                      {/* Item Header / Preview */}
                      <div className="p-6 flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => setEditingItemId(isEditing ? null : item.id)}>
                          {isQuestion ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#141414]">{item.label}</span>
                                {item.required && <span className="text-red-500 text-xs">*</span>}
                              </div>
                              <p className="text-xs text-[#141414]/40 italic serif">{item.description || 'No description'}</p>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26]/60 mt-2">
                                {item.type} Field
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <h4 className="text-lg font-bold text-[#141414] uppercase tracking-tight">{item.title}</h4>
                              <p className="text-xs text-[#141414]/40 italic serif">{item.description || 'No description'}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveItem(idx, 'UP')} className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414]">
                            <ChevronUp size={16} />
                          </button>
                          <button onClick={() => moveItem(idx, 'DOWN')} className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414]">
                            <ChevronDown size={16} />
                          </button>
                          <button onClick={() => setEditingItemId(isEditing ? null : item.id)} className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#F27D26]">
                            <Settings2 size={16} />
                          </button>
                          <button onClick={() => removeItem(item.id)} className="p-2 hover:bg-red-50 rounded text-[#141414]/30 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Edit Panel */}
                      {isEditing && (
                        <div className="p-6 bg-[#141414]/5 border-t border-[#141414]/10 space-y-6 animate-in slide-in-from-top-2 duration-200">
                          {isQuestion ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Label</label>
                                  <input 
                                    type="text" 
                                    value={item.label}
                                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                                    className="w-full p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Description / Help Text</label>
                                  <textarea 
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                    className="w-full p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm h-20"
                                  />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Placeholder</label>
                                  <input 
                                    type="text" 
                                    value={item.placeholder}
                                    onChange={(e) => updateItem(item.id, { placeholder: e.target.value })}
                                    className="w-full p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Prefilled Value</label>
                                  <input 
                                    type="text" 
                                    value={item.prefilledValue}
                                    onChange={(e) => updateItem(item.id, { prefilledValue: e.target.value })}
                                    className="w-full p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm"
                                  />
                                </div>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={item.required}
                                      onChange={(e) => updateItem(item.id, { required: e.target.checked })}
                                      className="w-4 h-4 accent-[#141414]"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">Mandatory</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Section Title</label>
                                <input 
                                  type="text" 
                                  value={item.title}
                                  onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                  className="w-full p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/50 mb-2">Section Description</label>
                                <textarea 
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                  className="w-full p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm h-20"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
