'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Department, TrainerGroupMember } from '@/lib/types';
import { 
  Building2, 
  Plus, 
  Users, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  AlertTriangle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Item states
  const [activeType, setActiveType] = useState<'DEPT' | 'GROUP'>('DEPT');
  const [editingItem, setEditingItem] = useState<{ id: string, name: string, deptId?: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string, type: 'DEPT' | 'GROUP', deptId?: string, name: string } | null>(null);
  
  // Form state
  const [inputName, setInputName] = useState('');

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Create/Edit Handlers
  const handleOpenDeptModal = (dept?: Department) => {
    setActiveType('DEPT');
    setEditingItem(dept ? { id: dept.id, name: dept.name } : null);
    setInputName(dept ? dept.name : '');
    setIsModalOpen(true);
  };

  const handleOpenGroupModal = (deptId: string, group?: TrainerGroupMember) => {
    setActiveType('GROUP');
    setEditingItem(group ? { id: group.id, name: group.name, deptId } : { id: '', name: '', deptId });
    setInputName(group ? group.name : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    try {
      if (activeType === 'DEPT') {
        if (editingItem) {
          await fetch('/api/departments', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingItem.id, name: inputName.trim() })
          });
        } else {
          await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: inputName.trim() })
          });
        }
      } else {
        if (editingItem?.id) {
          await fetch('/api/groups', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingItem.id, name: inputName.trim() })
          });
        } else {
          await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departmentId: editingItem!.deptId!, name: inputName.trim() })
          });
        }
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  // Delete Handlers
  const handleOpenDeleteModal = (item: { id: string, type: 'DEPT' | 'GROUP', deptId?: string, name: string }) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      if (deletingItem.type === 'DEPT') {
        await fetch('/api/departments', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deletingItem.id })
        });
      } else {
        await fetch('/api/groups', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deletingItem.id })
        });
      }
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      refreshData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#F27D26] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[#141414]/40 animate-pulse">Loading organization structure...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight uppercase">Organization Structure</h1>
          <p className="text-[#141414]/50 italic serif">Manage nested hierarchy of departments and trainer groups.</p>
        </div>
        <button 
          onClick={() => handleOpenDeptModal()}
          className="bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          New Department
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {departments.map((dept) => (
          <motion.div 
            key={dept.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-l-4 border-l-[#141414] border border-[#141414]/10 shadow-sm"
          >
            {/* Department Row */}
            <div className="p-6 flex items-center justify-between group">
              <div 
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => toggleDept(dept.id)}
              >
                {expandedDepts[dept.id] ? <ChevronDown size={20} className="text-[#F27D26]" /> : <ChevronRight size={20} className="text-[#141414]/30" />}
                <div className="w-10 h-10 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#141414] uppercase tracking-tight">{dept.name}</h3>
                  <p className="text-[10px] text-[#141414]/30 font-bold uppercase tracking-widest">{dept.groups.length} Trainer Groups</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleOpenGroupModal(dept.id)}
                  className="px-3 py-1.5 border border-[#141414]/10 text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus size={12} /> Add Group
                </button>
                <button onClick={() => handleOpenDeptModal(dept)} className="p-2 text-[#141414]/30 hover:text-[#141414]"><Edit2 size={16} /></button>
                <button 
                  onClick={() => handleOpenDeleteModal({ id: dept.id, type: 'DEPT', name: dept.name })}
                  className="p-2 text-[#141414]/30 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Nested Groups */}
            <AnimatePresence>
              {expandedDepts[dept.id] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-[#F9F8F7] border-t border-[#141414]/5"
                >
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dept.groups.map(group => (
                      <div key={group.id} className="bg-white border border-[#141414]/10 p-4 flex items-center justify-between hover:border-[#F27D26] transition-all">
                        <div className="flex items-center gap-3">
                          <Users size={16} className="text-[#141414]/30" />
                          <span className="text-xs font-bold uppercase tracking-widest text-[#141414]">{group.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenGroupModal(dept.id, group)} className="p-1.5 text-[#141414]/20 hover:text-[#141414]"><Edit2 size={14} /></button>
                          <button 
                            onClick={() => handleOpenDeleteModal({ id: group.id, type: 'GROUP', deptId: dept.id, name: group.name })}
                            className="p-1.5 text-[#141414]/20 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {dept.groups.length === 0 && (
                      <div className="col-span-full py-8 text-center border-2 border-dashed border-[#141414]/5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/20 italic serif">No trainer groups defined for this department</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Save Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-[#141414]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white border-2 border-[#141414] p-8 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="text-xl font-bold uppercase tracking-tighter mb-6">
                {editingItem ? `Edit ${activeType === 'DEPT' ? 'Department' : 'Group'}` : `New ${activeType === 'DEPT' ? 'Department' : 'Group'}`}
              </h3>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Name</label>
                  <input autoFocus type="text" value={inputName} onChange={(e) => setInputName(e.target.value)} className="w-full p-3 bg-[#141414]/5 border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] text-sm font-bold uppercase" />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className="flex-1 bg-[#141414] text-white py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all flex items-center justify-center gap-2">
                    <Save size={16} /> Save
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && deletingItem && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-red-900/20 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-white border-2 border-red-600 p-8 shadow-[12px_12px_0px_0px_rgba(220,38,38,1)]">
              <div className="flex items-center gap-3 text-red-600 mb-6">
                <AlertTriangle size={32} />
                <h3 className="text-2xl font-bold uppercase tracking-tighter">Confirm Deletion</h3>
              </div>
              <p className="text-sm italic serif text-[#141414]/60 mb-8">
                You are about to delete <span className="font-bold text-[#141414] underline">&quot;{deletingItem.name}&quot;</span>. 
                {deletingItem.type === 'DEPT' ? ' This will remove all nested trainer groups and dissociate them from users.' : ' This will remove this group from its parent department.'}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all">Final Delete</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest border border-[#141414]/10 hover:bg-[#141414]/5 transition-all">Safe Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
