'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ShieldCheck, ArrowRight, AlertCircle, KeyRound, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { loginAction } from '@/app/actions/authActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    } catch (_err: unknown) {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shadow-md mb-4 font-black">
            <TrendingUp className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            FINANCIERA IMPULSO
          </h1>
          <p className="text-base text-muted-foreground font-semibold mt-1">
            Sistema de Gestión de Préstamos & Cobranza
          </p>
          <div className="mt-3 flex justify-center">
            <Badge variant="success" className="gap-1.5 py-1 px-3.5 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Acceso Seguro al Sistema</span>
            </Badge>
          </div>
        </div>

        {/* Login Form Container */}
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Ingresa tus credenciales para acceder a la plataforma
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-destructive text-sm font-semibold flex items-center gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    required
                    disabled={isLoading}
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    placeholder="usuario@financieraimpulso.com"
                    className="pl-11 h-12 text-base"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-11 pr-12 h-12 text-base font-mono"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-r-xl"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-bold shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
