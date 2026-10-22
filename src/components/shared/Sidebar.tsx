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
  ShieldCheck,
  UserCheck,
  UserCog,
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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs font-black">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-foreground flex items-center gap-1">
                IMPULSO
              </h1>
              <p className="text-xs text-muted-foreground font-semibold">Gestión & Cobranza</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-3 mx-3 my-3 rounded-xl bg-muted/60 border border-border flex items-center gap-3">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border border-border object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
              <Badge
                variant={isAdmin ? 'default' : 'secondary'}
                className="text-xs font-semibold py-0 px-2 mt-0.5"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3 h-3 mr-1" />
                ) : (
                  <UserCheck className="w-3 h-3 mr-1" />
                )}
                {currentUser.role}
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1.5 mt-2">
            <p className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-muted text-foreground border border-border shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-11 text-destructive border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive font-semibold justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  );
}
