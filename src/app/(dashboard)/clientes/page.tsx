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
  X,
  Eye,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { CreditScoreBadge } from '@/components/shared/StatusBadges';
import { formatDate, onlyDigits, validatePhone, validatePostalCode } from '@/lib/utils';
import { Client, ScoreCrediticio } from '@/types';
import { getClientsAction, createClientAction, updateClientAction } from '@/app/actions/clienteActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ClientsPage() {
  const { clients, setClients, loans, users, currentUser, loadDataFromDB } = useImpulsoStore();

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

  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsPageLoading(true);
    Promise.all([fetchClients(), loadDataFromDB()]).finally(() => {
      if (isMounted) setIsPageLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadDataFromDB]);

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
          telefono: onlyDigits(ref1Telefono, 10),
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
          telefono: onlyDigits(ref2Telefono, 10),
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

  if (isPageLoading) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 my-8 bg-card border-border shadow-sm">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-base font-semibold text-muted-foreground">Consultando catálogo de clientes en tiempo real desde PostgreSQL...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5 tracking-tight">
            <Users className="w-8 h-8 text-primary" />
            Directorio de Clientes
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {isPromotor
              ? `Mostrando únicamente tus clientes asignados (${currentUser.name})`
              : 'Gestión completa de cartera, asignación de promotores y control de visibilidad.'}
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="h-12 px-6 min-h-[44px] text-base font-bold shadow-sm"
        >
          <UserPlus className="w-5 h-5 stroke-[2.5]" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters Toolbar */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por Nombre, CURP, INE..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-11 h-12 text-base bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Score */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground shrink-0" />
              <label htmlFor="client-score-filter" className="text-base text-muted-foreground font-semibold whitespace-nowrap">
                Score:
              </label>
              <select
                id="client-score-filter"
                value={scoreFilter}
                onChange={(e) => {
                  setScoreFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
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
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary shrink-0" />
                <label htmlFor="client-promoter-filter" className="text-base text-muted-foreground font-semibold whitespace-nowrap">
                  Promotor:
                </label>
                <select
                  id="client-promoter-filter"
                  value={promotorFilter}
                  onChange={(e) => {
                    setPromotorFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
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
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="border-border shadow-sm overflow-hidden flex flex-col justify-between">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Folio & Cliente</TableHead>
              <TableHead className="min-w-[220px]">Identificación (CURP / RFC / INE)</TableHead>
              <TableHead className="min-w-[180px]">Promotor Asignado</TableHead>
              <TableHead className="min-w-[140px]">Score Crediticio</TableHead>
              <TableHead className="min-w-[130px]">Préstamos</TableHead>
              <TableHead className="text-right min-w-[200px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.map((client) => {
              const clientLoans = loans.filter((l) => l.clienteId === client.id);
              const activeLoansCount = clientLoans.filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora').length;
              const promotorName = client.promotorAsignadoNombre;

              return (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Link
                        href={`/clientes/${client.id}`}
                        className="font-bold text-foreground text-base hover:text-primary transition-colors block"
                      >
                        {client.nombre}
                      </Link>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 font-mono">
                        {client.folio} • <span className="text-slate-500">Alta: {formatDate(client.fechaRegistro)}</span>
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-mono text-sm space-y-0.5">
                      <div className="text-foreground font-semibold">CURP: {client.curp}</div>
                      <div className="text-slate-700">RFC: {client.rfc || 'N/A'}</div>
                      <div className="text-slate-700">INE: {client.folioIne || 'N/A'}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {promotorName ? (
                        <span className="font-bold text-foreground text-sm">{promotorName}</span>
                      ) : (
                        <Badge variant="warning" className="text-xs font-bold">
                          Sin Asignar
                        </Badge>
                      )}

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setClientToReassign(client);
                            setSelectedNewPromotorId(client.promotorAsignadoId || '');
                          }}
                          className="h-9 w-9 min-h-[36px] min-w-[36px] text-primary hover:text-primary/80 hover:bg-slate-100 rounded-lg"
                          title="Asignar / Cambiar Promotor"
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <CreditScoreBadge score={client.scoreCrediticio} />
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs py-1 px-2.5">
                      {activeLoansCount} préstamo(s)
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(client)}
                          className="h-11 min-h-[44px] px-3.5 font-bold border-border bg-white text-foreground hover:bg-slate-100 gap-1.5 text-xs shadow-xs"
                          title="Editar Expediente (Solo Administrador)"
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                          Editar
                        </Button>
                      )}

                      <Button
                        asChild
                        size="sm"
                        className="h-11 min-h-[44px] px-3.5 font-bold text-xs shadow-xs gap-1.5"
                      >
                        <Link href={`/clientes/${client.id}`}>
                          Ver Expediente
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {paginatedClients.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground text-base">
                  No se encontraron clientes con el criterio de búsqueda o alcance de rol ({currentUser.role}).
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Paginación Bar */}
        <div className="p-4 bg-slate-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>
              Mostrando <strong className="text-foreground">{totalItems > 0 ? startIndex + 1 : 0}</strong> a{' '}
              <strong className="text-foreground">{Math.min(startIndex + itemsPerPage, totalItems)}</strong> de{' '}
              <strong className="text-primary font-bold">{totalItems}</strong> clientes
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Filas por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-10 px-3 py-1 rounded-xl bg-white border border-input text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="h-11 min-h-[44px] px-4 font-semibold text-sm bg-white border-border gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>

            <span className="px-4 py-2 rounded-xl bg-white border border-border font-extrabold text-foreground text-sm">
              Página {validCurrentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="h-11 min-h-[44px] px-4 font-semibold text-sm bg-white border-border gap-1"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal Reasignar Promotor */}
      {clientToReassign && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            className="bg-card text-card-foreground w-full max-w-md p-6 rounded-2xl border border-border shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <UserCog className="w-6 h-6 text-primary" />
                Asignación de Promotor
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isReassigning}
                onClick={() => setClientToReassign(null)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-xl"
                title="Cerrar modal (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Cliente: <strong className="text-foreground">{clientToReassign.nombre}</strong>
            </p>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Selecciona Promotor Responsable
              </label>
              <select
                value={selectedNewPromotorId}
                onChange={(e) => setSelectedNewPromotorId(e.target.value)}
                className="w-full h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
              >
                <option value="">Sin Asignar</option>
                {activePromotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={isReassigning}
                onClick={() => setClientToReassign(null)}
                className="h-12 min-h-[44px] px-5 font-semibold text-base"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isReassigning}
                onClick={handleConfirmReassign}
                className="h-12 min-h-[44px] px-6 font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
              >
                {isReassigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registro o Edición de Cliente */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            ref={modalScrollRef}
            className="bg-card text-card-foreground w-full max-w-3xl p-6 md:p-8 rounded-2xl border border-border shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-3 border-b border-border">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2.5">
                  {editingClientId ? (
                    <>
                      <Edit3 className="w-7 h-7 text-amber-600" />
                      Editar Expediente de Cliente
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-7 h-7 text-primary" />
                      Alta de Nuevo Cliente
                    </>
                  )}
                </h2>
                <p className="text-base text-muted-foreground mt-1">
                  {editingClientId
                    ? 'Modificación de expediente por perfil de Administrador.'
                    : 'Captura de expediente completo con las mismas validaciones que un colaborador.'}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded-xl"
                title="Cerrar modal (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-base font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateClient} noValidate className="space-y-6">
              {/* Sección 1: Datos Personales e Identificación */}
              <div className="p-5 rounded-xl bg-slate-50 border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary stroke-[2.5]" />
                  1. Datos Personales & Identificación
                </h3>

                <div>
                  <label className="block text-foreground font-semibold mb-1.5 text-base">Nombre Completo *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: María de los Ángeles Mendoza"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="h-12 text-base bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">CURP (18 caracteres) *</label>
                    <Input
                      type="text"
                      required
                      maxLength={18}
                      disabled={isSubmitting}
                      placeholder="HEJS920415MDFRZZ01"
                      value={curp}
                      onChange={(e) => setCurp(e.target.value.toUpperCase())}
                      className="h-12 text-base uppercase font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">RFC (13 caracteres) *</label>
                    <Input
                      type="text"
                      required
                      maxLength={13}
                      disabled={isSubmitting}
                      placeholder="HEJS920415AB1"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      className="h-12 text-base uppercase font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Clave / Folio INE *</label>
                    <Input
                      type="text"
                      required
                      maxLength={18}
                      disabled={isSubmitting}
                      placeholder="Clave / Folio INE"
                      value={folioIne}
                      onChange={(e) => setFolioIne(e.target.value.toUpperCase())}
                      className="h-12 text-base uppercase font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Teléfono Móvil (10 dígitos) *</label>
                    <Input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={isSubmitting}
                      placeholder="5512345678"
                      value={telefono}
                      onChange={(e) => setTelefono(onlyDigits(e.target.value, 10))}
                      className="h-12 text-base font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Correo Electrónico</label>
                    <Input
                      type="email"
                      disabled={isSubmitting}
                      placeholder="cliente@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {isPromotor ? (
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">
                        Promotor Asignado *
                      </label>
                      <div className="relative">
                        <UserCheck className="w-5 h-5 text-primary stroke-[2.5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                          type="text"
                          readOnly
                          value={`${currentUser.name} (${currentUser.role})`}
                          className="pl-11 h-12 text-base font-bold bg-slate-100 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative" ref={promotorDropdownRef}>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">
                        Promotor Asignado <span className="text-muted-foreground font-normal">(Opcional)</span>
                      </label>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsPromotorDropdownOpen(!isPromotorDropdownOpen)}
                        className="w-full h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50"
                      >
                        <span className="truncate">
                          {selectedPromotor ? `👤 ${selectedPromotor.name} (${selectedPromotor.role})` : 'Sin Asignar'}
                        </span>
                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
                      </button>

                      {isPromotorDropdownOpen && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl bg-card border border-border shadow-2xl overflow-hidden p-2 space-y-2">
                          <div className="relative">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              type="text"
                              autoFocus
                              placeholder="Buscar promotor por nombre..."
                              value={promotorSearchQuery}
                              onChange={(e) => setPromotorSearchQuery(e.target.value)}
                              className="pl-9 h-10 text-sm bg-slate-50"
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-border/50">
                            <button
                              type="button"
                              onClick={() => {
                                setPromotorAsignadoId('');
                                setIsPromotorDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                                !promotorAsignadoId ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-slate-100'
                              }`}
                            >
                              <span>Sin Asignar</span>
                              {!promotorAsignadoId && <Check className="w-4 h-4 text-primary" />}
                            </button>

                            {filteredPromotoresList.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setPromotorAsignadoId(p.id);
                                  setIsPromotorDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                                  promotorAsignadoId === p.id ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-slate-100'
                                }`}
                              >
                                <div className="truncate">
                                  👤 {p.name} <span className="text-xs text-muted-foreground">({p.role})</span>
                                </div>
                                {promotorAsignadoId === p.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                              </button>
                            ))}

                            {filteredPromotoresList.length === 0 && (
                              <div className="px-3 py-2 text-center text-muted-foreground text-sm">
                                No se encontraron promotores.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Score Crediticio Inicial</label>
                    <select
                      value={scoreCrediticio}
                      disabled={isSubmitting}
                      onChange={(e) => setScoreCrediticio(e.target.value as ScoreCrediticio)}
                      className="w-full h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50"
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
              <div className="p-5 rounded-xl bg-slate-50 border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary stroke-[2.5]" />
                  2. Dirección Particular
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Calle *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Av. Revolución"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">N° Ext *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="456"
                        value={numExterior}
                        onChange={(e) => setNumExterior(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">N° Int</label>
                      <Input
                        type="text"
                        disabled={isSubmitting}
                        placeholder="B-3"
                        value={numInterior}
                        onChange={(e) => setNumInterior(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Colonia *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Col. Condesa"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Código Postal (5 dígitos) *</label>
                    <Input
                      type="text"
                      required
                      maxLength={5}
                      disabled={isSubmitting}
                      placeholder="06140"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(onlyDigits(e.target.value, 5))}
                      className="h-12 text-base font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Ciudad / Municipio *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Ciudad de México"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-foreground font-semibold mb-1.5 text-base">Estado *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="CDMX"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="h-12 text-base bg-white"
                  />
                </div>
              </div>

              {/* Sección 3: Referencia Personal 1 */}
              <div className="p-5 rounded-xl bg-slate-50 border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary stroke-[2.5]" />
                  3. Referencia 1 (Obligatoria)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Nombre Completo *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Ej: Gonzalo Sánchez Ruiz"
                      value={ref1Nombre}
                      onChange={(e) => setRef1Nombre(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Parentesco *</label>
                      <select
                        required
                        disabled={isSubmitting}
                        value={ref1Parentesco}
                        onChange={(e) => setRef1Parentesco(e.target.value)}
                        className="w-full h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50"
                      >
                        <option value="Familiar">Familiar</option>
                        <option value="Amigo">Amigo</option>
                        <option value="Vecino">Vecino</option>
                        <option value="Compañero de Trabajo / Socio">Compañero / Socio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Teléfono (10 dígitos) *</label>
                      <Input
                        type="tel"
                        required
                        maxLength={10}
                        disabled={isSubmitting}
                        placeholder="5511223344"
                        value={ref1Telefono}
                        onChange={(e) => setRef1Telefono(onlyDigits(e.target.value, 10))}
                        className="h-12 text-base font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección Estructurada Referencia 1 */}
                <div className="pt-3 border-t border-border space-y-4">
                  <label className="block text-sm font-bold text-foreground uppercase tracking-wider">
                    Dirección de Referencia 1 *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Calle *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Calle principal"
                        value={ref1Calle}
                        onChange={(e) => setRef1Calle(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-foreground font-semibold mb-1.5 text-base">N° Ext *</label>
                        <Input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Ext"
                          value={ref1NumExterior}
                          onChange={(e) => setRef1NumExterior(e.target.value)}
                          className="h-12 text-base bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-foreground font-semibold mb-1.5 text-base">N° Int</label>
                        <Input
                          type="text"
                          disabled={isSubmitting}
                          placeholder="Int"
                          value={ref1NumInterior}
                          onChange={(e) => setRef1NumInterior(e.target.value)}
                          className="h-12 text-base bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Colonia *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Colonia"
                        value={ref1Colonia}
                        onChange={(e) => setRef1Colonia(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">C.P. (5 dígitos) *</label>
                      <Input
                        type="text"
                        required
                        maxLength={5}
                        disabled={isSubmitting}
                        placeholder="00000"
                        value={ref1CodigoPostal}
                        onChange={(e) => setRef1CodigoPostal(onlyDigits(e.target.value, 5))}
                        className="h-12 text-base font-mono bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Ciudad / Mpio *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ciudad"
                        value={ref1Ciudad}
                        onChange={(e) => setRef1Ciudad(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Estado *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Estado"
                      value={ref1Estado}
                      onChange={(e) => setRef1Estado(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Referencia Personal 2 */}
              <div className="p-5 rounded-xl bg-slate-50 border border-border space-y-4">
                <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary stroke-[2.5]" />
                  4. Referencia 2 (Obligatoria)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Nombre Completo *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Ej: Lorena Fernández Vega"
                      value={ref2Nombre}
                      onChange={(e) => setRef2Nombre(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Parentesco *</label>
                      <select
                        required
                        disabled={isSubmitting}
                        value={ref2Parentesco}
                        onChange={(e) => setRef2Parentesco(e.target.value)}
                        className="w-full h-12 min-h-[44px] px-4 py-2 rounded-xl border border-input bg-white text-foreground text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors disabled:opacity-50"
                      >
                        <option value="Familiar">Familiar</option>
                        <option value="Amigo">Amigo</option>
                        <option value="Vecino">Vecino</option>
                        <option value="Compañero de Trabajo / Socio">Compañero / Socio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Teléfono (10 dígitos) *</label>
                      <Input
                        type="tel"
                        required
                        maxLength={10}
                        disabled={isSubmitting}
                        placeholder="5566778899"
                        value={ref2Telefono}
                        onChange={(e) => setRef2Telefono(onlyDigits(e.target.value, 10))}
                        className="h-12 text-base font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Dirección Estructurada Referencia 2 */}
                <div className="pt-3 border-t border-border space-y-4">
                  <label className="block text-sm font-bold text-foreground uppercase tracking-wider">
                    Dirección de Referencia 2 *
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Calle *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Calle principal"
                        value={ref2Calle}
                        onChange={(e) => setRef2Calle(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-foreground font-semibold mb-1.5 text-base">N° Ext *</label>
                        <Input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Ext"
                          value={ref2NumExterior}
                          onChange={(e) => setRef2NumExterior(e.target.value)}
                          className="h-12 text-base bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-foreground font-semibold mb-1.5 text-base">N° Int</label>
                        <Input
                          type="text"
                          disabled={isSubmitting}
                          placeholder="Int"
                          value={ref2NumInterior}
                          onChange={(e) => setRef2NumInterior(e.target.value)}
                          className="h-12 text-base bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Colonia *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Colonia"
                        value={ref2Colonia}
                        onChange={(e) => setRef2Colonia(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">C.P. (5 dígitos) *</label>
                      <Input
                        type="text"
                        required
                        maxLength={5}
                        disabled={isSubmitting}
                        placeholder="00000"
                        value={ref2CodigoPostal}
                        onChange={(e) => setRef2CodigoPostal(onlyDigits(e.target.value, 5))}
                        className="h-12 text-base font-mono bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-foreground font-semibold mb-1.5 text-base">Ciudad / Mpio *</label>
                      <Input
                        type="text"
                        required
                        disabled={isSubmitting}
                        placeholder="Ciudad"
                        value={ref2Ciudad}
                        onChange={(e) => setRef2Ciudad(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-foreground font-semibold mb-1.5 text-base">Estado *</label>
                    <Input
                      type="text"
                      required
                      disabled={isSubmitting}
                      placeholder="Estado"
                      value={ref2Estado}
                      onChange={(e) => setRef2Estado(e.target.value)}
                      className="h-12 text-base bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="h-12 min-h-[44px] px-6 text-base font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`h-12 min-h-[44px] px-8 text-base font-bold shadow-sm flex items-center gap-2 ${
                    editingClientId
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                    </>
                  ) : editingClientId ? (
                    'Guardar Cambios'
                  ) : (
                    'Guardar Cliente'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
