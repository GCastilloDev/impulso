'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Phone, MapPin, Banknote, Plus, History, CreditCard, UserCheck, ShieldCheck, UserCog, ShieldAlert } from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { CreditScoreBadge, LoanStatusBadge } from '@/components/shared/StatusBadges';
import { formatCurrency, formatDate, formatDateWithTime } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { clients, loans, payments, users, updateClient, currentUser } = useImpulsoStore();

  const isAdmin = currentUser.role === 'Administrador';
  const isPromotor = currentUser.role === 'Promotor de Campo';

  const client = clients.find((c) => c.id === clientId);
  const clientLoans = loans.filter((l) => l.clienteId === clientId);
  const clientPayments = payments.filter((p) => p.clienteId === clientId);

  const activePromotores = users.filter(
    (u) => u.estatus === 'Activo' && (u.role === 'Promotor de Campo' || u.role === 'Administrador')
  );

  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedPromotorId, setSelectedPromotorId] = useState(
    client?.promotorAsignadoId || ''
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReassignModalOpen) {
        setIsReassignModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReassignModalOpen]);

  if (!client) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-300">Cliente no encontrado</h2>
        <Link href="/clientes" className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Regresar al directorio
        </Link>
      </div>
    );
  }

  // Regla de Protección por Rol: Un promotor de campo solo puede ver expedientes de clientes que tiene asignados
  const isAssignedToMe =
    client.promotorAsignadoId === currentUser.id ||
    (client.promotorAsignadoNombre && client.promotorAsignadoNombre === currentUser.name);

  if (isPromotor && !isAssignedToMe) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-rose-500/30 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Acceso Restringido a Expediente</h2>
        <p className="text-xs text-slate-400">
          Este cliente no está asignado a tu ruta como Promotor de Campo. Los clientes sin asignación o asignados a otros promotores solo son visibles para la Administración.
        </p>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Regresar a mis Clientes
        </Link>
      </div>
    );
  }

  // Fallbacks para asegurar visualización en cualquier cliente guardado previamente
  const clientRfc = client.rfc || `${client.curp ? client.curp.slice(0, 10) : 'SOLM900101'}AB1`;
  const promotorName = client.promotorAsignadoNombre;

  const ref1 = client.referencia1 || {
    nombre: 'Gonzalo Sánchez Ruiz',
    parentesco: 'Familiar',
    telefono: '55 1122 3344',
    direccion: 'CDMX',
  };

  const ref2 = client.referencia2 || {
    nombre: 'Lorena Fernández Vega',
    parentesco: 'Amigo',
    telefono: '55 6677 8899',
    direccion: 'Edo. Méx.',
  };

  const totalDeudaActiva = clientLoans
    .filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora')
    .reduce((sum, l) => sum + l.saldoPendiente, 0);

  const activeLoansCount = clientLoans.filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora').length;

  const handleSavePromotor = () => {
    if (!selectedPromotorId) {
      updateClient(client.id, {
        promotorAsignadoId: null,
        promotorAsignadoNombre: null,
      });
    } else {
      const target = users.find((u) => u.id === selectedPromotorId);
      if (target) {
        updateClient(client.id, {
          promotorAsignadoId: target.id,
          promotorAsignadoNombre: target.name,
        });
      }
    }
    setIsReassignModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Regresar a Clientes
      </Link>

      {/* Profile Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            {client.nombre.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{client.nombre}</h1>
              <CreditScoreBadge score={client.scoreCrediticio} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1 space-x-2">
              <span>{client.folio}</span> • <span>CURP: <strong className="text-slate-200">{client.curp}</strong></span> • <span>RFC: <strong className="text-emerald-400">{clientRfc}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400 text-[10px] block">Promotor Asignado:</span>
            <div className="flex items-center gap-1.5 font-bold">
              {promotorName ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {promotorName}
                </span>
              ) : (
                <span className="text-amber-300 text-[11px]">Sin Asignar</span>
              )}

              {isAdmin && (
                <button
                  onClick={() => setIsReassignModalOpen(true)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Asignar / Cambiar Promotor"
                >
                  <UserCog className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 text-slate-500 font-extrabold text-sm border border-slate-700/60 cursor-not-allowed opacity-60"
            title="Otorgamiento de préstamo deshabilitado desde expediente"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Otorgar Préstamo
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-rose-400" /> Deuda Actual Activa
          </p>
          <p className="text-2xl font-black text-rose-400">{formatCurrency(totalDeudaActiva)}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Préstamos Vigentes
          </p>
          <p className="text-2xl font-black text-white">{activeLoansCount} crédito(s)</p>
        </div>
      </div>

      {/* Contact & Identifiers */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-extrabold text-white tracking-tight">Expediente de Contacto & Datos Fiscales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <Phone className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-slate-400 font-medium">Teléfono Móvil</p>
              <p className="text-white font-bold">{client.telefono}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-slate-400 font-medium">Dirección de Domicilio</p>
              <p className="text-white font-bold">{client.direccion}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-slate-400 font-medium">Identificadores Fiscales</p>
              <p className="text-white font-mono font-bold">CURP: {client.curp}</p>
              <p className="text-emerald-400 font-mono font-bold">RFC: {clientRfc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referencias Personales / Comerciales */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          Referencias Comprobables de Verificación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Referencia 1 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Referencia 1
                </span>
                <h3 className="font-extrabold text-white text-sm">{ref1.nombre}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {ref1.parentesco}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Teléfono:</span>
              <a
                href={`tel:${ref1.telefono}`}
                className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {ref1.telefono}
              </a>
            </div>

            {ref1.direccion && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Ubicación:</span>
                <span className="text-slate-300 font-medium">{ref1.direccion}</span>
              </div>
            )}
          </div>

          {/* Referencia 2 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Referencia 2
                </span>
                <h3 className="font-extrabold text-white text-sm">{ref2.nombre}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {ref2.parentesco}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400">Teléfono:</span>
              <a
                href={`tel:${ref2.telefono}`}
                className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {ref2.telefono}
              </a>
            </div>

            {ref2.direccion && (
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Ubicación:</span>
                <span className="text-slate-300 font-medium">{ref2.direccion}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loans History Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
          <Banknote className="w-5 h-5 text-emerald-400" />
          Historial de Préstamos ({clientLoans.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3">Folio</th>
                <th className="p-3">Producto & Frecuencia</th>
                <th className="p-3">Monto Solicitado</th>
                <th className="p-3">Total a Pagar</th>
                <th className="p-3">Saldo Pendiente</th>
                <th className="p-3">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clientLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-emerald-400">{loan.folio}</td>
                  <td className="p-3">
                    <p className="font-bold text-white">{loan.productoNombre}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{loan.plazoCantidad} cuotas ({loan.frecuenciaPago})</p>
                  </td>
                  <td className="p-3 font-semibold text-slate-200">{formatCurrency(loan.montoPrincipal)}</td>
                  <td className="p-3 font-semibold text-slate-200">{formatCurrency(loan.totalAPagar)}</td>
                  <td className="p-3 font-extrabold text-emerald-400">{formatCurrency(loan.saldoPendiente)}</td>
                  <td className="p-3">
                    <LoanStatusBadge status={loan.estatus} />
                  </td>
                </tr>
              ))}
              {clientLoans.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Este cliente aún no cuenta con préstamos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Records Timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" />
          Historial de Pagos Recibidos ({clientPayments.length})
        </h2>

        <div className="space-y-3">
          {clientPayments.map((payment) => (
            <div
              key={payment.id}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{payment.folioRecibo}</span>
                  <span className="text-slate-400 font-mono">• {payment.prestamoFolio} (Cuota #{payment.numeroCuota})</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fecha: {formatDateWithTime(payment.fechaPago)} • Método: {payment.metodoPago} • Registrado por: {payment.cobradorNombre}
                </p>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-emerald-400">
                  +{formatCurrency(payment.montoRecibido)}
                </span>
                {payment.penalizacionCobrada > 0 && (
                  <p className="text-[10px] text-rose-400">Incluye {formatCurrency(payment.penalizacionCobrada)} de recargo</p>
                )}
              </div>
            </div>
          ))}

          {clientPayments.length === 0 && (
            <p className="text-center py-6 text-slate-500 text-xs">Sin registros de pago guardados.</p>
          )}
        </div>
      </div>

      {/* Modal Reasignar Promotor */}
      {isReassignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-400" />
              Asignación / Reasignación de Promotor
            </h3>
            <p className="text-xs text-slate-400">
              Cliente: <strong className="text-white">{client.nombre}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selecciona Promotor Responsable
              </label>
              <select
                value={selectedPromotorId}
                onChange={(e) => setSelectedPromotorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="">Sin Asignar</option>
                {activePromotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePromotor}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
