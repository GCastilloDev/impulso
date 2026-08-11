'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  Phone,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  Camera,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  Lock,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { User, UserRole, StructuredAddress, Reference } from '@/types';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { formatDate } from '@/lib/utils';
import { getUsersAction, createUserAction, updateUserAction, toggleUserStatusAction } from '@/app/actions/userActions';

// Lista de avatares predeterminados profesionales opcionales
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
];

export default function UsersManagementPage() {
  const { currentUser } = useImpulsoStore();
  const isAdmin = currentUser?.role === 'Administrador';

  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State - Básicos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('Promotor de Campo');
  const [telefono, setTelefono] = useState('');
  const [avatar, setAvatar] = useState<string>('');

  // Form State - Promotor Identificación
  const [curp, setCurp] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [folioIne, setFolioIne] = useState('');

  // Dirección Promotor
  const [calle, setCalle] = useState('');
  const [numExterior, setNumExterior] = useState('');
  const [numInterior, setNumInterior] = useState('');
  const [colonia, setColonia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState('Estado de México');

  // Referencia 1
  const [ref1Nombre, setRef1Nombre] = useState('');
  const [ref1Parentesco, setRef1Parentesco] = useState('Familiar');
  const [ref1Telefono, setRef1Telefono] = useState('');
  const [ref1Calle, setRef1Calle] = useState('');
  const [ref1NumExt, setRef1NumExt] = useState('');
  const [ref1NumInt, setRef1NumInt] = useState('');
  const [ref1Colonia, setRef1Colonia] = useState('');
  const [ref1CP, setRef1CP] = useState('');
  const [ref1Ciudad, setRef1Ciudad] = useState('');
  const [ref1Estado, setRef1Estado] = useState('');

  // Referencia 2
  const [ref2Nombre, setRef2Nombre] = useState('');
  const [ref2Parentesco, setRef2Parentesco] = useState('Amigo');
  const [ref2Telefono, setRef2Telefono] = useState('');
  const [ref2Calle, setRef2Calle] = useState('');
  const [ref2NumExt, setRef2NumExt] = useState('');
  const [ref2NumInt, setRef2NumInt] = useState('');
  const [ref2Colonia, setRef2Colonia] = useState('');
  const [ref2CP, setRef2CP] = useState('');
  const [ref2Ciudad, setRef2Ciudad] = useState('');
  const [ref2Estado, setRef2Estado] = useState('');

  // Cargar colaboradores desde el servidor verificando el rol solicitante
  const fetchUsersServerSide = useCallback(async (searchQuery: string, roleQuery: string) => {
    setIsLoading(true);
    const res = await getUsersAction({
      search: searchQuery,
      role: roleQuery,
      requesterRole: currentUser?.role,
    });
    if (res.success && res.users) {
      setDbUsers(res.users);
    }
    setIsLoading(false);
  }, [currentUser?.role]);

  useEffect(() => {
    if (isAdmin) {
      const timer = setTimeout(() => {
        fetchUsersServerSide(searchTerm, roleFilter);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, roleFilter, fetchUsersServerSide, isAdmin]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('Promotor de Campo');
    setTelefono('');
    setAvatar('');
    setCurp('');
    setFechaNacimiento('');
    setFolioIne('');
    setCalle('');
    setNumExterior('');
    setNumInterior('');
    setColonia('');
    setCodigoPostal('');
    setCiudad('');
    setEstado('Estado de México');
    setRef1Nombre('');
    setRef1Parentesco('Familiar');
    setRef1Telefono('');
    setRef1Calle('');
    setRef1NumExt('');
    setRef1NumInt('');
    setRef1Colonia('');
    setRef1CP('');
    setRef1Ciudad('');
    setRef1Estado('');
    setRef2Nombre('');
    setRef2Parentesco('Amigo');
    setRef2Telefono('');
    setRef2Calle('');
    setRef2NumExt('');
    setRef2NumInt('');
    setRef2Colonia('');
    setRef2CP('');
    setRef2Ciudad('');
    setRef2Estado('');
    setErrorMsg(null);
  };

  const openNewUserModal = () => {
    setEditingUserId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setShowPassword(false);
    setRole(user.role);
    setTelefono(user.telefono || '');
    setAvatar(user.avatar || '');

    setCurp(user.curp || '');
    setFechaNacimiento(user.fechaNacimiento || '');
    setFolioIne(user.folioIne || '');

    if (user.direccionEstructurada) {
      setCalle(user.direccionEstructurada.calle || '');
      setNumExterior(user.direccionEstructurada.numExterior || '');
      setNumInterior(user.direccionEstructurada.numInterior || '');
      setColonia(user.direccionEstructurada.colonia || '');
      setCodigoPostal(user.direccionEstructurada.codigoPostal || '');
      setCiudad(user.direccionEstructurada.ciudad || '');
      setEstado(user.direccionEstructurada.estado || 'Estado de México');
    } else {
      setCalle('');
      setNumExterior('');
      setNumInterior('');
      setColonia('');
      setCodigoPostal('');
      setCiudad('');
      setEstado('Estado de México');
    }

    if (user.referencia1) {
      setRef1Nombre(user.referencia1.nombre || '');
      setRef1Parentesco(user.referencia1.parentesco || 'Familiar');
      setRef1Telefono(user.referencia1.telefono || '');
      if (user.referencia1.direccionEstructurada) {
        setRef1Calle(user.referencia1.direccionEstructurada.calle || '');
        setRef1NumExt(user.referencia1.direccionEstructurada.numExterior || '');
        setRef1NumInt(user.referencia1.direccionEstructurada.numInterior || '');
        setRef1Colonia(user.referencia1.direccionEstructurada.colonia || '');
        setRef1CP(user.referencia1.direccionEstructurada.codigoPostal || '');
        setRef1Ciudad(user.referencia1.direccionEstructurada.ciudad || '');
        setRef1Estado(user.referencia1.direccionEstructurada.estado || '');
      } else {
        setRef1Calle('');
        setRef1NumExt('');
        setRef1NumInt('');
        setRef1Colonia('');
        setRef1CP('');
        setRef1Ciudad('');
        setRef1Estado('');
      }
    }

    if (user.referencia2) {
      setRef2Nombre(user.referencia2.nombre || '');
      setRef2Parentesco(user.referencia2.parentesco || 'Amigo');
      setRef2Telefono(user.referencia2.telefono || '');
      if (user.referencia2.direccionEstructurada) {
        setRef2Calle(user.referencia2.direccionEstructurada.calle || '');
        setRef2NumExt(user.referencia2.direccionEstructurada.numExterior || '');
        setRef2NumInt(user.referencia2.direccionEstructurada.numInterior || '');
        setRef2Colonia(user.referencia2.direccionEstructurada.colonia || '');
        setRef2CP(user.referencia2.direccionEstructurada.codigoPostal || '');
        setRef2Ciudad(user.referencia2.direccionEstructurada.ciudad || '');
        setRef2Estado(user.referencia2.direccionEstructurada.estado || '');
      } else {
        setRef2Calle('');
        setRef2NumExt('');
        setRef2NumInt('');
        setRef2Colonia('');
        setRef2CP('');
        setRef2Ciudad('');
        setRef2Estado('');
      }
    }

    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const direccionEstructurada: StructuredAddress | undefined =
      role === 'Promotor de Campo'
        ? {
            calle,
            numExterior,
            numInterior: numInterior || undefined,
            colonia,
            codigoPostal,
            ciudad,
            estado,
          }
        : undefined;

    const referencia1: Reference | undefined =
      role === 'Promotor de Campo'
        ? {
            nombre: ref1Nombre,
            parentesco: ref1Parentesco,
            telefono: ref1Telefono,
            direccionEstructurada: {
              calle: ref1Calle,
              numExterior: ref1NumExt,
              numInterior: ref1NumInt || undefined,
              colonia: ref1Colonia,
              codigoPostal: ref1CP,
              ciudad: ref1Ciudad,
              estado: ref1Estado,
            },
            direccion: `${ref1Calle} N° Ext ${ref1NumExt}${ref1NumInt ? ` Int ${ref1NumInt}` : ''}, ${ref1Colonia}, ${ref1Ciudad}, ${ref1Estado}, C.P. ${ref1CP}`,
          }
        : undefined;

    const referencia2: Reference | undefined =
      role === 'Promotor de Campo'
        ? {
            nombre: ref2Nombre,
            parentesco: ref2Parentesco,
            telefono: ref2Telefono,
            direccionEstructurada: {
              calle: ref2Calle,
              numExterior: ref2NumExt,
              numInterior: ref2NumInt || undefined,
              colonia: ref2Colonia,
              codigoPostal: ref2CP,
              ciudad: ref2Ciudad,
              estado: ref2Estado,
            },
            direccion: `${ref2Calle} N° Ext ${ref2NumExt}${ref2NumInt ? ` Int ${ref2NumInt}` : ''}, ${ref2Colonia}, ${ref2Ciudad}, ${ref2Estado}, C.P. ${ref2CP}`,
          }
        : undefined;

    try {
      if (editingUserId) {
        // Modo Edición
        const res = await updateUserAction({
          id: editingUserId,
          name,
          email,
          role,
          telefono: telefono || undefined,
          avatar: avatar || undefined,
          newPassword: password || undefined,
          curp: role === 'Promotor de Campo' ? curp : undefined,
          fechaNacimiento: role === 'Promotor de Campo' ? fechaNacimiento : undefined,
          folioIne: role === 'Promotor de Campo' ? folioIne : undefined,
          direccionEstructurada,
          referencia1,
          referencia2,
          requesterRole: currentUser?.role,
        });

        if (res.success && res.user) {
          await fetchUsersServerSide(searchTerm, roleFilter);
          setIsModalOpen(false);
        } else {
          setErrorMsg(res.message || 'Error al actualizar el colaborador');
        }
      } else {
        // Modo Alta Nueva
        if (!password) {
          setErrorMsg('La contraseña es requerida para un nuevo colaborador');
          setIsSubmitting(false);
          return;
        }

        const res = await createUserAction({
          name,
          email,
          password,
          role,
          telefono: telefono || undefined,
          avatar: avatar || undefined,
          curp: role === 'Promotor de Campo' ? curp : undefined,
          fechaNacimiento: role === 'Promotor de Campo' ? fechaNacimiento : undefined,
          folioIne: role === 'Promotor de Campo' ? folioIne : undefined,
          direccionEstructurada,
          referencia1,
          referencia2,
          requesterRole: currentUser?.role,
        });

        if (res.success && res.user) {
          await fetchUsersServerSide(searchTerm, roleFilter);
          setIsModalOpen(false);
        } else {
          setErrorMsg(res.message || 'Error al guardar el colaborador');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    if (togglingUserId) return;
    setTogglingUserId(userId);

    try {
      const res = await toggleUserStatusAction(userId, currentUser?.role);
      if (res.success) {
        setDbUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, estatus: res.newStatus as 'Activo' | 'Inactivo' } : u))
        );
      }
    } finally {
      setTogglingUserId(null);
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Acceso Restringido</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            La sección de **Gestión de Personal & Colaboradores** es de uso exclusivo para perfiles con rol de **Administrador**.
          </p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Tu rol actual: <strong className="text-indigo-400">{currentUser?.role}</strong>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <UserCog className="w-7 h-7 text-emerald-400" />
            Gestión de Personal & Colaboradores
          </h1>
          <p className="text-sm text-slate-400">
            Directorio de colaboradores y administración de expedientes.
          </p>
        </div>

        <button
          onClick={openNewUserModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4 stroke-[3]" />
          Nuevo Colaborador
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nombre, Email, CURP o INE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filtrar por Rol:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="todos">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Promotor de Campo">Promotor de Campo</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            Cargando lista de colaboradores...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Contacto / Identificación</th>
                  <th className="p-4">Rol Asignado</th>
                  <th className="p-4">Estatus</th>
                  <th className="p-4">Fecha de Alta</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {dbUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                            {getInitials(user.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white text-sm">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                          {user.role === 'Promotor de Campo' && user.direccionEstructurada && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              {user.direccionEstructurada.colonia}, {user.direccionEstructurada.ciudad}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {user.telefono || 'Sin teléfono'}
                      </div>

                      {user.role === 'Promotor de Campo' && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {user.curp && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                              CURP: {user.curp}
                            </span>
                          )}
                          {user.folioIne && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
                              INE: {user.folioIne}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          user.role === 'Administrador'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}
                      >
                        {user.role === 'Administrador' ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                        {user.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={togglingUserId === user.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.estatus === 'Activo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                        title="Haz clic para cambiar estatus"
                      >
                        {togglingUserId === user.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Actualizando...
                          </>
                        ) : (
                          <>
                            {user.estatus === 'Activo' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {user.estatus}
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4 text-slate-400 font-mono">
                      {formatDate(user.fechaAlta)}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditUserModal(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {dbUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No se encontraron colaboradores con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Alta / Edición de Colaborador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  {editingUserId ? (
                    <>
                      <Edit3 className="w-6 h-6 text-emerald-400" />
                      Editar Colaborador
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-6 h-6 text-emerald-400" />
                      Alta de Nuevo Colaborador
                    </>
                  )}
                </h2>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-base disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUser} className="space-y-4 text-xs">
              {/* Selector de Rol Limpio */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Rol de Colaborador *
                </label>
                <select
                  value={role}
                  disabled={isSubmitting}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-extrabold text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Promotor de Campo">Promotor de Campo</option>
                </select>
              </div>

              {/* Sección 1: Datos de Cuenta */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  1. Datos de Cuenta
                </h3>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="Ej: Gabriel Morales Trejo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      disabled={isSubmitting}
                      placeholder="gabriel.morales@financieraimpulso.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Teléfono Móvil *</label>
                    <input
                      type="tel"
                      required
                      disabled={isSubmitting}
                      placeholder="55 9900 1234"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Campo Contraseña con Botón de Ojo */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUserId}
                      disabled={isSubmitting}
                      placeholder={editingUserId ? 'Dejar en blanco para mantener contraseña actual' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sección Exclusiva para PROMOTOR DE CAMPO */}
              {role === 'Promotor de Campo' && (
                <>
                  {/* Identificación y Nacimiento */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      2. Identificación
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">CURP (18 caracteres) *</label>
                        <input
                          type="text"
                          required
                          maxLength={18}
                          disabled={isSubmitting}
                          placeholder="ABCD123456HDFRRR01"
                          value={curp}
                          onChange={(e) => setCurp(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs uppercase font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Folio del INE *</label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="IDMEX123456789"
                          value={folioIne}
                          onChange={(e) => setFolioIne(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs uppercase font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Fecha de Nacimiento *</label>
                        <input
                          type="date"
                          required
                          disabled={isSubmitting}
                          value={fechaNacimiento}
                          onChange={(e) => setFechaNacimiento(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      3. Dirección
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1">Calle *</label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Av. Benito Juárez"
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
                            placeholder="123"
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
                            placeholder="A-2"
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
                          placeholder="Col. Centro"
                          value={colonia}
                          onChange={(e) => setColonia(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Código Postal *</label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="50000"
                          value={codigoPostal}
                          onChange={(e) => setCodigoPostal(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Ciudad / Municipio *</label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Toluca"
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
                        placeholder="Estado de México"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Referencias Personales (Con Dirección Seccionada) */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      4. Referencias Personales (2 Obligatorias)
                    </h3>

                    {/* Referencia 1 */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <p className="text-xs font-bold text-slate-200">Referencia 1</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Nombre Completo *"
                          value={ref1Nombre}
                          onChange={(e) => setRef1Nombre(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                        <select
                          value={ref1Parentesco}
                          disabled={isSubmitting}
                          onChange={(e) => setRef1Parentesco(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        >
                          <option value="Familiar">Familiar</option>
                          <option value="Amigo">Amigo</option>
                          <option value="Vecino">Vecino</option>
                          <option value="Compañero de Trabajo / Socio">Compañero de Trabajo</option>
                        </select>
                        <input
                          type="tel"
                          required
                          disabled={isSubmitting}
                          placeholder="Teléfono *"
                          value={ref1Telefono}
                          onChange={(e) => setRef1Telefono(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      {/* Dirección Seccionada Referencia 1 */}
                      <div className="space-y-2 pt-1 border-t border-slate-800/80">
                        <p className="text-[11px] font-semibold text-slate-400">Dirección de Referencia 1 *</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Calle *"
                            value={ref1Calle}
                            onChange={(e) => setRef1Calle(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="N° Ext *"
                            value={ref1NumExt}
                            onChange={(e) => setRef1NumExt(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            disabled={isSubmitting}
                            placeholder="N° Int"
                            value={ref1NumInt}
                            onChange={(e) => setRef1NumInt(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Colonia *"
                            value={ref1Colonia}
                            onChange={(e) => setRef1Colonia(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="C.P. *"
                            value={ref1CP}
                            onChange={(e) => setRef1CP(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Ciudad / Mpio *"
                            value={ref1Ciudad}
                            onChange={(e) => setRef1Ciudad(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Estado *"
                            value={ref1Estado}
                            onChange={(e) => setRef1Estado(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Referencia 2 */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <p className="text-xs font-bold text-slate-200">Referencia 2</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          placeholder="Nombre Completo *"
                          value={ref2Nombre}
                          onChange={(e) => setRef2Nombre(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                        <select
                          value={ref2Parentesco}
                          disabled={isSubmitting}
                          onChange={(e) => setRef2Parentesco(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        >
                          <option value="Familiar">Familiar</option>
                          <option value="Amigo">Amigo</option>
                          <option value="Vecino">Vecino</option>
                          <option value="Compañero de Trabajo / Socio">Compañero de Trabajo</option>
                        </select>
                        <input
                          type="tel"
                          required
                          disabled={isSubmitting}
                          placeholder="Teléfono *"
                          value={ref2Telefono}
                          onChange={(e) => setRef2Telefono(e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      {/* Dirección Seccionada Referencia 2 */}
                      <div className="space-y-2 pt-1 border-t border-slate-800/80">
                        <p className="text-[11px] font-semibold text-slate-400">Dirección de Referencia 2 *</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Calle *"
                            value={ref2Calle}
                            onChange={(e) => setRef2Calle(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="N° Ext *"
                            value={ref2NumExt}
                            onChange={(e) => setRef2NumExt(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            disabled={isSubmitting}
                            placeholder="N° Int"
                            value={ref2NumInt}
                            onChange={(e) => setRef2NumInt(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Colonia *"
                            value={ref2Colonia}
                            onChange={(e) => setRef2Colonia(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="C.P. *"
                            value={ref2CP}
                            onChange={(e) => setRef2CP(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Ciudad / Mpio *"
                            value={ref2Ciudad}
                            onChange={(e) => setRef2Ciudad(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                          <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            placeholder="Estado *"
                            value={ref2Estado}
                            onChange={(e) => setRef2Estado(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Selección Opcional de Avatar / Foto */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    Foto de Perfil / Avatar <span className="text-slate-500 font-normal">(Opcional)</span>
                  </label>

                  {avatar && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setAvatar('')}
                      className="text-[10px] text-rose-400 hover:underline disabled:opacity-50"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Previsualización"
                        className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                        {name ? getInitials(name) : 'A'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      disabled={isSubmitting}
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px] focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Presets:</span>
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setAvatar(url)}
                          className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
                            avatar === url ? 'border-emerald-400 ring-2 ring-emerald-500/40 scale-110' : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
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
                  className="px-5 py-2.5 rounded-xl text-slate-950 bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando colaborador...
                    </>
                  ) : editingUserId ? (
                    'Guardar Cambios'
                  ) : (
                    'Registrar Colaborador'
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
