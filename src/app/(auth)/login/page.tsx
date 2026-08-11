'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ShieldCheck, UserCheck, ArrowRight, Zap, AlertCircle, KeyRound, User } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, users } = useImpulsoStore();

  const [selectedEmail, setSelectedEmail] = useState('carlos.mendoza@financieraimpulso.com');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeUsers = users.filter((u) => u.estatus === 'Activo');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = login(selectedEmail, password);

    if (result.success && result.user) {
      if (result.user.role === 'Promotor de Campo') {
        router.push('/cobranza');
      } else {
        router.push('/');
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  const selectUserPreset = (email: string) => {
    setSelectedEmail(email);
    setPassword('123456');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4 font-black">
            <TrendingUp className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">FINANCIERA IMPULSO</h1>
          <p className="text-xs text-emerald-400 font-semibold mt-1">
            Sistema de Gestión de Préstamos & Cobranza
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-3.5 h-3.5" /> Acceso Autenticado al Sistema
          </span>
        </div>

        {/* Login Form Container */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
          <h2 className="text-lg font-bold text-white tracking-tight text-center">
            Iniciar Sesión
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Seleccionar o Escribir Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  placeholder="usuario@financieraimpulso.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all group"
            >
              Ingresar al Sistema
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Preset User Quick Pickers */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
              Cuentas Registradas en el Sistema:
            </p>
            <div className="space-y-1.5">
              {activeUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectUserPreset(u.email)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                    selectedEmail === u.email
                      ? 'bg-slate-800 border-emerald-500/40 text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <p className="font-bold text-white leading-tight">{u.name}</p>
                      <p className="text-[10px] text-slate-400">{u.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                      u.role === 'Administrador'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
