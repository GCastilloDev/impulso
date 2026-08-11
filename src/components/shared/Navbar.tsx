'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Database, Calendar, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatDate } from '@/lib/utils';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const { currentUser, logout } = useImpulsoStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-800 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-3.5 h-3.5" />
            Storage Persistente
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-white" />
            {formatDate(todayStr)}
          </span>
        </div>
      </div>

      {/* User Info & Logout Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
            <span
              className={`text-[10px] font-semibold flex items-center gap-1 ${
                currentUser.role === 'Administrador' ? 'text-emerald-400' : 'text-indigo-400'
              }`}
            >
              {currentUser.role === 'Administrador' ? (
                <ShieldCheck className="w-3 h-3" />
              ) : (
                <UserCheck className="w-3 h-3" />
              )}
              {currentUser.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
