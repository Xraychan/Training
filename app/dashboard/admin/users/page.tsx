'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { User, UserRole } from '@/lib/types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MoreVertical,
  Mail,
  Building
} from 'lucide-react';
import { motion } from 'motion/react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(() => store.getUsers());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Data is initialized in useState
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight">User Management</h1>
          <p className="text-[#141414]/50 italic serif">Manage staff roles, groups, and permissions.</p>
        </div>
        
        <button className="bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center gap-2 self-start">
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
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-[#141414]/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#141414]/5 rounded-full flex items-center justify-center text-[#141414]/40 font-bold text-xs">
                      {u.name.split(' ').map(n => n[0]).join('')}
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
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#141414]/5 rounded border border-[#141414]/10 text-[10px] font-bold uppercase tracking-widest text-[#141414]/60">
                    <Shield size={10} className="text-[#F27D26]" />
                    {u.role.replace('_', ' ')}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-xs font-bold text-[#141414]/60 uppercase tracking-widest">{u.group || 'N/A'}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs text-[#141414]/60">
                    <Building size={12} />
                    {u.departmentId ? store.getDepartments().find(d => d.id === u.departmentId)?.name : 'Global'}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30 hover:text-[#141414]">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
