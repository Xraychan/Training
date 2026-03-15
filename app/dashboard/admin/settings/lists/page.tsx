'use client';

import { useState, useEffect, useRef } from 'react';
import { GlobalList } from '@/lib/types';
import { 
  Plus, Edit2, Trash2, X, Database,
  Search, Upload, MoreVertical, MinusCircle, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalListsPage() {
  const [lists, setLists] = useState<GlobalList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<GlobalList | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [sorting, setSorting] = useState<'NONE' | 'ASC' | 'DESC'>('NONE');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchLists = async () => {
    try {
      const res = await fetch('/api/global-lists', { credentials: 'include' });
      const data = await res.json();
      setLists(data.globalLists || []);
    } catch (e) {
      console.error('Failed to load global lists', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const applySorting = (listItems: string[], sortOrder: 'NONE' | 'ASC' | 'DESC', caseSensitive: boolean) => {
    if (sortOrder === 'NONE') return listItems;
    return [...listItems].sort((a, b) => {
      const valA = caseSensitive ? a : a.toLowerCase();
      const valB = caseSensitive ? b : b.toLowerCase();
      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  };

  const handleOpenModal = (list?: GlobalList) => {
    if (list) {
      setEditingList(list);
      setName(list.name);
      setItems([...list.items]);
      setSorting(list.sorting || 'NONE');
      setIsCaseSensitive(list.isCaseSensitive || false);
    } else {
      setEditingList(null);
      setName('');
      setItems([]);
      setSorting('NONE');
      setIsCaseSensitive(false);
    }
    setIsModalOpen(true);
  };

  const isDuplicate = (value: string, currentItems: string[]) => {
    const compare = isCaseSensitive ? value : value.toLowerCase();
    return currentItems.some(item => (isCaseSensitive ? item : item.toLowerCase()) === compare);
  };

  const addItemToList = () => {
    if (!newItem.trim()) return;
    if (isDuplicate(newItem.trim(), items)) {
      setDuplicateWarning(`"${newItem.trim()}" already exists in the list.`);
      setTimeout(() => setDuplicateWarning(''), 3000);
      return;
    }
    setDuplicateWarning('');
    const nextItems = [...items, newItem.trim()];
    setItems(applySorting(nextItems, sorting, isCaseSensitive));
    setNewItem('');
  };

  const removeItemFromList = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItemInList = (idx: number, val: string) => {
    const next = [...items];
    next[idx] = val;
    setItems(next);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const imported = text.split(/[\n,]/).map(item => item.trim()).filter(item => item.length > 0 && item !== 'name' && item !== 'value');
      const unique: string[] = [];
      const seen = new Set<string>();
      for (const item of imported) {
        const key = isCaseSensitive ? item : item.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(item); }
      }
      setItems(applySorting(unique, sorting, isCaseSensitive));
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const findDuplicates = (arr: string[]) => {
    const seen = new Map<string, number>();
    for (const item of arr) {
      const key = isCaseSensitive ? item : item.toLowerCase();
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    return [...seen.entries()].filter(([_, count]) => count > 1).map(([key]) => key);
  };

  // ── Save (Create or Update) ─────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dupes = findDuplicates(items);
    if (dupes.length > 0) {
      window.alert(`Duplicate choices found:\n\n${dupes.join('\n')}\n\nPlease remove duplicates before saving.`);
      return;
    }

    const sortedItems = applySorting(items, sorting, isCaseSensitive);
    setIsSaving(true);

    try {
      if (editingList) {
        const res = await fetch('/api/global-lists', { credentials: 'include',
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingList.id, name, items: sortedItems, sorting, isCaseSensitive }),
        });
        if (!res.ok) throw new Error('Failed to update list');
      } else {
        const res = await fetch('/api/global-lists', { credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, items: sortedItems, sorting, isCaseSensitive }),
        });
        if (!res.ok) {
          const data = await res.json();
          window.alert(data.error || 'Failed to create list');
          return;
        }
      }
      await fetchLists();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/global-lists', { credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setLists(prev => prev.filter(l => l.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const filteredLists = lists.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center h-64 text-[#141414]/40 text-sm">Loading lists...</div>;

  return (
    <div className="max-w-6xl space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight uppercase">Global Selection Lists</h1>
          <p className="text-[#141414]/50 italic serif">Create reusable lists for form dropdowns and choice fields.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(242,125,38,0.2)]"
        >
          <Plus size={18} />
          Create New List
        </button>
      </div>

      <div className="bg-white border border-[#141414]/10 p-4 flex items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
          <input
            type="text"
            placeholder="Search lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/10 focus:outline-none focus:border-[#F27D26] transition-colors text-sm"
          />
        </div>
      </div>

      {filteredLists.length === 0 ? (
        <div className="bg-white border border-[#141414]/10 p-20 text-center">
          <p className="text-sm italic serif text-[#141414]/30">No lists found. Create your first global list!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredLists.map((list) => (
              <motion.div
                key={list.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-[#141414]/10 p-6 group hover:border-[#F27D26] transition-all flex flex-col shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-[#141414]/5 rounded text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                    <Database size={24} />
                  </div>
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(list)} className="p-2 text-[#141414]/30 hover:text-[#141414]"><Edit2 size={16} /></button>
                    {confirmDeleteId === list.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(list.id)} className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold rounded hover:bg-red-600">Delete?</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="p-1 text-[#141414]/30 hover:text-[#141414]"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(list.id); }} className="p-2 text-[#141414]/30 hover:text-red-500"><Trash2 size={16} /></button>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#141414] uppercase tracking-tight mb-2">{list.name}</h3>
                <div className="flex items-center gap-4 mb-6">
                  <p className="text-[10px] text-[#141414]/40 font-bold uppercase tracking-widest">{list.items.length} Options</p>
                  {list.sorting !== 'NONE' && (
                    <span className="text-[9px] px-2 py-0.5 bg-orange-50 text-[#F27D26] font-bold rounded uppercase tracking-tighter border border-[#F27D26]/20">Sorted {list.sorting}</span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex flex-wrap gap-1.5">
                    {list.items.slice(0, 8).map(item => (
                      <span key={item} className="px-2 py-1 bg-[#141414]/5 text-[9px] font-bold uppercase tracking-tight text-[#141414]/60">{item}</span>
                    ))}
                    {list.items.length > 8 && <span className="text-[9px] font-bold text-[#141414]/20">+{list.items.length - 8} more</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-[#E4E3E0]/80 backdrop-blur-sm" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-2xl bg-[#FCFBFA] border border-[#141414]/10 shadow-2xl overflow-hidden rounded-xl">
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-[#141414]">{editingList ? 'Update List' : 'Create List'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-[#141414]/30 hover:text-[#141414] transition-colors"><X size={24} /></button>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-rose-800 opacity-60">List Name</label>
                    <input
                      autoFocus
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 50))}
                      placeholder="e.g. RP Name List"
                      className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-lg font-medium text-[#141414]"
                    />
                    <p className="text-[11px] text-[#141414]/30">(Maximum 50 characters)</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-[#141414]/80">Sort Choices</label>
                      <select
                        value={sorting}
                        onChange={(e) => { const val = e.target.value as any; setSorting(val); setItems(applySorting(items, val, isCaseSensitive)); }}
                        className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                      >
                        <option value="NONE">No Sorting</option>
                        <option value="ASC">Ascending</option>
                        <option value="DESC">Descending</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 flex items-center justify-center border-2 transition-all ${isCaseSensitive ? 'bg-[#009688] border-[#009688]' : 'border-[#141414]/20'}`}>
                        {isCaseSensitive && <X size={14} className="text-white" />}
                        <input type="checkbox" className="hidden" checked={isCaseSensitive} onChange={(e) => { const val = e.target.checked; setIsCaseSensitive(val); setItems(applySorting(items, sorting, val)); }} />
                      </div>
                      <span className="text-sm font-semibold text-[#141414]/80 group-hover:text-[#141414]">Case Sensitive</span>
                    </label>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-[#141414]/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-rose-800 opacity-60 uppercase tracking-widest">Choices</h4>
                      <div className="flex items-center gap-4">
                        <input type="file" ref={fileInputRef} onChange={handleCsvImport} accept=".csv,.txt" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold text-[#F27D26] hover:opacity-70 transition-opacity">
                          <Upload size={16} /> Import
                        </button>
                        <button type="button" className="text-[#141414]/30 hover:text-[#141414]"><MoreVertical size={16} /></button>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 group">
                          <div className="flex-1">
                            <input type="text" value={item} onChange={(e) => updateItemInList(idx, e.target.value)} className="w-full p-2.5 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:border-[#F27D26] text-sm" />
                          </div>
                          <button type="button" onClick={() => removeItemFromList(idx)} className="text-rose-400 hover:text-rose-600 p-1"><MinusCircle size={20} /></button>
                          <button type="button" onClick={addItemToList} className="text-[#141414]/20 hover:text-[#F27D26] p-1"><PlusCircle size={20} /></button>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="py-12 text-center bg-[#141414]/5 rounded-xl border-2 border-dashed border-[#141414]/10">
                          <p className="text-sm text-[#141414]/30 italic">No choices added yet. Import a list or add manually.</p>
                        </div>
                      )}
                    </div>

                    {duplicateWarning && (
                      <div className="w-full px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-600 flex items-center gap-2">
                        ⚠️ {duplicateWarning}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItemToList())}
                        placeholder="Type new choice here..."
                        className="flex-1 p-3 bg-white border border-[#141414]/10 rounded-md focus:border-[#F27D26] focus:outline-none text-sm"
                      />
                      <button type="button" onClick={addItemToList} className="bg-[#141414] text-white px-6 rounded-md hover:bg-[#F27D26] transition-colors font-bold text-sm">Add</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-6 pb-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-3 bg-white border border-[#141414]/10 rounded-full text-sm font-semibold text-[#141414] hover:bg-[#141414]/5 transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSaving} className="flex-1 bg-[#141414] text-white py-3 rounded-full text-sm font-bold hover:bg-[#F27D26] transition-all shadow-lg shadow-[#141414]/10 disabled:opacity-50">
                      {isSaving ? 'Saving...' : `${editingList ? 'Update' : 'Create'} List`}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
