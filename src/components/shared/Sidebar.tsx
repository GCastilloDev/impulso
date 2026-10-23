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
  LogOut,
  UserCog,
  ChevronDown,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useImpulsoStore();

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
    {
      name: 'Comisiones Semanales',
      href: '/comisiones',
      icon: TrendingUp,
    },
    ...(isAdmin
      ? [
          {
            name: 'Gestión de Personal',
            href: '/usuarios',
            icon: UserCog,
          },
          {
            name: 'Productos Financieros',
            href: '/productos',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Cabecera: Selector de Organización/Sucursal estilo Stripe */}
          <div className="px-3.5 py-3 border-b border-border flex items-center justify-between hover:bg-surface-subtle/60 transition-colors cursor-pointer select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-[4px] bg-badge-success-bg text-badge-success-text flex items-center justify-center font-bold text-xs shrink-0">
                FI
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-[13.5px] text-foreground truncate tracking-tight">
                  Financiera Impulso
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-medium leading-none">
                    Operativo
                  </Badge>
                  <span className="text-[11px] text-text-muted truncate">Matriz</span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={
                    isActive
                      ? 'bg-primary-subtle text-primary font-semibold text-[13px] px-3 py-2 rounded-[4px] flex items-center gap-2.5'
                      : 'text-text-secondary hover:text-foreground hover:bg-surface-subtle font-medium text-[13px] px-3 py-2 rounded-[4px] flex items-center gap-2.5 transition-colors'
                  }
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-primary' : 'text-text-muted'
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Pie del Sidebar: Botón tipo Stripe y ficha compacta de usuario */}
        <div className="p-3 border-t border-border bg-white space-y-2.5">
          {/* Botón >_ Modo Operativo / Soporte */}
          <div className="flex items-center justify-between border border-border rounded-[4px] px-2.5 py-1.5 bg-white hover:bg-surface-subtle text-text-secondary hover:text-foreground text-[12px] font-medium transition-colors cursor-pointer select-none group">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[11px] text-primary">&gt;_</span>
              <span>Modo Operativo / Soporte</span>
            </div>
            <span className="text-text-muted font-mono text-[11px] group-hover:text-foreground">|→</span>
          </div>

          {/* Ficha compacta de usuario con botón de cerrar sesión */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={
                  currentUser.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                }
                alt={currentUser.name}
                className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-text-muted truncate leading-tight mt-0.5">
                  {currentUser.role}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 text-text-muted hover:text-badge-danger-text hover:bg-badge-danger-bg rounded-[4px] shrink-0"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
