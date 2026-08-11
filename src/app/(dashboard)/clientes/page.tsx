'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  ChevronRight,
  Filter,
  UserCheck,
  MapPin,
  ChevronLeft,
  UserCog,
  ShieldAlert,
  Loader2,
  AlertCircle,
  CreditCard,
  User as UserIcon,
  ChevronDown,
  Check,
  Edit3,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { CreditScoreBadge } from '@/components/shared/StatusBadges';
import { formatDate, onlyDigits, validatePhone, validatePostalCode } from '@/lib/utils';
import { Client, ScoreCrediticio } from '@/types';
import { getClientsAction, createClientAction, updateClientAction } from '@/app/actions/clienteActions';

export default function ClientsPage() {
  const { clients, setClients, loans, users, currentUser } = useImpulsoStore();

  const isAdmin = currentUser.role === 'Administrador';
  const isPromotor = currentUser.role === 'Promotor de Campo';

  const activePromotores = users.filter(
    (u) => u.estatus === 'Activo' && (u.role === 'Promotor de Campo' || u.role === 'Administrador')
  );

  // Cargar Clientes desde BD
  const fetchClients = async () => {
    try {
      const res = await getClientsAction();
      if (res.success && res.clients) {
        setClients(res.clients as Client[]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('todos');
  const [promotorFilter, setPromotorFilter] = useState<string>('todos');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Modal State - Nuevo o Editar Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State - Reasignar Promotor
  const [clientToReassign, setClientToReassign] = useState<Client | null>(null);
  const [selectedNewPromotorId, setSelectedNewPromotorId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Form State - Datos Personales & Identificación
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [curp, setCurp] = useState('');
  const [rfc, setRfc] = useState('');
  const [folioIne, setFolioIne] = useState('');
  const [scoreCrediticio, setScoreCrediticio] = useState<ScoreCrediticio>('Excelente');

  // Promotor Asignado (Buscador Combobox)
  const [promotorAsignadoId, setPromotorAsignadoId] = useState<string>('');
  const [promotorSearchQuery, setPromotorSearchQuery] = useState<string>('');
  const [isPromotorDropdownOpen, setIsPromotorDropdownOpen] = useState<boolean>(false);
  const promotorDropdownRef = useRef<HTMLDivElement>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Form State - Dirección del Cliente
  const [calle, setCalle] = useState('');
  const [numExterior, setNumExterior] = useState('');
  const [numInterior, setNumInterior] = useState('');
  const [colonia, setColonia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState('');

  // Form State - Referencia 1 (Obligatoria)
  const [ref1Nombre, setRef1Nombre] = useState('');
  const [ref1Parentesco, setRef1Parentesco] = useState('Familiar');
  const [ref1Telefono, setRef1Telefono] = useState('');
  const [ref1Calle, setRef1Calle] = useState('');
  const [ref1NumExterior, setRef1NumExterior] = useState('');
  const [ref1NumInterior, setRef1NumInterior] = useState('');
  const [ref1Colonia, setRef1Colonia] = useState('');
  const [ref1CodigoPostal, setRef1CodigoPostal] = useState('');
  const [ref1Ciudad, setRef1Ciudad] = useState('');
  const [ref1Estado, setRef1Estado] = useState('');

  // Form State - Referencia 2 (Obligatoria)
  const [ref2Nombre, setRef2Nombre] = useState('');
  const [ref2Parentesco, setRef2Parentesco] = useState('Amigo');
  const [ref2Telefono, setRef2Telefono] = useState('');
  const [ref2Calle, setRef2Calle] = useState('');
  const [ref2NumExterior, setRef2NumExterior] = useState('');
  const [ref2NumInterior, setRef2NumInterior] = useState('');
  const [ref2Colonia, setRef2Colonia] = useState('');
  const [ref2CodigoPostal, setRef2CodigoPostal] = useState('');
  const [ref2Ciudad, setRef2Ciudad] = useState('');
  const [ref2Estado, setRef2Estado] = useState('');

  // Cierre de dropdowns / modals al hacer click afuera o presionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen && !isSubmitting) setIsModalOpen(false);
        if (clientToReassign && !isReassigning) setClientToReassign(null);
        setIsPromotorDropdownOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (promotorDropdownRef.current && !promotorDropdownRef.current.contains(e.target as Node)) {
        setIsPromotorDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, isSubmitting, clientToReassign, isReassigning]);

  const showErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  };

  // Clean form
  const resetForm = () => {
    setEditingClientId(null);
    setErrorMsg(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    setCurp('');
    setRfc('');
    setFolioIne('');
    setScoreCrediticio('Excelente');
    setPromotorAsignadoId(isPromotor ? currentUser.id : '');
    setPromotorSearchQuery('');
    setCalle('');
    setNumExterior('');
    setNumInterior('');
    setColonia('');
    setCodigoPostal('');
    setCiudad('');
    setEstado('');

    setRef1Nombre('');
    setRef1Parentesco('Familiar');
    setRef1Telefono('');
    setRef1Calle('');
    setRef1NumExterior('');
    setRef1NumInterior('');
    setRef1Colonia('');
    setRef1CodigoPostal('');
    setRef1Ciudad('');
    setRef1Estado('');

    setRef2Nombre('');
    setRef2Parentesco('Amigo');
    setRef2Telefono('');
    setRef2Calle('');
    setRef2NumExterior('');
    setRef2NumInterior('');
    setRef2Colonia('');
    setRef2CodigoPostal('');
    setRef2Ciudad('');
    setRef2Estado('');
  };

  // Abrir Modal en Modo Edición (Solo Administrador)
  const handleOpenEditModal = (clientToEdit: Client) => {
    if (!isAdmin) return;

    setErrorMsg(null);
    setEditingClientId(clientToEdit.id);

    setNombre(clientToEdit.nombre || '');
    setTelefono(clientToEdit.telefono || '');
    setEmail(clientToEdit.email || '');
    setCurp(clientToEdit.curp || '');
    setRfc(clientToEdit.rfc || '');
    setFolioIne(clientToEdit.folioIne || '');
    setScoreCrediticio(clientToEdit.scoreCrediticio || 'Excelente');
    setPromotorAsignadoId(clientToEdit.promotorAsignadoId || '');

    // Dirección Cliente
    const dir = clientToEdit.direccionEstructurada;
    setCalle(dir?.calle || clientToEdit.direccion || '');
    setNumExterior(dir?.numExterior || '');
    setNumInterior(dir?.numInterior || '');
    setColonia(dir?.colonia || '');
    setCodigoPostal(dir?.codigoPostal || '');
    setCiudad(dir?.ciudad || '');
    setEstado(dir?.estado || '');

    // Referencia 1
    const r1 = clientToEdit.referencia1;
    const r1Dir = r1?.direccionEstructurada;
    setRef1Nombre(r1?.nombre || '');
    setRef1Parentesco(r1?.parentesco || 'Familiar');
    setRef1Telefono(r1?.telefono || '');
    setRef1Calle(r1Dir?.calle || r1?.direccion || '');
    setRef1NumExterior(r1Dir?.numExterior || '');
    setRef1NumInterior(r1Dir?.numInterior || '');
    setRef1Colonia(r1Dir?.colonia || '');
    setRef1CodigoPostal(r1Dir?.codigoPostal || '');
    setRef1Ciudad(r1Dir?.ciudad || '');
    setRef1Estado(r1Dir?.estado || '');

    // Referencia 2
    const r2 = clientToEdit.referencia2;
    const r2Dir = r2?.direccionEstructurada;
    setRef2Nombre(r2?.nombre || '');
    setRef2Parentesco(r2?.parentesco || 'Amigo');
    setRef2Telefono(r2?.telefono || '');
    setRef2Calle(r2Dir?.calle || r2?.direccion || '');
    setRef2NumExterior(r2Dir?.numExterior || '');
    setRef2NumInterior(r2Dir?.numInterior || '');
    setRef2Colonia(r2Dir?.colonia || '');
    setRef2CodigoPostal(r2Dir?.codigoPostal || '');
    setRef2Ciudad(r2Dir?.ciudad || '');
    setRef2Estado(r2Dir?.estado || '');

    setIsModalOpen(true);
  };

  // Filter clients with Role Access Control Rules
  const visibleClients = clients.filter((client) => {
    if (isPromotor) {
      const isAssignedToMe =
        client.promotorAsignadoId === currentUser.id ||
        (client.promotorAsignadoNombre && client.promotorAsignadoNombre === currentUser.name);

      if (!isAssignedToMe) return false;
    }

    const matchesSearch =
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.folioIne && client.folioIne.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  // Submit Handler con Validaciones Completas
  const handleCreateOrUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // 1. Validaciones Datos Personales & Identificación (Orden Visual)
    if (!nombre.trim() || nombre.trim().length < 3) {
      showErrorMsg('El nombre completo del cliente es obligatorio (mínimo 3 caracteres).');
      return;
    }

    if (!curp || curp.trim().length !== 18) {
      showErrorMsg('La CURP es obligatoria (debe contener exactamente 18 caracteres alfanuméricos).');
      return;
    }

    if (!rfc || rfc.trim().length < 12) {
      showErrorMsg('El RFC es obligatorio (mínimo 12-13 caracteres con homoclave).');
      return;
    }

    if (!folioIne || folioIne.trim().length < 8) {
      showErrorMsg('La Clave o Folio de INE es obligatorio (mínimo 8 caracteres/dígitos).');
      return;
    }

    if (!validatePhone(telefono)) {
      showErrorMsg('El teléfono del cliente debe contener exactamente 10 dígitos numéricos.');
      return;
    }

    // 2. Validaciones Dirección del Cliente (Granular en Orden Visual)
    if (!calle.trim()) {
      showErrorMsg('La Calle de la Dirección Particular del cliente es obligatoria.');
      return;
    }

    if (!numExterior.trim()) {
      showErrorMsg('El Número Exterior (N° Ext) de la Dirección Particular del cliente es obligatorio.');
      return;
    }

    if (!colonia.trim()) {
      showErrorMsg('La Colonia de la Dirección Particular del cliente es obligatoria.');
      return;
    }

    if (!validatePostalCode(codigoPostal)) {
      showErrorMsg('El Código Postal de la Dirección Particular del cliente debe contener exactamente 5 dígitos numéricos.');
      return;
    }

    if (!ciudad.trim()) {
      showErrorMsg('La Ciudad / Municipio de la Dirección Particular del cliente es obligatorio.');
      return;
    }

    if (!estado.trim()) {
      showErrorMsg('El Estado de la Dirección Particular del cliente es obligatorio.');
      return;
    }

    // 3. Validaciones Referencia 1 (Granular en Orden Visual)
    if (!ref1Nombre.trim()) {
      showErrorMsg('El Nombre Completo de la Referencia 1 es obligatorio.');
      return;
    }

    if (!ref1Parentesco.trim()) {
      showErrorMsg('El Parentesco de la Referencia 1 es obligatorio.');
      return;
    }

    if (!validatePhone(ref1Telefono)) {
      showErrorMsg('El teléfono de la Referencia 1 debe contener exactamente 10 dígitos numéricos.');
      return;
    }

    if (!ref1Calle.trim()) {
      showErrorMsg('La Calle de la Referencia 1 es obligatoria.');
      return;
    }

    if (!ref1NumExterior.trim()) {
      showErrorMsg('El Número Exterior de la Referencia 1 es obligatorio.');
      return;
    }

    if (!ref1Colonia.trim()) {
      showErrorMsg('La Colonia de la Referencia 1 es obligatoria.');
      return;
    }

    if (!validatePostalCode(ref1CodigoPostal)) {
      showErrorMsg('El Código Postal de la Referencia 1 debe contener exactamente 5 dígitos numéricos.');
      return;
    }

    if (!ref1Ciudad.trim()) {
      showErrorMsg('La Ciudad / Municipio de la Referencia 1 es obligatorio.');
      return;
    }

    if (!ref1Estado.trim()) {
      showErrorMsg('El Estado de la Referencia 1 es obligatorio.');
      return;
    }

    // 4. Validaciones Referencia 2 (Granular en Orden Visual)
    if (!ref2Nombre.trim()) {
      showErrorMsg('El Nombre Completo de la Referencia 2 es obligatorio.');
      return;
    }

    if (!ref2Parentesco.trim()) {
      showErrorMsg('El Parentesco de la Referencia 2 es obligatorio.');
      return;
    }

    if (!validatePhone(ref2Telefono)) {
      showErrorMsg('El teléfono de la Referencia 2 debe contener exactamente 10 dígitos numéricos.');
      return;
    }

    if (!ref2Calle.trim()) {
      showErrorMsg('La Calle de la Referencia 2 es obligatoria.');
      return;
    }

    if (!ref2NumExterior.trim()) {
      showErrorMsg('El Número Exterior de la Referencia 2 es obligatorio.');
      return;
    }

    if (!ref2Colonia.trim()) {
      showErrorMsg('La Colonia de la Referencia 2 es obligatoria.');
      return;
    }

    if (!validatePostalCode(ref2CodigoPostal)) {
      showErrorMsg('El Código Postal de la Referencia 2 debe contener exactamente 5 dígitos numéricos.');
      return;
    }

    if (!ref2Ciudad.trim()) {
      showErrorMsg('La Ciudad / Municipio de la Referencia 2 es obligatorio.');
      return;
    }

    if (!ref2Estado.trim()) {
      showErrorMsg('El Estado de la Referencia 2 es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedUser = isPromotor
        ? currentUser
        : users.find((u) => u.id === promotorAsignadoId);
      const direccionCompleta = `${calle.trim()} N° Ext ${numExterior.trim()}${numInterior.trim() ? ` Int ${numInterior.trim()}` : ''}, ${colonia.trim()}, ${ciudad.trim()}, ${estado.trim()}, C.P. ${codigoPostal.trim()}`;

      const clientPayload = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        direccion: direccionCompleta,
        direccionEstructurada: {
          calle: calle.trim(),
          numExterior: numExterior.trim(),
          numInterior: numInterior.trim() || undefined,
          colonia: colonia.trim(),
          codigoPostal: codigoPostal.trim(),
          ciudad: ciudad.trim(),
          estado: estado.trim(),
        },
        curp: curp.trim().toUpperCase(),
        rfc: rfc.trim().toUpperCase(),
        folioIne: folioIne.trim().toUpperCase(),
        scoreCrediticio,
        promotorAsignadoId: assignedUser ? assignedUser.id : null,
        promotorAsignadoNombre: assignedUser ? assignedUser.name : null,
        referencia1: {
          nombre: ref1Nombre.trim(),
          parentesco: ref1Parentesco.trim(),
          telefono: ref1Telefono.trim(),
          direccionEstructurada: {
            calle: ref1Calle.trim(),
            numExterior: ref1NumExterior.trim(),
            numInterior: ref1NumInterior.trim() || undefined,
            colonia: ref1Colonia.trim(),
            codigoPostal: ref1CodigoPostal.trim(),
            ciudad: ref1Ciudad.trim(),
            estado: ref1Estado.trim(),
          },
          direccion: `${ref1Calle.trim()} N° Ext ${ref1NumExterior.trim()}${ref1NumInterior.trim() ? ` Int ${ref1NumInterior.trim()}` : ''}, ${ref1Colonia.trim()}, ${ref1Ciudad.trim()}, ${ref1Estado.trim()}, C.P. ${ref1CodigoPostal.trim()}`,
        },
        referencia2: {
          nombre: ref2Nombre.trim(),
          parentesco: ref2Parentesco.trim(),
          telefono: ref2Telefono.trim(),
          direccionEstructurada: {
            calle: ref2Calle.trim(),
            numExterior: ref2NumExterior.trim(),
            numInterior: ref2NumInterior.trim() || undefined,
            colonia: ref2Colonia.trim(),
            codigoPostal: ref2CodigoPostal.trim(),
            ciudad: ref2Ciudad.trim(),
            estado: ref2Estado.trim(),
          },
          direccion: `${ref2Calle.trim()} N° Ext ${ref2NumExterior.trim()}${ref2NumInterior.trim() ? ` Int ${ref2NumInterior.trim()}` : ''}, ${ref2Colonia.trim()}, ${ref2Ciudad.trim()}, ${ref2Estado.trim()}, C.P. ${ref2CodigoPostal.trim()}`,
        },
        estatus: 'Activo' as const,
        notas: '',
      };

      let res;
      if (editingClientId) {
        if (!isAdmin) {
          showErrorMsg('🔒 La edición de clientes está restringida únicamente a Administradores.');
          return;
        }
        res = await updateClientAction(editingClientId, clientPayload);
      } else {
        res = await createClientAction(clientPayload);
      }

      if (!res.success) {
        showErrorMsg(res.message);
        return;
      }

      await fetchClients();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      showErrorMsg('Ocurrió un error inesperado al procesar los datos del cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!clientToReassign || isReassigning) return;

    setIsReassigning(true);
    try {
      if (!selectedNewPromotorId) {
        await updateClientAction(clientToReassign.id, {
          promotorAsignadoId: null,
          promotorAsignadoNombre: null,
        });
      } else {
        const targetPromotor = users.find((u) => u.id === selectedNewPromotorId);
        if (targetPromotor) {
          await updateClientAction(clientToReassign.id, {
            promotorAsignadoId: targetPromotor.id,
            promotorAsignadoNombre: targetPromotor.name,
          });
        }
      }

      await fetchClients();
      setClientToReassign(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReassigning(false);
    }
  };

  const selectedPromotor = activePromotores.find((p) => p.id === promotorAsignadoId);
  const filteredPromotoresList = activePromotores.filter((p) =>
    p.name.toLowerCase().includes(promotorSearchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(promotorSearchQuery.toLowerCase())
  );

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
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
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
            placeholder="Buscar por Nombre, CURP, INE..."
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
                <th className="p-4">Identificación (CURP / RFC / INE)</th>
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
                      <div className="text-indigo-400">INE: {client.folioIne || 'N/A'}</div>
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
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenEditModal(client)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                            title="Editar Expediente (Solo Administrador)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        )}

                        <Link
                          href={`/clientes/${client.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                        >
                          Ver Expediente
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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

      {/* Modal Registro o Edición de Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div ref={modalScrollRef} className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  {editingClientId ? (
                    <>
                      <Edit3 className="w-6 h-6 text-amber-400" />
                      Editar Expediente de Cliente
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-6 h-6 text-emerald-400" />
                      Alta de Nuevo Cliente
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingClientId
                    ? 'Modificación de expediente por perfil de Administrador.'
                    : 'Captura de expediente completo con las mismas validaciones que un colaborador.'}
                </p>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-base disabled:opacity-30"
                title="Cerrar modal (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateClient} noValidate className="space-y-4 text-xs">
              {/* Sección 1: Datos Personales e Identificación */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-white stroke-[2.5]" />
                  1. Datos Personales & Identificación
                </h3>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: María de los Ángeles Mendoza"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">CURP (18 caracteres) *</label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      disabled={isSubmitting}
                      placeholder="HEJS920415MDFRZZ01"
                      value={curp}
                      onChange={(e) => setCurp(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs uppercase font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">RFC (13 caracteres) *</label>
                    <input
                      type="text"
                      required
                      maxLength={13}
                      disabled={isSubmitting}
                      placeholder="HEJS920415AB1"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs uppercase font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Clave / Folio INE *</label>
                    <input
                      type="text"
                      required
                      maxLength={18}
                      disabled={isSubmitting}
                      placeholder="Clave / Folio INE"
                      value={folioIne}
                      onChange={(e) => setFolioIne(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs uppercase font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono Móvil (10 dígitos) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={isSubmitting}
                      placeholder="5512345678"
                      value={telefono}
                      onChange={(e) => setTelefono(onlyDigits(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      disabled={isSubmitting}
                      placeholder="cliente@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isPromotor ? (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Promotor Asignado *
                      </label>
                      <div className="relative">
                        <UserCheck className="w-4 h-4 text-white stroke-[2.5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          readOnly
                          value={`${currentUser.name} (${currentUser.role})`}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-extrabold text-xs cursor-not-allowed opacity-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative" ref={promotorDropdownRef}>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Promotor Asignado <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsPromotorDropdownOpen(!isPromotorDropdownOpen)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs flex items-center justify-between focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <span className="truncate">
                          {selectedPromotor ? `👤 ${selectedPromotor.name} (${selectedPromotor.role})` : 'Sin Asignar'}
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      </button>

                      {isPromotorDropdownOpen && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden p-2 space-y-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Buscar promotor por nombre..."
                              value={promotorSearchQuery}
                              onChange={(e) => setPromotorSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-800/50">
                            <button
                              type="button"
                              onClick={() => {
                                setPromotorAsignadoId('');
                                setIsPromotorDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                !promotorAsignadoId ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>Sin Asignar</span>
                              {!promotorAsignadoId && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>

                            {filteredPromotoresList.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setPromotorAsignadoId(p.id);
                                  setIsPromotorDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                  promotorAsignadoId === p.id ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <div className="truncate">
                                  👤 {p.name} <span className="text-[10px] text-slate-400">({p.role})</span>
                                </div>
                                {promotorAsignadoId === p.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              </button>
                            ))}

                            {filteredPromotoresList.length === 0 && (
                              <div className="px-2 py-2 text-center text-slate-500 text-[11px]">
                                No se encontraron promotores.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Score Crediticio Inicial</label>
                    <select
                      value={scoreCrediticio}
                      disabled={isSubmitting}
                      onChange={(e) => setScoreCrediticio(e.target.value as ScoreCrediticio)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="Excelente">Excelente</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Alto Riesgo">Alto Riesgo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Dirección del Cliente */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white stroke-[2.5]" />
                  2. Dirección Particular
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Calle *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Av. Revolución"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">N° Ext *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="456"
                        value={numExterior}
                        onChange={(e) => setNumExterior(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">N° Int</label>
                      <input
                        type="text"
                        disabled={isSubmitting}
                        placeholder="B-3"
                        value={numInterior}
                        onChange={(e) => setNumInterior(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Colonia *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Col. Condesa"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Código Postal (5 dígitos) *</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      disabled={isSubmitting}
                      placeholder="06140"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(onlyDigits(e.target.value, 5))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ciudad / Municipio *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Ciudad de México"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estado *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="CDMX"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Sección 3: Referencia Personal 1 */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-white stroke-[2.5]" />
                  3. Referencia 1 (Obligatoria)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Ej: Gonzalo Sánchez Ruiz"
                      value={ref1Nombre}
                      onChange={(e) => setRef1Nombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Parentesco *</label>
                      <select
                        required
                        disabled={isSubmitting}
                        value={ref1Parentesco}
                        onChange={(e) => setRef1Parentesco(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      >
                        <option value="Familiar">Familiar</option>
                        <option value="Amigo">Amigo</option>
                        <option value="Vecino">Vecino</option>
                        <option value="Compañero de Trabajo / Socio">Compañero / Socio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Teléfono (10 dígitos) *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        disabled={isSubmitting}
                        placeholder="5511223344"
                        value={ref1Telefono}
                        onChange={(e) => setRef1Telefono(onlyDigits(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección Estructurada Referencia 1 */}
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    Dirección de Referencia 1 *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">Calle *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Calle principal"
                        value={ref1Calle}
                        onChange={(e) => setRef1Calle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">N° Ext *</label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Ext"
                          value={ref1NumExterior}
                          onChange={(e) => setRef1NumExterior(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">N° Int</label>
                        <input
                          type="text"
                          disabled={isSubmitting}
                          placeholder="Int"
                          value={ref1NumInterior}
                          onChange={(e) => setRef1NumInterior(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Colonia *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Colonia"
                        value={ref1Colonia}
                        onChange={(e) => setRef1Colonia(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">C.P. (5 dígitos) *</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        disabled={isSubmitting}
                        placeholder="00000"
                        value={ref1CodigoPostal}
                        onChange={(e) => setRef1CodigoPostal(onlyDigits(e.target.value, 5))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Ciudad / Mpio *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ciudad"
                        value={ref1Ciudad}
                        onChange={(e) => setRef1Ciudad(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Estado *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Estado"
                      value={ref1Estado}
                      onChange={(e) => setRef1Estado(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Referencia Personal 2 */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-white stroke-[2.5]" />
                  4. Referencia 2 (Obligatoria)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Ej: Lorena Fernández Vega"
                      value={ref2Nombre}
                      onChange={(e) => setRef2Nombre(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Parentesco *</label>
                      <select
                        required
                        disabled={isSubmitting}
                        value={ref2Parentesco}
                        onChange={(e) => setRef2Parentesco(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      >
                        <option value="Familiar">Familiar</option>
                        <option value="Amigo">Amigo</option>
                        <option value="Vecino">Vecino</option>
                        <option value="Compañero de Trabajo / Socio">Compañero / Socio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Teléfono (10 dígitos) *</label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        disabled={isSubmitting}
                        placeholder="5566778899"
                        value={ref2Telefono}
                        onChange={(e) => setRef2Telefono(onlyDigits(e.target.value, 10))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección Estructurada Referencia 2 */}
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <label className="block text-[11px] font-bold text-violet-300 uppercase tracking-wider">
                    Dirección de Referencia 2 *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">Calle *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Calle principal"
                        value={ref2Calle}
                        onChange={(e) => setRef2Calle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">N° Ext *</label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Ext"
                          value={ref2NumExterior}
                          onChange={(e) => setRef2NumExterior(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">N° Int</label>
                        <input
                          type="text"
                          disabled={isSubmitting}
                          placeholder="Int"
                          value={ref2NumInterior}
                          onChange={(e) => setRef2NumInterior(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Colonia *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Colonia"
                        value={ref2Colonia}
                        onChange={(e) => setRef2Colonia(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">C.P. (5 dígitos) *</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        disabled={isSubmitting}
                        placeholder="00000"
                        value={ref2CodigoPostal}
                        onChange={(e) => setRef2CodigoPostal(onlyDigits(e.target.value, 5))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Ciudad / Mpio *</label>
                      <input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ciudad"
                        value={ref2Ciudad}
                        onChange={(e) => setRef2Ciudad(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Estado *</label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Estado"
                      value={ref2Estado}
                      onChange={(e) => setRef2Estado(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-violet-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
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
                  className={`px-5 py-2 rounded-xl text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
                    editingClientId
                      ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : editingClientId ? (
                    'Guardar Cambios'
                  ) : (
                    'Guardar Cliente'
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
