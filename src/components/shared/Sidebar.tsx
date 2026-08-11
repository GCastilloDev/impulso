'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Banknote,
  Smartphone,
  Settings,
  TrendingUp,
  RotateCcw,
  LogOut,
  ShieldCheck,
  UserCheck,
  UserCog,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, resetToSeedData, logout } = useImpulsoStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isAdmin = currentUser.role === 'Administrador';

  const navItems = [
    {
      name: 'Dashboard Ejecutivos',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Cobranza en Campo',
      href: '/cobranza',
      icon: Smartphone,
      badge: 'Mobile-First',
    },
    {
      name: 'Préstamos & Simulador',
      href: '/prestamos',
      icon: Banknote,
    },
    {
      name: 'Directorio de Clientes',
      href: '/clientes',
      icon: Users,
    },
    ...(isAdmin
      ? [
          {
            name: 'Gestión de Personal',
            href: '/usuarios',
            icon: UserCog,
          },
        ]
      : []),
    {
      name: 'Productos Financieros',
      href: '/productos',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 glass-panel border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <TrendingUp className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                IMPULSO
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                  MVP
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Gestión & Cobranza</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full border border-emerald-500/30 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                ● {currentUser.role}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1.5 mt-2">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Módulos del Sistema
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => {
              if (confirm('¿Restablecer el prototipo con datos semilla iniciales?')) {
                resetToSeedData();
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Datos Semilla
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
