'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  ChevronRight,
  Filter,
  Sparkles,
  UserCheck,
  MapPin,
  ChevronLeft,
  UserCog,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { CreditScoreBadge } from '@/components/shared/StatusBadges';
import { formatDate } from '@/lib/utils';
import { Client, ScoreCrediticio } from '@/types';

export default function ClientsPage() {
  const { clients, loans, users, addClient, updateClient, currentUser } = useImpulsoStore();

  const isAdmin = currentUser.role === 'Administrador';
  const isPromotor = currentUser.role === 'Promotor de Campo';

  const activePromotores = users.filter(
    (u) => u.estatus === 'Activo' && (u.role === 'Promotor de Campo' || u.role === 'Administrador')
  );

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('todos');
  const [promotorFilter, setPromotorFilter] = useState<string>('todos');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Modal State - Nuevo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State - Reasignar Promotor
  const [clientToReassign, setClientToReassign] = useState<Client | null>(null);
  const [selectedNewPromotorId, setSelectedNewPromotorId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Form State - Datos Personales
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [curp, setCurp] = useState('');
  const [rfc, setRfc] = useState('');
  const [scoreCrediticio, setScoreCrediticio] = useState<ScoreCrediticio>('Excelente');
  const [promotorAsignadoId, setPromotorAsignadoId] = useState<string>('');

  // Form State - Referencia 1
  const [ref1Nombre, setRef1Nombre] = useState('');
  const [ref1Parentesco, setRef1Parentesco] = useState('Familiar');
  const [ref1Telefono, setRef1Telefono] = useState('');
  const [ref1Direccion, setRef1Direccion] = useState('');

  // Form State - Referencia 2
  const [ref2Nombre, setRef2Nombre] = useState('');
  const [ref2Parentesco, setRef2Parentesco] = useState('Amigo');
  const [ref2Telefono, setRef2Telefono] = useState('');
  const [ref2Direccion, setRef2Direccion] = useState('');

  const fillDummyData = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setNombre('Patricia Guadalupe Sánchez Ruiz');
    setTelefono(`55 7788 ${randomNum}`);
    setEmail(`patricia.sanchez${randomNum}@gmail.com`);
    setDireccion('Av. Coyoacán 123, Col. Del Valle, CDMX');
    setCurp(`SARP930612MDFRRN${randomNum.toString().slice(0, 2)}`);
    setRfc(`SARP930612K${randomNum.toString().slice(0, 2)}`);
    setScoreCrediticio('Excelente');
    setPromotorAsignadoId(''); // Opcional (Sin Asignar)

    setRef1Nombre('Gonzalo Sánchez Ruiz');
    setRef1Parentesco('Familiar');
    setRef1Telefono(`55 1122 ${randomNum}`);
    setRef1Direccion('CDMX');

    setRef2Nombre('Lorena Fernández Vega');
    setRef2Parentesco('Amigo');
    setRef2Telefono(`55 6677 ${randomNum}`);
    setRef2Direccion('Naucalpan, Edo. Méx.');
  };

  // Filter clients with Role Access Control Rules
  const visibleClients = clients.filter((client) => {
    // Regla de Visibilidad por Rol:
    // Si es Promotor de Campo, SOLO puede ver los clientes asignados a él.
    // Los clientes sin promotor asignado SOLO son visibles para Administradores.
    if (isPromotor) {
      const isAssignedToMe =
        client.promotorAsignadoId === currentUser.id ||
        (client.promotorAsignadoNombre && client.promotorAsignadoNombre === currentUser.name);

      if (!isAssignedToMe) return false;
    }

    // Filtros visuales de búsqueda
    const matchesSearch =
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.rfc && client.rfc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.telefono.includes(searchTerm) ||
      client.folio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesScore = scoreFilter === 'todos' || client.scoreCrediticio === scoreFilter;

    let matchesPromotor = true;
    if (promotorFilter === 'sin_asignar') {
      matchesPromotor = !client.promotorAsignadoId && !client.promotorAsignadoNombre;
    } else if (promotorFilter !== 'todos') {
      matchesPromotor =
        client.promotorAsignadoId === promotorFilter ||
        Boolean(client.promotorAsignadoNombre && client.promotorAsignadoNombre.includes(promotorFilter));
    }

    return matchesSearch && matchesScore && matchesPromotor;
  });

  // Calculate Pagination
  const totalItems = visibleClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedClients = visibleClients.slice(startIndex, startIndex + itemsPerPage);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const assignedUser = users.find((u) => u.id === promotorAsignadoId);

      addClient({
        nombre,
        telefono,
        email,
        direccion,
        curp,
        rfc,
        scoreCrediticio,
        promotorAsignadoId: assignedUser ? assignedUser.id : undefined,
        promotorAsignadoNombre: assignedUser ? assignedUser.name : undefined,
        referencia1: {
          nombre: ref1Nombre,
          parentesco: ref1Parentesco,
          telefono: ref1Telefono,
          direccion: ref1Direccion,
        },
        referencia2: {
          nombre: ref2Nombre,
          parentesco: ref2Parentesco,
          telefono: ref2Telefono,
          direccion: ref2Direccion,
        },
        estatus: 'Activo',
      });

      setIsModalOpen(false);
      // Reset Form
      setNombre('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setCurp('');
      setRfc('');
      setScoreCrediticio('Excelente');
      setPromotorAsignadoId('');
      setRef1Nombre('');
      setRef1Parentesco('Familiar');
      setRef1Telefono('');
      setRef1Direccion('');
      setRef2Nombre('');
      setRef2Parentesco('Amigo');
      setRef2Telefono('');
      setRef2Direccion('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!clientToReassign || isReassigning) return;

    setIsReassigning(true);
    try {
      if (!selectedNewPromotorId) {
        updateClient(clientToReassign.id, {
          promotorAsignadoId: undefined,
          promotorAsignadoNombre: undefined,
        });
      } else {
        const targetPromotor = users.find((u) => u.id === selectedNewPromotorId);
        if (targetPromotor) {
          updateClient(clientToReassign.id, {
            promotorAsignadoId: targetPromotor.id,
            promotorAsignadoNombre: targetPromotor.name,
          });
        }
      }

      setClientToReassign(null);
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Users className="w-7 h-7 text-emerald-400" />
            Directorio de Clientes
          </h1>
          <p className="text-sm text-slate-400">
            {isPromotor
              ? `Mostrando únicamente tus clientes asignados (${currentUser.name})`
              : 'Gestión completa de cartera, asignación de promotores y control de visibilidad.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          Nuevo Cliente
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nombre, CURP, RFC..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Score */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Score:</span>
            <select
              value={scoreFilter}
              onChange={(e) => {
                setScoreFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value="Excelente">Excelente</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular</option>
              <option value="Alto Riesgo">Alto Riesgo</option>
            </select>
          </div>

          {/* Filter Promotor (Only for Admin) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400 font-medium">Promotor:</span>
              <select
                value={promotorFilter}
                onChange={(e) => {
                  setPromotorFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos los clientes</option>
                <option value="sin_asignar">Sin Asignar</option>
                {activePromotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Folio & Cliente</th>
                <th className="p-4">CURP & RFC</th>
                <th className="p-4">Promotor Asignado</th>
                <th className="p-4">Score Crediticio</th>
                <th className="p-4">Préstamos</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedClients.map((client) => {
                const clientLoans = loans.filter((l) => l.clienteId === client.id);
                const activeLoansCount = clientLoans.filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora').length;
                const promotorName = client.promotorAsignadoNombre;

                return (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/clientes/${client.id}`}
                          className="font-bold text-white text-sm hover:text-emerald-400 transition-colors"
                        >
                          {client.nombre}
                        </Link>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          {client.folio} • <span className="text-slate-500">Alta: {formatDate(client.fechaRegistro)}</span>
                        </p>
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5 font-mono text-[11px]">
                      <div className="text-slate-200">CURP: {client.curp}</div>
                      <div className="text-emerald-400">RFC: {client.rfc || 'N/A'}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {promotorName ? (
                          <span className="font-semibold text-slate-200">{promotorName}</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Sin Asignar
                          </span>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setClientToReassign(client);
                              setSelectedNewPromotorId(client.promotorAsignadoId || '');
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white transition-all"
                            title="Asignar / Cambiar Promotor"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <CreditScoreBadge score={client.scoreCrediticio} />
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {activeLoansCount} préstamo(s)
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/clientes/${client.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                      >
                        Ver Expediente
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No se encontraron clientes con el criterio de búsqueda o alcance de rol ({currentUser.role}).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Bar */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>
              Mostrando <strong className="text-white">{startIndex + 1}</strong> a{' '}
              <strong className="text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de{' '}
              <strong className="text-emerald-400">{totalItems}</strong> clientes
            </span>

            <div className="flex items-center gap-1">
              <span className="text-slate-500">Filas por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-extrabold text-white">
              Página {validCurrentPage} de {totalPages}
            </span>

            <button
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Reasignar Promotor */}
      {clientToReassign && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-400" />
              Asignación / Reasignación de Promotor
            </h3>
            <p className="text-xs text-slate-400">
              Cliente: <strong className="text-white">{clientToReassign.nombre}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selecciona Promotor Responsable
              </label>
              <select
                value={selectedNewPromotorId}
                onChange={(e) => setSelectedNewPromotorId(e.target.value)}
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
                disabled={isReassigning}
                onClick={() => setClientToReassign(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isReassigning}
                onClick={handleConfirmReassign}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReassigning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registro Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-emerald-400" />
                  Alta de Nuevo Cliente
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Captura de expediente completo. El promotor es opcional.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fillDummyData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all"
                  title="Auto-llenar con datos de prueba"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Prellenar Datos Demo
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-5 text-xs">
              {/* Sección 1: Datos Personales e Identificación */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  1. Datos Personales & Identificación Obligatoria
                </h3>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: María de los Ángeles Mendoza"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">CURP (18 dígitos) *</label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      placeholder="HEJS920415MDFRZZ01"
                      value={curp}
                      onChange={(e) => setCurp(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">RFC (con homoclave) *</label>
                    <input
                      type="text"
                      required
                      maxLength={13}
                      placeholder="HEJS920415AB1"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono Móvil *</label>
                    <input
                      type="tel"
                      required
                      placeholder="55 1234 5678"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dirección Completa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Calle, Número, Colonia, Municipio / Ciudad"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Promotor Asignado <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <select
                      value={promotorAsignadoId}
                      onChange={(e) => setPromotorAsignadoId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="">Sin Asignar</option>
                      {activePromotores.map((p) => (
                        <option key={p.id} value={p.id}>
                          👤 {p.name} ({p.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Score Crediticio Inicial</label>
                    <select
                      value={scoreCrediticio}
                      onChange={(e) => setScoreCrediticio(e.target.value as ScoreCrediticio)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Excelente">Excelente</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Alto Riesgo">Alto Riesgo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Referencia Personal 1 */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  2. Referencia 1 (Obligatoria)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Ernesto Hernández Juárez"
                      value={ref1Nombre}
                      onChange={(e) => setRef1Nombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Parentesco / Relación *</label>
                    <select
                      value={ref1Parentesco}
                      onChange={(e) => setRef1Parentesco(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Familiar">Familiar (Padre/Hermano/Cónyuge)</option>
                      <option value="Amigo">Amigo / Conocido</option>
                      <option value="Vecino">Vecino</option>
                      <option value="Compañero de Trabajo / Socio">Compañero de Trabajo / Socio</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono de Contacto *</label>
                    <input
                      type="tel"
                      required
                      placeholder="55 9876 5432"
                      value={ref1Telefono}
                      onChange={(e) => setRef1Telefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Dirección / Municipio (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. CDMX / Toluca"
                      value={ref1Direccion}
                      onChange={(e) => setRef1Direccion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Referencia Personal 2 */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  3. Referencia 2 (Obligatoria)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Verónica Castro Solís"
                      value={ref2Nombre}
                      onChange={(e) => setRef2Nombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Parentesco / Relación *</label>
                    <select
                      value={ref2Parentesco}
                      onChange={(e) => setRef2Parentesco(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Familiar">Familiar (Padre/Hermano/Cónyuge)</option>
                      <option value="Amigo">Amigo / Conocido</option>
                      <option value="Vecino">Vecino</option>
                      <option value="Compañero de Trabajo / Socio">Compañero de Trabajo / Socio</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono de Contacto *</label>
                    <input
                      type="tel"
                      required
                      placeholder="55 3322 1100"
                      value={ref2Telefono}
                      onChange={(e) => setRef2Telefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Dirección / Municipio (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Metepec"
                      value={ref2Direccion}
                      onChange={(e) => setRef2Direccion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 font-semibold text-xs transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando Cliente...
                    </>
                  ) : (
                    'Registrar Cliente Completo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
