'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  formatDate,
  onlyDigits,
  validatePassword,
  validatePhone,
  validatePostalCode,
  validateBirthdate,
  validateEmail,
} from '@/lib/utils';
import { getUsersAction, getUserByIdAction, createUserAction, updateUserAction, toggleUserStatusAction } from '@/app/actions/userActions';

// Lista de avatares predeterminados profesionales opcionales
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
];

export default function UsersManagementPage() {
  const { currentUser, setUsers } = useImpulsoStore();
  const isAdmin = currentUser?.role === 'Administrador';

  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const showErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  };

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
  const [estado, setEstado] = useState('');

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
      requesterRole: currentUser?.role || 'Administrador',
    });
    if (res.success && res.users) {
      setDbUsers(res.users);
      setUsers(res.users);
    }
    setIsLoading(false);
  }, [currentUser?.role, setUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsersServerSide(searchTerm, roleFilter);
    }, 100);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter, fetchUsersServerSide]);

  // Cierre de Modal con la tecla ESCAPE
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isSubmitting) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSubmitting]);

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
    setEstado('');
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

  const populateUserFields = (u: User) => {
    setEditingUserId(u.id);
    setName(u.name || '');
    setEmail(u.email || '');
    setPassword('');
    setShowPassword(false);

    // Normalización estricta del rol para garantizar la renderización del formulario completo
    const normalizedRole = (u.role && u.role.toLowerCase().includes('admin'))
      ? 'Administrador'
      : 'Promotor de Campo';
    setRole(normalizedRole);

    setTelefono(u.telefono || '');
    setAvatar(u.avatar || '');

    setCurp(u.curp || '');
    setFechaNacimiento(u.fechaNacimiento || '');
    setFolioIne(u.folioIne || '');

    let dir: StructuredAddress | undefined = undefined;
    if (u.direccionEstructurada) {
      if (typeof u.direccionEstructurada === 'string') {
        try { dir = JSON.parse(u.direccionEstructurada); } catch (e) { console.error('Error parsing dir', e); }
      } else {
        dir = u.direccionEstructurada as any;
      }
    }

    if (dir) {
      setCalle(dir.calle || '');
      setNumExterior(dir.numExterior || '');
      setNumInterior(dir.numInterior || '');
      setColonia(dir.colonia || '');
      setCodigoPostal(dir.codigoPostal || '');
      setCiudad(dir.ciudad || '');
      setEstado(dir.estado || '');
    } else {
      setCalle('');
      setNumExterior('');
      setNumInterior('');
      setColonia('');
      setCodigoPostal('');
      setCiudad('');
      setEstado('');
    }

    let ref1: Reference | undefined = undefined;
    if (u.referencia1) {
      if (typeof u.referencia1 === 'string') {
        try { ref1 = JSON.parse(u.referencia1); } catch (e) { console.error('Error parsing ref1', e); }
      } else {
        ref1 = u.referencia1 as any;
      }
    }

    if (ref1) {
      setRef1Nombre(ref1.nombre || '');
      setRef1Parentesco(ref1.parentesco || 'Familiar');
      setRef1Telefono(ref1.telefono || '');

      let r1Dir: StructuredAddress | undefined = undefined;
      if (ref1.direccionEstructurada) {
        if (typeof ref1.direccionEstructurada === 'string') {
          try { r1Dir = JSON.parse(ref1.direccionEstructurada); } catch (e) { console.error('Error parsing r1Dir', e); }
        } else {
          r1Dir = ref1.direccionEstructurada as any;
        }
      }

      if (r1Dir) {
        setRef1Calle(r1Dir.calle || '');
        setRef1NumExt(r1Dir.numExterior || '');
        setRef1NumInt(r1Dir.numInterior || '');
        setRef1Colonia(r1Dir.colonia || '');
        setRef1CP(r1Dir.codigoPostal || '');
        setRef1Ciudad(r1Dir.ciudad || '');
        setRef1Estado(r1Dir.estado || '');
      } else {
        setRef1Calle('');
        setRef1NumExt('');
        setRef1NumInt('');
        setRef1Colonia('');
        setRef1CP('');
        setRef1Ciudad('');
        setRef1Estado('');
      }
    } else {
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
    }

    let ref2: Reference | undefined = undefined;
    if (u.referencia2) {
      if (typeof u.referencia2 === 'string') {
        try { ref2 = JSON.parse(u.referencia2); } catch (e) { console.error('Error parsing ref2', e); }
      } else {
        ref2 = u.referencia2 as any;
      }
    }

    if (ref2) {
      setRef2Nombre(ref2.nombre || '');
      setRef2Parentesco(ref2.parentesco || 'Amigo');
      setRef2Telefono(ref2.telefono || '');

      let r2Dir: StructuredAddress | undefined = undefined;
      if (ref2.direccionEstructurada) {
        if (typeof ref2.direccionEstructurada === 'string') {
          try { r2Dir = JSON.parse(ref2.direccionEstructurada); } catch (e) { console.error('Error parsing r2Dir', e); }
        } else {
          r2Dir = ref2.direccionEstructurada as any;
        }
      }

      if (r2Dir) {
        setRef2Calle(r2Dir.calle || '');
        setRef2NumExt(r2Dir.numExterior || '');
        setRef2NumInt(r2Dir.numInterior || '');
        setRef2Colonia(r2Dir.colonia || '');
        setRef2CP(r2Dir.codigoPostal || '');
        setRef2Ciudad(r2Dir.ciudad || '');
        setRef2Estado(r2Dir.estado || '');
      } else {
        setRef2Calle('');
        setRef2NumExt('');
        setRef2NumInt('');
        setRef2Colonia('');
        setRef2CP('');
        setRef2Ciudad('');
        setRef2Estado('');
      }
    } else {
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
    }
  };

  const openEditUserModal = async (user: User) => {
    // 1. Llenado inmediato sincrónico
    populateUserFields(user);
    setErrorMsg(null);
    setIsModalOpen(true);

    // 2. Consulta de respaldo en segundo plano al servidor PostgreSQL
    setLoadingEditId(user.id);
    try {
      const serverRes = await getUserByIdAction(user.id);
      if (serverRes.success && serverRes.user) {
        populateUserFields(serverRes.user);
      }
    } catch (err) {
      console.error('Error al actualizar desde servidor:', err);
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);

    // --- VALIDACIONES ESTRUCTURADAS (ORDEN DE ARRIBA HACIA ABAJO SEGÚN EL FORMULARIO) ---
    
    // 1. Datos de Cuenta: Nombre Completo
    if (!name || name.trim().length < 3) {
      showErrorMsg('El nombre completo del colaborador es obligatorio (mínimo 3 caracteres).');
      return;
    }

    // 2. Datos de Cuenta: Correo Electrónico
    if (!email || !validateEmail(email)) {
      showErrorMsg('El correo electrónico es obligatorio y debe tener un formato válido (ej: usuario@dominio.com).');
      return;
    }

    // 3. Datos de Cuenta: Contraseña
    if (!editingUserId || (password && password.trim().length > 0)) {
      const pwdCheck = validatePassword(password);
      if (!pwdCheck.isValid) {
        showErrorMsg(pwdCheck.message || 'La contraseña no cumple con los requisitos.');
        return;
      }
    }

    // 4. Datos de Cuenta: Teléfono Móvil
    const phoneCheck = validatePhone(telefono, 'Teléfono Móvil');
    if (!phoneCheck.isValid) {
      showErrorMsg(phoneCheck.message || 'El teléfono móvil es inválido.');
      return;
    }

    // Validaciones Adicionales para Promotores de Campo
    if (role !== 'Administrador') {
      // 5. Identificación: CURP
      if (!curp || curp.trim().length !== 18) {
        showErrorMsg('La CURP es obligatoria (debe contener exactamente 18 caracteres alfanuméricos).');
        return;
      }

      // 6. Identificación: Fecha de Nacimiento
      const bdateCheck = validateBirthdate(fechaNacimiento);
      if (!bdateCheck.isValid) {
        showErrorMsg(bdateCheck.message || 'La Fecha de Nacimiento es inválida.');
        return;
      }

      // 7. Identificación: Clave / Folio INE
      if (!folioIne || folioIne.trim().length < 8) {
        showErrorMsg('La Clave / Folio INE es obligatoria (mínimo 8 caracteres).');
        return;
      }

      // 8. Dirección Particular: Calle
      if (!calle.trim()) {
        showErrorMsg('La Calle de la Dirección Particular es obligatoria.');
        return;
      }

      // 8b. Dirección Particular: N° Ext
      if (!numExterior.trim()) {
        showErrorMsg('El Número Exterior (N° Ext) de la Dirección Particular es obligatorio.');
        return;
      }

      // 8c. Dirección Particular: Colonia
      if (!colonia.trim()) {
        showErrorMsg('La Colonia de la Dirección Particular es obligatoria.');
        return;
      }

      // 8d. Dirección Particular: Código Postal
      const cpCheck = validatePostalCode(codigoPostal, 'Código Postal de la Dirección Particular');
      if (!cpCheck.isValid) {
        showErrorMsg(cpCheck.message || 'El Código Postal de la Dirección Particular es inválido.');
        return;
      }

      // 8e. Dirección Particular: Ciudad
      if (!ciudad.trim()) {
        showErrorMsg('La Ciudad / Municipio de la Dirección Particular es obligatorio.');
        return;
      }

      // 8f. Dirección Particular: Estado
      if (!estado.trim()) {
        showErrorMsg('El Estado de la Dirección Particular es obligatorio.');
        return;
      }

      // 9. Referencia 1: Nombre Completo
      if (!ref1Nombre.trim()) {
        showErrorMsg('El Nombre Completo de la Referencia 1 es obligatorio.');
        return;
      }

      // 9b. Referencia 1: Parentesco
      if (!ref1Parentesco.trim()) {
        showErrorMsg('El Parentesco de la Referencia 1 es obligatorio.');
        return;
      }

      // 9c. Referencia 1: Teléfono
      const ref1PhoneCheck = validatePhone(ref1Telefono, 'Teléfono de Referencia 1');
      if (!ref1PhoneCheck.isValid) {
        showErrorMsg(ref1PhoneCheck.message || 'El teléfono de la Referencia 1 es inválido.');
        return;
      }

      // 9d. Referencia 1: Calle
      if (!ref1Calle.trim()) {
        showErrorMsg('La Calle de la Referencia 1 es obligatoria.');
        return;
      }

      // 9e. Referencia 1: N° Ext
      if (!ref1NumExt.trim()) {
        showErrorMsg('El Número Exterior de la Referencia 1 es obligatorio.');
        return;
      }

      // 9f. Referencia 1: Colonia
      if (!ref1Colonia.trim()) {
        showErrorMsg('La Colonia de la Referencia 1 es obligatoria.');
        return;
      }

      // 9g. Referencia 1: Código Postal
      const ref1CPCheck = validatePostalCode(ref1CP, 'Código Postal de Referencia 1');
      if (!ref1CPCheck.isValid) {
        showErrorMsg(ref1CPCheck.message || 'El Código Postal de la Referencia 1 es inválido.');
        return;
      }

      // 9h. Referencia 1: Ciudad
      if (!ref1Ciudad.trim()) {
        showErrorMsg('La Ciudad / Municipio de la Referencia 1 es obligatorio.');
        return;
      }

      // 9i. Referencia 1: Estado
      if (!ref1Estado.trim()) {
        showErrorMsg('El Estado de la Referencia 1 es obligatorio.');
        return;
      }

      // 10. Referencia 2: Nombre Completo
      if (!ref2Nombre.trim()) {
        showErrorMsg('El Nombre Completo de la Referencia 2 es obligatorio.');
        return;
      }

      // 10b. Referencia 2: Parentesco
      if (!ref2Parentesco.trim()) {
        showErrorMsg('El Parentesco de la Referencia 2 es obligatorio.');
        return;
      }

      // 10c. Referencia 2: Teléfono
      const ref2PhoneCheck = validatePhone(ref2Telefono, 'Teléfono de Referencia 2');
      if (!ref2PhoneCheck.isValid) {
        showErrorMsg(ref2PhoneCheck.message || 'El teléfono de la Referencia 2 es inválido.');
        return;
      }

      // 10d. Referencia 2: Calle
      if (!ref2Calle.trim()) {
        showErrorMsg('La Calle de la Referencia 2 es obligatoria.');
        return;
      }

      // 10e. Referencia 2: N° Ext
      if (!ref2NumExt.trim()) {
        showErrorMsg('El Número Exterior de la Referencia 2 es obligatorio.');
        return;
      }

      // 10f. Referencia 2: Colonia
      if (!ref2Colonia.trim()) {
        showErrorMsg('La Colonia de la Referencia 2 es obligatoria.');
        return;
      }

      // 10g. Referencia 2: Código Postal
      const ref2CPCheck = validatePostalCode(ref2CP, 'Código Postal de Referencia 2');
      if (!ref2CPCheck.isValid) {
        showErrorMsg(ref2CPCheck.message || 'El Código Postal de la Referencia 2 es inválido.');
        return;
      }

      // 10h. Referencia 2: Ciudad
      if (!ref2Ciudad.trim()) {
        showErrorMsg('La Ciudad / Municipio de la Referencia 2 es obligatorio.');
        return;
      }

      // 10i. Referencia 2: Estado
      if (!ref2Estado.trim()) {
        showErrorMsg('El Estado de la Referencia 2 es obligatorio.');
        return;
      }
    }

    setIsSubmitting(true);

    const direccionEstructurada: StructuredAddress | undefined =
      role !== 'Administrador'
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
      role !== 'Administrador'
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
      role !== 'Administrador'
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
          curp: role !== 'Administrador' ? curp : undefined,
          fechaNacimiento: role !== 'Administrador' ? fechaNacimiento : undefined,
          folioIne: role !== 'Administrador' ? folioIne : undefined,
          direccionEstructurada,
          referencia1,
          referencia2,
          requesterRole: currentUser?.role,
        });

        if (res.success && res.user) {
          await fetchUsersServerSide(searchTerm, roleFilter);
          setIsModalOpen(false);
        } else {
          showErrorMsg(res.message || 'Error al actualizar el colaborador');
        }
      } else {
        // Modo Alta Nueva
        const res = await createUserAction({
          name,
          email,
          password,
          role,
          telefono: telefono || undefined,
          avatar: avatar || undefined,
          curp: role !== 'Administrador' ? curp : undefined,
          fechaNacimiento: role !== 'Administrador' ? fechaNacimiento : undefined,
          folioIne: role !== 'Administrador' ? folioIne : undefined,
          direccionEstructurada,
          referencia1,
          referencia2,
          requesterRole: currentUser?.role,
        });

        if (res.success && res.user) {
          await fetchUsersServerSide(searchTerm, roleFilter);
          setIsModalOpen(false);
        } else {
          showErrorMsg(res.message || 'Error al guardar el colaborador');
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
                        disabled={loadingEditId === user.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingEditId === user.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Cargando...
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                            Editar
                          </>
                        )}
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
          <div ref={modalScrollRef} className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
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
                title="Cerrar modal (Esc)"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 shadow-lg shadow-rose-500/10">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUser} noValidate className="space-y-4 text-xs">
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
                  <UserIcon className="w-4 h-4 text-white stroke-[2.5]" />
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
                    <label className="block text-slate-300 font-semibold mb-1">
                      Teléfono Móvil (10 dígitos) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={isSubmitting}
                      placeholder="5599001234"
                      value={telefono}
                      onChange={(e) => setTelefono(onlyDigits(e.target.value, 10))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Campo Contraseña con Regla Visual y Botón de Ojo */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUserId}
                      disabled={isSubmitting}
                      placeholder={editingUserId ? 'Dejar en blanco para mantener la actual' : '••••••••'}
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
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    🔒 <strong className="text-slate-300">Regla:</strong> Mínimo 8 caracteres, al menos 1 mayúscula (A-Z) y 1 número (0-9).
                  </p>
                </div>
              </div>

              {/* Sección Exclusiva para PROMOTOR DE CAMPO */}
              {role !== 'Administrador' && (
                <>
                  {/* Identificación y Nacimiento */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-white stroke-[2.5]" />
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
                          min="1930-01-01"
                          max={`${new Date().getFullYear() - 18}-12-31`}
                          disabled={isSubmitting}
                          value={fechaNacimiento}
                          onChange={(e) => setFechaNacimiento(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-white stroke-[2.5]" />
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
                        <label className="block text-slate-300 font-semibold mb-1">Código Postal (5 dígitos) *</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          disabled={isSubmitting}
                          placeholder="50000"
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
                        placeholder="Ej. Estado de México"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Referencias Personales (Con Dirección Seccionada) */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-white stroke-[2.5]" />
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
                          maxLength={10}
                          disabled={isSubmitting}
                          placeholder="Teléfono (10 dígitos) *"
                          value={ref1Telefono}
                          onChange={(e) => setRef1Telefono(onlyDigits(e.target.value, 10))}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
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
                            maxLength={5}
                            disabled={isSubmitting}
                            placeholder="C.P. (5 dígitos) *"
                            value={ref1CP}
                            onChange={(e) => setRef1CP(onlyDigits(e.target.value, 5))}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
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
                          maxLength={10}
                          disabled={isSubmitting}
                          placeholder="Teléfono (10 dígitos) *"
                          value={ref2Telefono}
                          onChange={(e) => setRef2Telefono(onlyDigits(e.target.value, 10))}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
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
                            maxLength={5}
                            disabled={isSubmitting}
                            placeholder="C.P. (5 dígitos) *"
                            value={ref2CP}
                            onChange={(e) => setRef2CP(onlyDigits(e.target.value, 5))}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono"
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
                  Cancelar (Esc)
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
