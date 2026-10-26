'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Calendar, Building2, LogOut } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
    <header className="sticky top-0 z-30 bg-white border-b border-border h-14 px-4 md:px-6 flex items-center justify-between">
      {/* Mobile Toggle & Stripe Search Bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden h-8 w-8 text-text-secondary hover:text-foreground hover:bg-surface-subtle rounded-[4px]"
          aria-label="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 h-8 bg-surface-subtle hover:bg-white border border-border rounded-[4px] w-60 md:w-72 lg:w-80 transition-colors focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-ring">
          <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Buscar clientes, créditos, pólizas..."
            className="bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-text-muted w-full focus:outline-none"
          />
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono text-text-muted bg-white border border-border rounded-[3px] shadow-2xs font-medium shrink-0">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Date, Branch & Profile Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Selector de Sucursal */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-8 text-[12px] font-medium text-text-secondary bg-surface-subtle border border-border rounded-[4px]">
          <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span>Sucursal Matriz</span>
        </div>

        {/* Selector de Fecha */}
        <div className="flex items-center gap-1.5 px-2.5 h-8 text-[12px] font-medium text-text-secondary bg-surface-subtle border border-border rounded-[4px]">
          <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span className="capitalize">{formatDate(todayStr)}</span>
        </div>

        {/* Separador sutil */}
        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Menú de Perfil & Logout */}
        <div className="flex items-center gap-2">
          <img
            src={
              currentUser.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
            }
            alt={currentUser.name}
            className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
          />
          <div className="hidden xl:block text-left">
            <p className="text-[12px] font-semibold text-foreground leading-tight">{currentUser.name}</p>
            <p className="text-[10.5px] text-text-muted leading-tight">{currentUser.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-text-muted hover:text-badge-danger-text hover:bg-badge-danger-bg rounded-[4px]"
            title="Cerrar Sesión"
            aria-label="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
