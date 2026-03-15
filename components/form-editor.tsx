'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FormTemplate, 
  FormPage, 
  FormQuestion, 
  FormSection, 
  QuestionType,
  GlobalList
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
  Eye,
  Check,
  Globe2,
  Database,
  X,
  Upload,
  Download,
  GripVertical,
  Palette
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FORM_THEMES, THEME_META } from '@/lib/themes';

interface FormEditorProps {
  initialTemplate?: FormTemplate;
  onSave: (template: FormTemplate) => void;
  onCancel: () => void;
}

export default function FormEditor({ initialTemplate, onSave, onCancel }: FormEditorProps) {
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [globalLists, setGlobalLists] = useState<GlobalList[]>([]);

  useEffect(() => {
    fetch('/api/global-lists')
      .then(res => res.json())
      .then(data => setGlobalLists(data.globalLists || []))
      .catch(e => console.error('Failed to load global lists', e));
  }, []);
  const [template, setTemplate] = useState<FormTemplate>(initialTemplate || {
    id: uuidv4(),
    title: 'New Assessment Form',
    description: '',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pages: [{ 
      id: uuidv4(), 
      sections: [
        { id: 'section-id-meta', title: 'Identification', description: 'Trainee Information' } as FormSection,
        { 
          id: '__trainee_group__', 
          type: QuestionType.SELECT, 
          label: 'Assessed Group', 
          required: true,
          useGlobalList: true,
          globalListId: 'list-group-global' // Placeholder, will create if needed
        } as FormQuestion,
        { 
          id: '__trainee_name__', 
          type: QuestionType.SELECT, 
          label: 'Assessed Name', 
          required: true,
          useGlobalList: true,
          globalListId: 'list-name-global' // Placeholder, will create if needed
        } as FormQuestion
      ] 
    }]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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
          required: qType === QuestionType.YES_NO,
          description: '',
          prefilledValue: qType === QuestionType.YES_NO ? 'Yes' : '',
          options: qType === QuestionType.YES_NO ? ['Yes', 'No'] : []
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
      
      // Default Date-Time config if switching to DATE or if not present
      const item = page.sections[index];
      if ('type' in item && item.type === QuestionType.DATE && !item.dateTimeConfig) {
        item.dateTimeConfig = {
          format: '24H',
          minuteInterval: 1,
          autofill: true,
          displayStyle: 'POPUP',
          weekStartsOn: 'Sunday',
          allowedDays: 'ALL'
        };
      }
      
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
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;
    
    const newPages = [...template.pages];
    const items = [...newPages[activePageIndex].sections];
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destIndex, 0, reorderedItem);
    
    newPages[activePageIndex].sections = items;
    updateTemplate({ pages: newPages });
  };
  
  const handleAddOption = (itemId: string, options: string[] = []) => {
    updateItem(itemId, { options: [...options, 'New Option'] });
  };

  const handleUpdateOption = (itemId: string, options: string[], index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateItem(itemId, { options: newOptions });
  };

  const handleRemoveOption = (itemId: string, options: string[], index: number) => {
    updateItem(itemId, { options: options.filter((_, i) => i !== index) });
  };

  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Question/Label,Type (Optional),Required (Optional),Options (Optional)\nWhat is your full name?,TEXT,TRUE,\nDid you wash your hands?,,, \nChoose your department,SELECT,TRUE,HR|Engineering|Sales\nBackground Information,SECTION,,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Form_Builder_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length < 2) return; // Need at least header + 1 row
      
      const newItems: any[] = [];
      
      // Start from 1 to skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Robust CSV parsing to handle commas inside quotes
        const columns: string[] = [];
        let currentColumn = '';
        let insideQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' && line[j + 1] === '"') {
            // Escaped quote
            currentColumn += '"';
            j++; 
          } else if (char === '"') {
            // Toggle quote state
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            // End of column
            columns.push(currentColumn);
            currentColumn = '';
          } else {
            currentColumn += char;
          }
        }
        columns.push(currentColumn); // Push the last column

        if (columns.length < 1) continue; // Need at least a Label

        let label = columns[0].trim();
        const rawType = (columns[1] || '').trim().toUpperCase();
        
        const requiredStr = (columns[2] || '').trim().toUpperCase();
        const required = requiredStr === 'TRUE' || requiredStr === 'YES' || requiredStr === '1';
        
        const optionsStr = (columns[3] || '').trim();
        let options: string[] = [];
        if (optionsStr) {
          options = optionsStr.split('|').map(o => o.trim()).filter(Boolean);
        }

        const id = uuidv4();

        if (rawType === 'SECTION') {
          newItems.push({
            id,
            title: label,
            description: ''
          } as FormSection);
        } else {
          // Validate QuestionType - Default to YES_NO
          const validTypes = Object.values(QuestionType);
          let type = QuestionType.YES_NO; // Default
          
          if (rawType && validTypes.includes(rawType as QuestionType)) {
             type = rawType as QuestionType;
          }

          let finalRequired = required;
          let finalPrefilledValue = '';

          if (type === QuestionType.YES_NO) {
             // If not explicitly set via CSV, default YES_NO to required=true and prefilledValue='Yes'
             if (!requiredStr) finalRequired = true;
             finalPrefilledValue = 'Yes';
          }

          const q: Partial<FormQuestion> = {
            id,
            type,
            label,
            required: finalRequired,
            description: '',
            prefilledValue: finalPrefilledValue
          };

          if ([QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX].includes(type)) {
            q.options = options.length > 0 ? options : ['Option 1'];
            q.useGlobalList = false;
          } else if (type === QuestionType.YES_NO) {
             q.options = ['Yes', 'No'];
          } else if (type === QuestionType.DATE) {
            q.dateTimeConfig = {
              format: '24H',
              minuteInterval: 1,
              autofill: true,
              displayStyle: 'POPUP',
              weekStartsOn: 'Sunday',
              allowedDays: 'ALL'
            };
          }

          newItems.push(q as FormQuestion);
        }
      }

      const newPages = [...template.pages];
      newPages[activePageIndex].sections = [...newPages[activePageIndex].sections, ...newItems];
      updateTemplate({ pages: newPages });
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-full bg-[#E4E3E0]">
      {/* Header */}
      <header className="bg-white border-b border-[#141414]/10 p-4 flex items-center justify-between sticky top-0 z-[110] shadow-sm">
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
          <button 
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all"
          >
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
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-[#141414]/10 p-6 flex flex-col gap-8 overflow-y-auto">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Structure</h3>
            <div className="space-y-2">
              <button onClick={() => addItem('SECTION')} className="w-full flex items-center gap-3 p-3 border border-[#141414]/10 hover:border-[#141414] transition-all text-sm font-medium group">
                <Heading size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" /> Section Header
              </button>
              <button onClick={addPage} className="w-full flex items-center gap-3 p-3 border border-[#141414]/10 hover:border-[#141414] transition-all text-sm font-medium group">
                <Layout size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" /> New Page Break
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4 flex items-center justify-between">
              Bulk Actions
            </h3>
            <div className="space-y-2">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full flex items-center gap-3 p-3 border border-dashed border-[#141414]/20 hover:border-[#F27D26] hover:bg-[#F27D26]/5 transition-all text-sm font-medium group"
              >
                <Upload size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" /> 
                <span className="group-hover:text-[#F27D26]">Import CSV</span>
              </button>
              <button 
                onClick={downloadCSVTemplate} 
                className="w-full flex flex-col items-start gap-1 p-3 border border-[#141414]/10 hover:bg-[#141414]/5 transition-all group"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#141414]/60 group-hover:text-[#141414]">
                  <Download size={12} /> Download Template
                </div>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4">Questions</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { type: QuestionType.TEXTAREA, label: 'Long Text', icon: AlignLeft },
                { type: QuestionType.YES_NO, label: 'Yes / No', icon: CircleDot },
                { type: QuestionType.SELECT, label: 'Dropdown', icon: List },
                { type: QuestionType.CHECKBOX, label: 'Multiple Choice', icon: CheckSquare },
                { type: QuestionType.DATE, label: 'Date', icon: Calendar },
                { type: QuestionType.NUMBER, label: 'Number', icon: Hash },
              ].map((q) => (
                <button key={q.type} onClick={() => addItem('QUESTION', q.type)} className="flex items-center gap-3 p-3 border border-[#141414]/10 hover:border-[#141414] transition-all text-sm font-medium group">
                  <q.icon size={18} className="text-[#141414]/40 group-hover:text-[#F27D26]" /> {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Picker */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-4 flex items-center gap-2">
              <Palette size={12} /> Theme
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {FORM_THEMES.map((theme) => {
                const meta = THEME_META[theme.id];
                const isActive = (template.themeId ?? 'default') === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => updateTemplate({ themeId: theme.id })}
                    className={`w-full text-left p-3 border-2 transition-all ${
                      isActive
                        ? 'border-[#F27D26]'
                        : 'border-[#141414]/10 hover:border-[#141414]/40'
                    }`}
                  >
                    {/* Mini visual preview */}
                    <div
                      className="w-full h-10 rounded mb-2 flex items-end overflow-hidden"
                      style={{ background: theme.backgroundColor }}
                    >
                      <div className="w-full h-7 flex items-center px-2 gap-1" style={{ background: theme.cardColor }}>
                        <div className="w-8 h-1.5 rounded-full" style={{ background: theme.accentColor }} />
                        <div className="flex-1 h-1 rounded-full opacity-30" style={{ background: theme.fontColor }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#141414]">{meta.name}</span>
                      {isActive && <span className="text-[10px] text-[#F27D26] font-bold uppercase tracking-widest">Active</span>}
                    </div>
                    <p className="text-[10px] text-[#141414]/40 mt-0.5">{meta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-2 border-b border-[#141414]/10 mb-8 overflow-x-auto pb-px">
              {template.pages.map((page, idx) => (
                <div key={page.id} className="flex items-center group">
                  <button onClick={() => setActivePageIndex(idx)} className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border-b-2 ${activePageIndex === idx ? 'border-[#141414] text-[#141414]' : 'border-transparent text-[#141414]/40 hover:text-[#141414]'}`}>Page {idx + 1}</button>
                  {template.pages.length > 1 && <button onClick={() => removePage(idx)} className="p-1 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>}
                </div>
              ))}
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="form-canvas">
                {(provided) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4 pb-20"
                  >
                    {activePage.sections.map((item, idx) => {
                      const isEditing = editingItemId === item.id;
                      const isQuestion = 'type' in item;
                      const question = item as FormQuestion;

                      return (
                        <Draggable key={item.id} draggableId={item.id} index={idx}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white border ${isEditing ? 'border-[#F27D26] shadow-xl ring-2 ring-[#F27D26]/10' : 'border-[#141414]/10'} group transition-shadow ${snapshot.isDragging ? 'shadow-2xl opacity-90 rotate-[0.5deg]' : ''}`}
                            >
                              <div className="p-6 flex items-start justify-between">
                                <div className="flex flex-1 items-start gap-3">
                                  <div 
                                    {...provided.dragHandleProps}
                                    title="Drag to reorder"
                                    className="flex flex-col items-center justify-center w-7 h-10 rounded bg-[#141414]/5 hover:bg-[#F27D26]/15 hover:text-[#F27D26] text-[#141414]/30 cursor-grab active:cursor-grabbing transition-all flex-shrink-0 mt-0.5 group/handle"
                                  >
                                    <GripVertical size={20} strokeWidth={2} />
                                  </div>
                                  <div className="flex-1 cursor-pointer" onClick={() => setEditingItemId(isEditing ? null : item.id)}>
                                    {isQuestion ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-[#141414] uppercase tracking-tight">{item.label}</span>
                                          {question.required && <span className="text-red-500 text-xs">*</span>}
                                        </div>
                                        <p className="text-xs text-[#141414]/40 italic serif">{question.description || 'No description'}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <h4 className="text-lg font-bold text-[#141414] uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-xs text-[#141414]/40 italic serif">{item.description || 'No description'}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => moveItem(idx, 'UP')} className="p-2 text-[#141414]/20 hover:text-[#141414]" title="Move Up"><ChevronUp size={16} /></button>
                                  <button onClick={() => moveItem(idx, 'DOWN')} className="p-2 text-[#141414]/20 hover:text-[#141414]" title="Move Down"><ChevronDown size={16} /></button>
                                  <button onClick={() => setEditingItemId(isEditing ? null : item.id)} className={`p-2 transition-colors ${isEditing ? 'text-[#F27D26]' : 'text-[#141414]/20 hover:text-[#141414]'}`} title="Settings"><Settings2 size={16} /></button>
                                  <button onClick={() => removeItem(item.id)} className="p-2 text-[#141414]/10 hover:text-red-500" title="Delete"><Trash2 size={16} /></button>
                                </div>
                              </div>

                    {isEditing && (
                      <div className="p-8 bg-[#F9F8F7] border-t border-[#141414]/10 space-y-8">
                        {isQuestion ? (
                          <div className="grid grid-cols-1 gap-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Label</label>
                                <input type="text" value={question.label} onChange={(e) => updateItem(item.id, { label: e.target.value })} className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm font-bold" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Instructions</label>
                                <input type="text" value={question.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm" />
                              </div>
                            </div>

                            {/* Date-Time Configuration Panel */}
                            {question.type === QuestionType.DATE && (
                              <div className="border-t border-[#141414]/5 pt-8 space-y-8 animate-in fade-in duration-500">
                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]">Date-Time Settings</h5>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div className="space-y-6">
                                    {/* Time Format */}
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-3">Time Format</label>
                                      <div className="flex bg-[#141414]/5 p-1 rounded w-fit">
                                        {['12H', '24H'].map(f => (
                                          <button 
                                            key={f}
                                            onClick={() => updateItem(question.id, { dateTimeConfig: { ...question.dateTimeConfig, format: f } })}
                                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${question.dateTimeConfig?.format === f ? 'bg-white shadow-sm text-[#F27D26]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                                          >
                                            {f === '12H' ? '12 Hours' : '24 Hours'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Minute Interval */}
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-3">Minute Interval</label>
                                      <div className="flex flex-wrap gap-2">
                                        {[1, 5, 10, 15, 30].map(m => (
                                          <button 
                                            key={m}
                                            onClick={() => updateItem(question.id, { dateTimeConfig: { ...question.dateTimeConfig, minuteInterval: m } })}
                                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${question.dateTimeConfig?.minuteInterval === m ? 'border-[#F27D26] text-[#F27D26] bg-[#F27D26]/5' : 'border-[#141414]/10 text-[#141414]/40 hover:border-[#141414]'}`}
                                          >
                                            {m}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Autofill */}
                                    <div className="flex items-center gap-3 py-2">
                                      <div 
                                        onClick={() => updateItem(question.id, { dateTimeConfig: { ...question.dateTimeConfig, autofill: !question.dateTimeConfig?.autofill } })}
                                        className={`w-5 h-5 border-2 flex items-center justify-center transition-all cursor-pointer ${question.dateTimeConfig?.autofill ? 'bg-[#F27D26] border-[#F27D26] text-white' : 'border-[#141414]/10'}`}
                                      >
                                        {question.dateTimeConfig?.autofill && <Check size={12} />}
                                      </div>
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]">Autofill Date & Time of Response</span>
                                    </div>
                                  </div>

                                  <div className="space-y-6">
                                    {/* Display Style */}
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-3">Display Style</label>
                                      <div className="flex bg-[#141414]/5 p-1 rounded w-fit">
                                        {['INLINE', 'POPUP'].map(s => (
                                          <button 
                                            key={s}
                                            onClick={() => updateItem(question.id, { dateTimeConfig: { ...question.dateTimeConfig, displayStyle: s } })}
                                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${question.dateTimeConfig?.displayStyle === s ? 'bg-white shadow-sm text-[#F27D26]' : 'text-[#141414]/40 hover:text-[#141414]'}`}
                                          >
                                            {s === 'INLINE' ? 'Inline' : 'Pop-up'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Week Starts On */}
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Week Starts On</label>
                                      <select 
                                        value={question.dateTimeConfig?.weekStartsOn} 
                                        onChange={(e) => updateItem(question.id, { dateTimeConfig: { ...question.dateTimeConfig, weekStartsOn: e.target.value } })}
                                        className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-xs font-bold uppercase"
                                      >
                                        <option value="Sunday">Sunday</option>
                                        <option value="Monday">Monday</option>
                                      </select>
                                    </div>

                                    {/* Allowed Days */}
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Allowed Days of Week</label>
                                      <select 
                                        value={question.dateTimeConfig?.allowedDays} 
                                        onChange={(e) => updateItem(question.id, { dateTimeConfig: { ...question.dateTimeConfig, allowedDays: e.target.value } })}
                                        className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-xs font-bold uppercase"
                                      >
                                        <option value="ALL">All Days</option>
                                        <option value="WEEKDAYS">Weekdays</option>
                                        <option value="WEEKENDS">Weekends</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Prefilled Value Logic (Numeric for Number field, Hidden for choice types) */}
                            {![QuestionType.DATE, QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX, QuestionType.YES_NO].includes(question.type) && (
                              <div className="border-t border-[#141414]/5 pt-8">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">
                                  {question.type === QuestionType.TEXTAREA ? 'Default Text' : 'Initial Value'}
                                </label>
                                {question.type === QuestionType.TEXTAREA ? (
                                  <textarea 
                                    value={question.prefilledValue} 
                                    onChange={(e) => updateItem(item.id, { prefilledValue: e.target.value })}
                                    className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm h-32"
                                    placeholder="Enter initial value for the text area..."
                                  />
                                ) : (
                                  <input 
                                    type={question.type === QuestionType.NUMBER ? 'number' : 'text'}
                                    value={question.prefilledValue} 
                                    onChange={(e) => updateItem(item.id, { prefilledValue: e.target.value })}
                                    className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm"
                                  />
                                )}
                              </div>
                            )}

                            {/* Options Editor for Choice Types */}
                            {[QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX, QuestionType.YES_NO].includes(question.type) && (
                              <div className="border-t border-[#141414]/5 pt-8 space-y-6">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#141414]">Choice Configuration</h5>
                                  {question.type !== QuestionType.YES_NO && (
                                    <div className="flex bg-[#141414]/5 p-1 rounded">
                                      <button 
                                        onClick={() => updateItem(question.id, { useGlobalList: false })}
                                        className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${!question.useGlobalList ? 'bg-white shadow-sm text-[#F27D26]' : 'text-[#141414]/40'}`}
                                      >Add Manually</button>
                                      <button 
                                        onClick={() => updateItem(question.id, { useGlobalList: true })}
                                        className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all ${question.useGlobalList ? 'bg-white shadow-sm text-[#F27D26]' : 'text-[#141414]/40'}`}
                                      >Use Global List</button>
                                    </div>
                                  )}
                                </div>

                                {question.useGlobalList ? (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Choose From</label>
                                      <select 
                                        value={question.globalListId} 
                                        onChange={(e) => updateItem(question.id, { globalListId: e.target.value })}
                                        className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm font-bold"
                                      >
                                        <option value="">Select a global list...</option>
                                        {globalLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
                                      </select>
                                    </div>
                                    {question.globalListId && (
                                      <div className="bg-[#141414]/5 p-4 rounded border border-dashed border-[#141414]/10">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2 flex items-center gap-2"><Globe2 size={12} /> List Preview</p>
                                        <div className="flex flex-wrap gap-2">
                                          {globalLists.find(l => l.id === question.globalListId)?.items.map(item => <span key={item} className="px-2 py-1 bg-white border border-[#141414]/10 text-[9px] font-bold uppercase tracking-tight">{item}</span>)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {(question.options || []).map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-3">
                                        <div 
                                          onClick={() => updateItem(question.id, { prefilledValue: opt })}
                                          className={`w-6 h-6 border-2 flex items-center justify-center cursor-pointer transition-all ${question.prefilledValue === opt ? 'bg-[#F27D26] border-[#F27D26] text-white' : 'border-[#141414]/10 hover:border-[#141414]'}`}
                                        >
                                          {question.prefilledValue === opt && <Check size={12} />}
                                        </div>
                                        <input 
                                          type="text" 
                                          value={opt} 
                                          onChange={(e) => handleUpdateOption(question.id, question.options!, oIdx, e.target.value)}
                                          className="flex-1 p-2 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm"
                                          readOnly={question.type === QuestionType.YES_NO}
                                        />
                                        {question.type !== QuestionType.YES_NO && (
                                          <button onClick={() => handleRemoveOption(question.id, question.options!, oIdx)} className="p-2 text-[#141414]/20 hover:text-red-500"><Trash2 size={16} /></button>
                                        )}
                                      </div>
                                    ))}
                                    {question.type !== QuestionType.YES_NO && (
                                      <button onClick={() => handleAddOption(question.id, question.options)} className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] flex items-center gap-1 hover:underline">
                                        <Plus size={12} /> Add Manual Option
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-6 border-t border-[#141414]/5 pt-6">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${question.required ? 'bg-[#141414] border-[#141414] text-white' : 'border-[#141414]/10 group-hover:border-[#141414]'}`}>{question.required && <Check size={12} />}</div>
                                <input type="checkbox" className="hidden" checked={question.required} onChange={(e) => updateItem(question.id, { required: e.target.checked })} />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]">Mandatory Field</span>
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Section Title</label>
                              <input type="text" value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm font-bold uppercase" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Section Description</label>
                              <textarea value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} className="w-full p-3 bg-white border border-[#141414]/10 focus:border-[#F27D26] focus:outline-none text-sm h-24" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-[#141414]/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-white overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-[#141414]/10 p-6 flex items-center justify-between z-10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] mb-1">Form Preview</p>
                  <h2 className="text-2xl font-bold text-[#141414] tracking-tight">{template.title}</h2>
                  {template.description && <p className="text-sm text-[#141414]/50 italic mt-1">{template.description}</p>}
                </div>
                <button onClick={() => setShowPreview(false)} className="p-2 text-[#141414]/30 hover:text-[#141414] transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-10">
                {template.pages.map((page, pageIdx) => (
                  <div key={page.id}>
                    {template.pages.length > 1 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30 mb-6 pb-2 border-b border-[#141414]/10">Page {pageIdx + 1}</p>
                    )}
                    <div className="space-y-6">
                      {page.sections.map((item) => {
                        const isQuestion = 'type' in item;
                        if (!isQuestion) {
                          return (
                            <div key={item.id} className="pt-4 pb-2 border-b-2 border-[#141414]">
                              <h3 className="text-lg font-bold text-[#141414] uppercase tracking-tight">{item.title}</h3>
                              {item.description && <p className="text-sm text-[#141414]/50 italic mt-1">{item.description}</p>}
                            </div>
                          );
                        }
                        const q = item as any;
                        const listItems = q.useGlobalList && q.globalListId
                          ? (globalLists.find(l => l.id === q.globalListId)?.items || [])
                          : (q.options || []);
                        return (
                          <div key={q.id} className="space-y-2">
                            <label className="block text-sm font-bold text-[#141414]">
                              {q.label}
                              {q.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {q.description && <p className="text-xs text-[#141414]/40 italic">{q.description}</p>}
                            {q.type === 'TEXTAREA' && (
                              <textarea className="w-full p-3 border border-[#141414]/20 rounded bg-[#141414]/5 text-sm h-24" placeholder={q.prefilledValue || 'Enter text...'} readOnly />
                            )}
                            {q.type === 'TEXT' && (
                              <input type="text" className="w-full p-3 border border-[#141414]/20 rounded bg-[#141414]/5 text-sm" placeholder={q.prefilledValue || 'Enter text...'} readOnly />
                            )}
                            {q.type === 'NUMBER' && (
                              <input type="number" className="w-full p-3 border border-[#141414]/20 rounded bg-[#141414]/5 text-sm" placeholder={q.prefilledValue || '0'} readOnly />
                            )}
                            {q.type === 'DATE' && (
                              <input type="date" className="w-full p-3 border border-[#141414]/20 rounded bg-[#141414]/5 text-sm" readOnly />
                            )}
                            {q.type === 'YES_NO' && (
                              <div className="flex gap-4">
                                {['Yes', 'No'].map(opt => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <div className="w-4 h-4 rounded-full border-2 border-[#141414]/30" />
                                    <span className="text-sm">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {q.type === 'SELECT' && (
                              <select className="w-full p-3 border border-[#141414]/20 rounded bg-[#141414]/5 text-sm" disabled>
                                <option>Select an option...</option>
                                {listItems.map((opt: string) => <option key={opt}>{opt}</option>)}
                              </select>
                            )}
                            {q.type === 'RADIO' && (
                              <div className="space-y-2">
                                {listItems.map((opt: string) => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <div className="w-4 h-4 rounded-full border-2 border-[#141414]/30" />
                                    <span className="text-sm">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {q.type === 'CHECKBOX' && (
                              <div className="space-y-2">
                                {listItems.map((opt: string) => (
                                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <div className="w-4 h-4 border-2 border-[#141414]/30" />
                                    <span className="text-sm">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-[#141414]/10 p-4 flex justify-end gap-3">
                <button onClick={() => setShowPreview(false)} className="px-6 py-2 border border-[#141414]/20 text-sm font-bold uppercase tracking-widest hover:bg-[#141414]/5">
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
