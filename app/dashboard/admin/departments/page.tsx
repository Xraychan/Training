'use client';

import { useState, useEffect } from 'react';
import { store } from '@/lib/store';
import { Department } from '@/lib/types';
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical,
  Users,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(() => store.getDepartments());
  const [groups, setGroups] = useState<string[]>(() => store.getGroups());

  useEffect(() => {
    // Data is initialized in useState
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#141414] tracking-tight">Organization Structure</h1>
          <p className="text-[#141414]/50 italic serif">Manage departments and staff role groups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Departments Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414]">Departments</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] flex items-center gap-1 hover:underline">
              <Plus size={12} />
              Add Department
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white border border-[#141414]/10 p-6 flex items-center justify-between group hover:border-[#F27D26] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#141414]">{dept.name}</p>
                    <p className="text-[10px] text-[#141414]/40 uppercase tracking-widest">Active Department</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Staff Groups Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414]">Staff Role Groups</h3>
            <button className="text-[10px] font-bold uppercase tracking-widest text-[#F27D26] flex items-center gap-1 hover:underline">
              <Plus size={12} />
              Add Group
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {groups.map((group) => (
              <div key={group} className="bg-white border border-[#141414]/10 p-6 flex items-center justify-between group hover:border-[#F27D26] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#141414]/5 rounded flex items-center justify-center text-[#141414]/40 group-hover:text-[#F27D26] transition-colors">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#141414]">{group.replace('_', ' ')}</p>
                    <p className="text-[10px] text-[#141414]/40 uppercase tracking-widest">Staff Category</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-[#141414]/5 rounded text-[#141414]/30">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
