'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Calendar, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden text-foreground hover:bg-muted"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2 px-3 py-1 text-sm font-semibold text-muted-foreground border-border bg-muted/50">
            <Calendar className="w-4 h-4 text-foreground" />
            {formatDate(todayStr)}
          </Badge>
        </div>
      </div>

      {/* User Info & Logout Button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full border border-border object-cover"
          />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-bold text-foreground leading-tight">{currentUser.name}</p>
            <Badge
              variant={currentUser.role === 'Administrador' ? 'default' : 'secondary'}
              className="text-xs font-semibold py-0 px-2 mt-0.5"
            >
              {currentUser.role === 'Administrador' ? (
                <ShieldCheck className="w-3 h-3 mr-1" />
              ) : (
                <UserCheck className="w-3 h-3 mr-1" />
              )}
              {currentUser.role}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Cerrar Sesión"
          aria-label="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
