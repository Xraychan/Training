'use client';

import { useState, useRef } from 'react';
import { store, hashPassword } from '@/lib/store';
import { User, UserRole } from '@/lib/types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MoreVertical,
  Mail,
  Building,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: UserRole.TRAINER,
    departmentId: '',
    groupId: '',
    password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  const departments = store.getDepartments();

  const selectedDept = departments.find(d => d.id === form.departmentId);

  const handleOpenModal = () => {
    setForm({ name: '', email: '', role: UserRole.TRAINER, departmentId: '', groupId: '', password: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError('Enter a valid email address.'); return; }
    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setFormError('A user with this email already exists.');
      return;
    }
    if (form.password && form.password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }
    isSubmittingRef.current = true;
    const passwordHash = await hashPassword(form.password.trim() || 'Certify123!');
    store.addUser({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      departmentId: form.departmentId || undefined,
      groupId: form.groupId || undefined,
      passwordHash,
    });
    setUsers([...store.getUsers()]);
    setIsModalOpen(false);
    isSubmittingRef.current = false;
  };

  const handleDelete = (id: string) => {
    store.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirmDeleteId(null);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'text-purple-700 bg-purple-50 border-purple-200',
    ADMIN: 'text-blue-700 bg-blue-50 border-blue-200',
    MANAGER: 'text-orange-700 bg-orange-50 border-orange-200',
    TRAINER: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight">User Management</h1>
          <p className="text-[#141414]/50 italic serif">Manage trainer roles, groups, and permissions.</p>
        </div>
        
        <button 
          onClick={handleOpenModal}
          className="bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center gap-2 self-start"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="bg-white border border-[#141414]/10 p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#141414]/30" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#141414]/10 focus:outline-none focus:border-[#F27D26] transition-colors text-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-[#141414]/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#141414]/5 border-b border-[#141414]/10">
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">User</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Role</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Group</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40">Department</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]/5">
            <AnimatePresence>
              {filteredUsers.map((u) => {
                const dept = departments.find(d => d.id === u.departmentId);
                const group = dept?.groups.find(g => g.id === u.groupId);
                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-[#141414]/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#141414]/5 rounded-full flex items-center justify-center text-[#141414]/40 font-bold text-xs">
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#141414]">{u.name}</p>
                          <p className="text-xs text-[#141414]/40 flex items-center gap-1">
                            <Mail size={10} />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${roleColors[u.role] || ''}`}>
                        <Shield size={10} />
                        {u.role.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-[#141414]/60 uppercase tracking-widest">
                        {group?.name || <span className="italic opacity-40">—</span>}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-[#141414]/60">
                        <Building size={12} />
                        {dept?.name || 'Global'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {confirmDeleteId === u.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-3 py-1.5 bg-red-500 text-white text-[9px] font-bold uppercase rounded hover:bg-red-600 transition-all"
                            >Delete?</button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1.5 text-[#141414]/30 hover:text-[#141414]"
                            ><X size={14} /></button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(u.id)}
                            className="p-2 hover:bg-red-50 rounded text-[#141414]/20 hover:text-red-500 transition-all"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-sm italic serif text-[#141414]/30">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add New User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#E4E3E0]/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#FCFBFA] border border-[#141414]/10 shadow-2xl rounded-xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-[#141414]">Add New User</h3>
                    <p className="text-sm text-[#141414]/40 italic mt-1">Create a new user account.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-[#141414]/30 hover:text-[#141414] transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/60">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Jane Smith"
                      className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                      autoFocus
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/60">Email Address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="e.g. jane@hospital.com"
                      className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/60">Role *</label>
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                      className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                    >
                      <option value={UserRole.TRAINER}>Trainer</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                      <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                    </select>
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/60">Department</label>
                    <select
                      value={form.departmentId}
                      onChange={e => setForm(f => ({ ...f, departmentId: e.target.value, groupId: '' }))}
                      className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                    >
                      <option value="">— No Department —</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  {/* Group (only shown if department selected) */}
                  {selectedDept && selectedDept.groups.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/60">Group</label>
                      <select
                        value={form.groupId}
                        onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}
                        className="w-full p-3 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                      >
                        <option value="">— No Group —</option>
                        {selectedDept.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Temporary Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/60">
                      Temporary Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to use Certify123!"
                        className="w-full p-3 pr-10 bg-white border border-[#141414]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F27D26]/20 focus:border-[#F27D26] text-sm"
                        minLength={form.password ? 8 : 0}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/30 hover:text-[#141414]"
                      >
                        {showPw ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#141414]/30">Minimum 8 characters. User can change this after login.</p>
                  </div>

                  {/* Error */}
                  {formError && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 font-semibold">
                      ⚠️ {formError}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-3 bg-white border border-[#141414]/10 rounded-full text-sm font-semibold text-[#141414] hover:bg-[#141414]/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#141414] text-white py-3 rounded-full text-sm font-bold hover:bg-[#F27D26] transition-all shadow-lg shadow-[#141414]/10"
                    >
                      Create User
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
