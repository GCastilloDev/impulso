'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ShieldCheck, ArrowRight, AlertCircle, KeyRound, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { loginAction } from '@/app/actions/authActions';

export default function LoginPage() {
  const router = useRouter();
  const { login, setCurrentUser } = useImpulsoStore();

  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // Intentar autenticación segura en el servidor
      const serverResult = await loginAction(selectedEmail, password);

      if (serverResult.success && serverResult.user) {
        setCurrentUser(serverResult.user);

        if (serverResult.user.role === 'Promotor de Campo') {
          router.push('/cobranza');
        } else {
          router.push('/');
        }
        return;
      }

      if (serverResult.message) {
        setErrorMsg(serverResult.message);
        return;
      }

      // Fallback local sólo si no hay respuesta de servidor
      const storeResult = login(selectedEmail, password);
      if (storeResult.success && storeResult.user) {
        if (storeResult.user.role === 'Promotor de Campo') {
          router.push('/cobranza');
        } else {
          router.push('/');
        }
      } else {
        setErrorMsg(storeResult.message);
      }
    } catch (err: any) {
      const storeResult = login(selectedEmail, password);
      if (storeResult.success && storeResult.user) {
        if (storeResult.user.role === 'Promotor de Campo') {
          router.push('/cobranza');
        } else {
          router.push('/');
        }
      } else {
        setErrorMsg('Credenciales inválidas o error de conexión');
      }
    } finally {
      setIsLoading(false);
    }
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
            <ShieldCheck className="w-3.5 h-3.5" /> Acceso Seguro al Sistema
          </span>
        </div>

        {/* Login Form Container */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
          <h2 className="text-lg font-bold text-white tracking-tight text-center">
            Iniciar Sesión
          </h2>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  placeholder="usuario@financieraimpulso.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                </>
              ) : (
                <>
                  Ingresar al Sistema
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
