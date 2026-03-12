'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FilePlus, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141414]"></div>
      </div>
    );
  }

  const menuItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ASSESSOR, UserRole.STAFF]
    },
    { 
      label: 'Form Builder', 
      href: '/dashboard/admin/builder', 
      icon: FilePlus,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    { 
      label: 'Assessments', 
      href: '/dashboard/assessor/queue', 
      icon: ClipboardList,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ASSESSOR]
    },
    { 
      label: 'My Progress', 
      href: '/dashboard/staff/my-forms', 
      icon: ShieldCheck,
      roles: [UserRole.STAFF]
    },
    { 
      label: 'User Management', 
      href: '/dashboard/admin/users', 
      icon: Users,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    { 
      label: 'Departments', 
      href: '/dashboard/admin/departments', 
      icon: Building2,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    { 
      label: 'Settings', 
      href: '/dashboard/settings', 
      icon: Settings,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ASSESSOR, UserRole.STAFF]
    },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex font-sans">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed lg:relative z-50 w-64 h-screen bg-[#141414] text-white flex flex-col border-r border-[#141414]"
          >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#F27D26] flex items-center justify-center rounded">
                <ShieldCheck size={20} />
              </div>
              <span className="font-bold tracking-tight text-lg">CertifyPro</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded transition-colors group ${
                  pathname === item.href 
                    ? 'bg-[#F27D26] text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} className={pathname === item.href ? 'text-white' : 'text-white/40 group-hover:text-[#F27D26]'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-red-500/10 rounded transition-colors group"
            >
              <LogOut size={18} className="text-white/40 group-hover:text-red-500" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </motion.aside>
      )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#141414]/10 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-[#141414]/5 rounded">
                <Menu size={20} />
              </button>
            )}
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#141414]/50 italic serif">
              {pathname === '/dashboard' ? 'Overview' : pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-[#141414]">
                {mounted ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '...'}
              </span>
              <span className="text-[10px] text-[#141414]/40 font-mono uppercase">System Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
