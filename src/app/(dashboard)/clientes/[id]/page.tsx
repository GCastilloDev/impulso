'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Plus,
  CreditCard,
  UserCheck,
  UserCog,
  ShieldAlert,
  Copy,
  Check,
  Mail,
  Edit3,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import {
  CreditScoreBadge,
  LoanStatusBadge,
  InstallmentStatusBadge,
} from '@/components/shared/StatusBadges';
import {
  formatCurrency,
  formatDate,
  formatDateWithTime,
  formatPhoneNumber,
  onlyDigits,
  validatePhone,
  validatePostalCode,
} from '@/lib/utils';
import {
  Client,
  ScoreCrediticio,
  Reference,
} from '@/types';
import { updateClientAction } from '@/app/actions/clienteActions';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded-[4px] hover:bg-surface-subtle text-text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
      title={`${label} al portapapeles`}
      aria-label={`${label} al portapapeles`}
    >
      {copied ? (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-badge-success-text font-semibold bg-badge-success-bg px-1.5 py-0.5 rounded-[3px]">
          <Check className="w-2.5 h-2.5" /> Copiado
        </span>
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function ContactPhoneAction({ phone }: { phone: string }) {
  const cleanDigits = phone.replace(/\D/g, '');
  const displayPhone = formatPhoneNumber(phone);

  return (
    <div className="flex items-center justify-between gap-2">
      <a
        href={`tel:${cleanDigits}`}
        className="text-[13px] font-medium text-link hover:underline transition-colors flex items-center gap-1.5"
        title="Haz clic para marcar automáticamente"
      >
        <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="font-mono">{displayPhone}</span>
      </a>
      <CopyButton text={cleanDigits} label="Copiar teléfono" />
    </div>
  );
}

function ContactEmailAction({ email }: { email?: string | null }) {
  if (!email) {
    return <p className="text-text-muted text-[12px] italic">Sin correo registrado</p>;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <a
        href={`mailto:${email}`}
        className="text-[13px] font-medium text-link hover:underline transition-colors flex items-center gap-1.5 truncate max-w-[210px]"
        title="Enviar correo electrónico"
      >
        <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
        <span className="truncate">{email}</span>
      </a>
      <CopyButton text={email} label="Copiar correo" />
    </div>
  );
}

function CodeBadgeWithCopy({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/60 last:border-0">
      <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[12px] font-medium text-foreground bg-surface-subtle border border-border px-2 py-0.5 rounded-[4px]">
          {value}
        </span>
        <CopyButton text={value} label={`Copiar ${label}`} />
      </div>
    </div>
  );
}

function ReferenceCard({ refData, title }: { refData: Reference; title: string }) {
  const displayAddress = refData.direccionEstructurada
    ? `${refData.direccionEstructurada.calle} #${refData.direccionEstructurada.numExterior}${refData.direccionEstructurada.numInterior ? ` Int ${refData.direccionEstructurada.numInterior}` : ''}, Col. ${refData.direccionEstructurada.colonia}, C.P. ${refData.direccionEstructurada.codigoPostal}, ${refData.direccionEstructurada.ciudad}, ${refData.direccionEstructurada.estado}`
    : refData.direccion || '';

  return (
    <div className="p-3.5 rounded-[6px] border border-border bg-surface-subtle/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        <Badge variant="secondary" className="text-[10.5px] font-medium">
          {refData.parentesco}
        </Badge>
      </div>

      <div className="text-[13px] font-semibold text-foreground">{refData.nombre}</div>

      <div className="pt-0.5">
        <ContactPhoneAction phone={refData.telefono} />
      </div>

      {displayAddress && (
        <div className="pt-2 border-t border-border/60">
          <div className="flex items-start justify-between gap-1 text-[12px] text-text-secondary">
            <div className="flex items-start gap-1.5 leading-snug">
              <MapPin className="w-3 h-3 text-text-muted shrink-0 mt-0.5" />
              <span>{displayAddress}</span>
            </div>
            <CopyButton text={displayAddress} label="Copiar dirección de referencia" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { clients, loans, payments, users, updateClient, currentUser, loadDataFromDB } = useImpulsoStore();

  const isAdmin = currentUser.role === 'Administrador';
  const isPromotor = currentUser.role === 'Promotor de Campo';

  const client = clients.find((c) => c.id === clientId);
  const clientLoans = loans.filter((l) => l.clienteId === clientId);
  const clientPayments = payments.filter((p) => p.clienteId === clientId);

  const activePromotores = users.filter(
    (u) => u.estatus === 'Activo' && (u.role === 'Promotor de Campo' || u.role === 'Administrador')
  );

  // Carga inicial en caso de refresh directo
  useEffect(() => {
    if (clients.length === 0) {
      loadDataFromDB();
    }
  }, [clients.length, loadDataFromDB]);

  // Selección de préstamo para ver cronograma de amortización
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');

  // Modal: Reasignar Promotor
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedPromotorId, setSelectedPromotorId] = useState('');

  // Modal: Editar Expediente de Cliente
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State - Editar Cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [curp, setCurp] = useState('');
  const [rfc, setRfc] = useState('');
  const [folioIne, setFolioIne] = useState('');
  const [scoreCrediticio, setScoreCrediticio] = useState<ScoreCrediticio>('Excelente');
  const [promotorAsignadoId, setPromotorAsignadoId] = useState('');

  // Dirección Particular
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
  const [ref1NumExterior, setRef1NumExterior] = useState('');
  const [ref1NumInterior, setRef1NumInterior] = useState('');
  const [ref1Colonia, setRef1Colonia] = useState('');
  const [ref1CodigoPostal, setRef1CodigoPostal] = useState('');
  const [ref1Ciudad, setRef1Ciudad] = useState('');
  const [ref1Estado, setRef1Estado] = useState('');

  // Referencia 2
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

  if (!client) {
    return (
      <div className="py-16 text-center space-y-4">
        <Card className="max-w-md mx-auto p-8 border-border shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-subtle text-text-muted flex items-center justify-center mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-[17px] font-semibold text-foreground">Cliente no encontrado</h2>
          <p className="text-[13px] text-text-secondary">
            El expediente solicitado no existe o no se encuentra disponible.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/clientes">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Regresar al directorio
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Regla de Protección por Rol: Un promotor de campo solo puede ver expedientes de clientes asignados
  const isAssignedToMe =
    client.promotorAsignadoId === currentUser.id ||
    (client.promotorAsignadoNombre && client.promotorAsignadoNombre === currentUser.name);

  if (isPromotor && !isAssignedToMe) {
    return (
      <div className="py-16">
        <Card className="p-8 rounded-[8px] border-border text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-badge-danger-bg text-badge-danger-text flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-[17px] font-semibold text-foreground">Acceso Restringido a Expediente</h2>
          <p className="text-[13px] text-text-secondary">
            Este cliente no está asignado a tu ruta como Promotor de Campo. Los clientes sin asignación o asignados a otros promotores solo son visibles para la Administración.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/clientes">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Regresar a mis Clientes
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Fallbacks de datos
  const clientRfc = client.rfc || (client.curp ? `${client.curp.slice(0, 10)}AB1` : 'SOLM900101AB1');
  const promotorName = client.promotorAsignadoNombre;

  const ref1: Reference = client.referencia1 || {
    nombre: 'Gonzalo Sánchez Ruiz',
    parentesco: 'Familiar',
    telefono: '5511223344',
    direccionEstructurada: {
      calle: 'Av. Insurgentes Sur',
      numExterior: '1458',
      colonia: 'Actipan',
      codigoPostal: '03920',
      ciudad: 'Benito Juárez',
      estado: 'CDMX',
    },
    direccion: 'Av. Insurgentes Sur N° Ext 1458, Actipan, Benito Juárez, CDMX, C.P. 03920',
  };

  const ref2: Reference = client.referencia2 || {
    nombre: 'Lorena Fernández Vega',
    parentesco: 'Amigo',
    telefono: '5566778899',
    direccionEstructurada: {
      calle: 'Calle 16 de Septiembre',
      numExterior: '204',
      colonia: 'Centro',
      codigoPostal: '50000',
      ciudad: 'Toluca',
      estado: 'Edo. Méx.',
    },
    direccion: 'Calle 16 de Septiembre N° Ext 204, Centro, Toluca, Edo. Méx., C.P. 50000',
  };

  // KPIs financieros
  const totalDeudaActiva = clientLoans
    .filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora')
    .reduce((sum, l) => sum + (l.saldoPendiente || 0), 0);

  const activeLoansCount = clientLoans.filter(
    (l) => l.estatus === 'Activo' || l.estatus === 'En Mora'
  ).length;

  const totalColocadoHistorico = clientLoans.reduce(
    (sum, l) => sum + (l.montoPrincipal || 0),
    0
  );

  const activeLoans = clientLoans.filter((l) => l.estatus === 'Activo' || l.estatus === 'En Mora');
  const primaryActiveLoan = activeLoans.length > 0 ? activeLoans[0] : null;

  const defaultLoanId = primaryActiveLoan?.id || clientLoans[0]?.id || '';
  const effectiveLoanId = selectedLoanId || defaultLoanId;
  const selectedLoan = clientLoans.find((l) => l.id === effectiveLoanId) || null;
  const installments = selectedLoan?.tablaAmortizacion || [];

  // Apertura modal de edición
  const handleOpenEditModal = () => {
    setNombre(client.nombre || '');
    setTelefono(client.telefono || '');
    setEmail(client.email || '');
    setScoreCrediticio(client.scoreCrediticio || 'Excelente');
    setCurp(client.curp || '');
    setRfc(client.rfc || '');
    setFolioIne(client.folioIne || '');
    setPromotorAsignadoId(client.promotorAsignadoId || '');

    const dirEst = client.direccionEstructurada;
    setCalle(dirEst?.calle || '');
    setNumExterior(dirEst?.numExterior || '');
    setNumInterior(dirEst?.numInterior || '');
    setColonia(dirEst?.colonia || '');
    setCodigoPostal(dirEst?.codigoPostal || '');
    setCiudad(dirEst?.ciudad || '');
    setEstado(dirEst?.estado || '');

    const r1 = client.referencia1 || ref1;
    setRef1Nombre(r1?.nombre || '');
    setRef1Parentesco(r1?.parentesco || 'Familiar');
    setRef1Telefono(r1?.telefono || '');
    setRef1Calle(r1?.direccionEstructurada?.calle || '');
    setRef1NumExterior(r1?.direccionEstructurada?.numExterior || '');
    setRef1NumInterior(r1?.direccionEstructurada?.numInterior || '');
    setRef1Colonia(r1?.direccionEstructurada?.colonia || '');
    setRef1CodigoPostal(r1?.direccionEstructurada?.codigoPostal || '');
    setRef1Ciudad(r1?.direccionEstructurada?.ciudad || '');
    setRef1Estado(r1?.direccionEstructurada?.estado || '');

    const r2 = client.referencia2 || ref2;
    setRef2Nombre(r2?.nombre || '');
    setRef2Parentesco(r2?.parentesco || 'Amigo');
    setRef2Telefono(r2?.telefono || '');
    setRef2Calle(r2?.direccionEstructurada?.calle || '');
    setRef2NumExterior(r2?.direccionEstructurada?.numExterior || '');
    setRef2NumInterior(r2?.direccionEstructurada?.numInterior || '');
    setRef2Colonia(r2?.direccionEstructurada?.colonia || '');
    setRef2CodigoPostal(r2?.direccionEstructurada?.codigoPostal || '');
    setRef2Ciudad(r2?.direccionEstructurada?.ciudad || '');
    setRef2Estado(r2?.direccionEstructurada?.estado || '');

    setErrorMsg(null);
    setIsEditModalOpen(true);
  };

  // Guardar Cambios de Edición
  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('El Nombre Completo del cliente es obligatorio.');
      return;
    }
    if (!validatePhone(telefono)) {
      setErrorMsg('El Teléfono Móvil del cliente debe contener exactamente 10 dígitos numéricos.');
      return;
    }
    if (!curp.trim() || curp.trim().length !== 18) {
      setErrorMsg('La CURP es obligatoria y debe contener exactamente 18 caracteres.');
      return;
    }
    if (!rfc.trim() || (rfc.trim().length !== 12 && rfc.trim().length !== 13)) {
      setErrorMsg('El RFC es obligatorio y debe tener 12 o 13 caracteres.');
      return;
    }
    if (!folioIne.trim()) {
      setErrorMsg('La Clave / Folio de INE es obligatoria.');
      return;
    }
    if (!calle.trim()) {
      setErrorMsg('La Calle del domicilio es obligatoria.');
      return;
    }
    if (!numExterior.trim()) {
      setErrorMsg('El Número Exterior del domicilio es obligatorio.');
      return;
    }
    if (!colonia.trim()) {
      setErrorMsg('La Colonia del domicilio es obligatoria.');
      return;
    }
    if (!validatePostalCode(codigoPostal)) {
      setErrorMsg('El Código Postal debe tener 5 dígitos numéricos.');
      return;
    }
    if (!ciudad.trim()) {
      setErrorMsg('La Ciudad / Municipio del domicilio es obligatoria.');
      return;
    }
    if (!estado.trim()) {
      setErrorMsg('El Estado del domicilio es obligatorio.');
      return;
    }
    if (!ref1Nombre.trim()) {
      setErrorMsg('El Nombre de la Referencia 1 es obligatorio.');
      return;
    }
    if (!validatePhone(ref1Telefono)) {
      setErrorMsg('El teléfono de la Referencia 1 debe contener 10 dígitos numéricos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedUser = users.find((u) => u.id === promotorAsignadoId);
      const direccionCompleta = `${calle.trim()} N° Ext ${numExterior.trim()}${numInterior.trim() ? ` Int ${numInterior.trim()}` : ''}, ${colonia.trim()}, ${ciudad.trim()}, ${estado.trim()}, C.P. ${codigoPostal.trim()}`;

      const payload: Partial<Client> = {
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
        referencia2: ref2Nombre.trim()
          ? {
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
            }
          : undefined,
      };

      const res = await updateClientAction(client.id, payload);
      if (res.success) {
        updateClient(client.id, payload);
        setIsEditModalOpen(false);
      } else {
        setErrorMsg(res.message || 'Error al actualizar el expediente.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Error al guardar los cambios en la base de datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reasignar Promotor
  const handleSavePromotor = async () => {
    setIsSubmitting(true);
    try {
      const target = users.find((u) => u.id === selectedPromotorId);
      const updateData = {
        promotorAsignadoId: target ? target.id : null,
        promotorAsignadoNombre: target ? target.name : null,
      };

      const res = await updateClientAction(client.id, updateData);
      if (res.success) {
        updateClient(client.id, updateData);
        setIsReassignModalOpen(false);
      } else {
        alert(res.message || 'Error al reasignar promotor');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Regresar */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a Clientes
        </Link>
      </div>

      {/* Cabecera Estilo Stripe */}
      <div className="pb-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-[22px] md:text-[24px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {client.nombre}
            </h1>
            <p className="text-[13px] text-text-muted">
              {client.email || 'Sin correo electrónico registrado'}
            </p>

            {/* Píldora de ID con copia rápida + Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(client.folio);
                }}
                className="inline-flex items-center gap-1.5 font-mono text-[11.5px] px-2 py-0.5 rounded-[4px] bg-white border border-border text-text-secondary hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
                title="Copiar Folio / ID del Cliente"
              >
                <span>{client.folio}</span>
                <CopyButton text={client.folio} label="Copiar Folio" />
              </button>

              <CreditScoreBadge score={client.scoreCrediticio} />

              <Badge
                variant={
                  client.estatus === 'Activo'
                    ? 'success'
                    : client.estatus === 'Bloqueado'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {client.estatus}
              </Badge>
            </div>
          </div>

          {/* Botones de Acción Principal */}
          <div className="flex items-center gap-2.5 shrink-0 pt-1 md:pt-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEditModal}
                className="h-[34px] px-3 font-medium text-[13px]"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1 text-text-muted" />
                Editar Expediente
              </Button>
            )}

            <Button
              asChild
              variant="stripe-actions"
              size="sm"
              className="h-[34px] px-3.5 font-medium text-[13px]"
            >
              <Link href={`/prestamos/nuevo?clienteId=${client.id}`}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nuevo Crédito
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick KPI Row: Métricas Clave de Cartera */}
        <div className="flex items-center gap-6 sm:gap-10 mt-5 pt-4 border-t border-border flex-wrap">
          <div>
            <span className="text-[11.5px] text-text-muted font-normal block">Deuda activa</span>
            <span className="text-[15px] font-medium font-mono text-foreground mt-0.5 block">
              {formatCurrency(totalDeudaActiva)}{' '}
              <span className="text-[11px] font-normal text-text-muted">MXN</span>
            </span>
          </div>

          <div>
            <span className="text-[11.5px] text-text-muted font-normal block">Préstamos vigentes</span>
            <span className="text-[15px] font-medium font-mono text-foreground mt-0.5 block">
              {activeLoansCount}{' '}
              <span className="text-[11px] font-normal text-text-muted">
                {activeLoansCount === 1 ? 'crédito' : 'créditos'}
              </span>
            </span>
          </div>

          <div>
            <span className="text-[11.5px] text-text-muted font-normal block">Colocado histórico</span>
            <span className="text-[15px] font-medium font-mono text-foreground mt-0.5 block">
              {formatCurrency(totalColocadoHistorico)}{' '}
              <span className="text-[11px] font-normal text-text-muted">MXN</span>
            </span>
          </div>

          <div>
            <span className="text-[11.5px] text-text-muted font-normal block">Acreditado(a) desde</span>
            <span className="text-[15px] font-medium text-foreground mt-0.5 block">
              {formatDate(client.fechaRegistro)}
            </span>
          </div>
        </div>
      </div>

      {/* Distribución en 2 Columnas (30% / 70% en Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8 items-start">
        {/* ====================================================================
             COLUMNA IZQUIERDA (30%): DETALLES, CONTACTO, AVAL Y DOCUMENTOS
             ==================================================================== */}
        <div className="space-y-6">
          {/* Tarjeta de Información de Contacto y Domicilio */}
          <Card className="border-border shadow-2xs">
            <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[15px]">Información de Contacto</CardTitle>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="text-link text-[12px] font-medium hover:underline cursor-pointer"
                >
                  Editar
                </button>
              )}
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {/* Teléfono */}
              <div className="space-y-1">
                <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
                  Teléfono Móvil
                </span>
                <ContactPhoneAction phone={client.telefono} />
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1">
                <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
                  Correo Electrónico
                </span>
                <ContactEmailAction email={client.email} />
              </div>

              {/* Domicilio de Cobro */}
              <div className="space-y-1 pt-1 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider">
                    Domicilio Particular
                  </span>
                  <CopyButton text={client.direccion} label="Copiar domicilio" />
                </div>
                <div className="flex items-start gap-1.5 text-[13px] text-foreground font-normal leading-relaxed pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                  <span>{client.direccion}</span>
                </div>
              </div>

              {/* Documentación Oficial */}
              <div className="pt-2 border-t border-border/60 space-y-1">
                <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block mb-1">
                  Documentación Oficial
                </span>
                <CodeBadgeWithCopy label="CURP" value={client.curp} />
                <CodeBadgeWithCopy label="RFC" value={clientRfc} />
                {client.folioIne && (
                  <CodeBadgeWithCopy label="Clave INE" value={client.folioIne} />
                )}
              </div>

              {/* Promotor Asignado */}
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider">
                    Promotor Asignado
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPromotorId(client.promotorAsignadoId || '');
                        setIsReassignModalOpen(true);
                      }}
                      className="text-link text-[11.5px] font-medium hover:underline cursor-pointer"
                    >
                      Reasignar
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {promotorName ? (
                    <span className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-badge-success-text" />
                      {promotorName}
                    </span>
                  ) : (
                    <Badge variant="warning" className="text-[11px]">
                      Sin Asignar
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Datos del Aval y Referencias */}
          <Card className="border-border shadow-2xs">
            <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[15px]">Aval y Referencias</CardTitle>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="text-link text-[12px] font-medium hover:underline cursor-pointer"
                >
                  Editar
                </button>
              )}
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3.5">
              <ReferenceCard refData={ref1} title="Referencia 1 (Principal)" />
              {ref2 && <ReferenceCard refData={ref2} title="Referencia 2" />}
            </CardContent>
          </Card>
        </div>

        {/* ====================================================================
             COLUMNA DERECHA (70%): CRÉDITOS, AMORTIZACIÓN Y RECIBOS
             ==================================================================== */}
        <div className="space-y-6">
          {/* Crédito Activo Destacado (Tile Estilo Stripe) */}
          {primaryActiveLoan && (
            <div className="p-4 rounded-[6px] border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-[4px] bg-badge-success-bg text-badge-success-text flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[14px] text-foreground">
                      {primaryActiveLoan.productoNombre}
                    </span>
                    <span className="font-mono text-[12px] text-text-muted">
                      ({primaryActiveLoan.folio})
                    </span>
                    <LoanStatusBadge status={primaryActiveLoan.estatus} />
                  </div>
                  <p className="text-[12.5px] text-text-secondary">
                    Cuota regular:{' '}
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(primaryActiveLoan.cuotaRegular)}
                    </span>{' '}
                    ({primaryActiveLoan.frecuenciaPago}) • Saldo insoluto:{' '}
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(primaryActiveLoan.saldoPendiente)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLoanId(primaryActiveLoan.id)}
                  className="text-[12px] h-[30px]"
                >
                  Ver Cronograma
                </Button>
              </div>
            </div>
          )}

          {/* Tabla Contable de Créditos del Cliente */}
          <Card className="border-border shadow-2xs overflow-hidden">
            <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-[15px]">Historial de Créditos</CardTitle>
                <CardDescription className="text-[12px]">
                  Todos los contratos y solicitudes registradas ({clientLoans.length})
                </CardDescription>
              </div>

              <Button
                asChild
                variant="stripe-actions"
                size="sm"
                className="h-[30px] px-3 text-[12px]"
              >
                <Link href={`/prestamos/nuevo?clienteId=${client.id}`}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Nuevo Crédito
                </Link>
              </Button>
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Folio</TableHead>
                  <TableHead>Producto & Plazo</TableHead>
                  <TableHead className="text-right">Monto Principal</TableHead>
                  <TableHead className="text-right">Total a Pagar</TableHead>
                  <TableHead className="text-right">Saldo Insoluto</TableHead>
                  <TableHead className="text-center w-[110px]">Estatus</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientLoans.map((loan) => {
                  const isSelected = loan.id === selectedLoan?.id;
                  return (
                    <TableRow
                      key={loan.id}
                      className={isSelected ? 'bg-surface-subtle/80' : undefined}
                    >
                      <TableCell className="font-mono font-medium text-primary">
                        {loan.folio}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{loan.productoNombre}</div>
                        <div className="text-[11.5px] text-text-muted capitalize">
                          {loan.plazoCantidad} cuotas ({loan.frecuenciaPago})
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-right text-text-secondary">
                        {formatCurrency(loan.montoPrincipal)}
                      </TableCell>
                      <TableCell className="font-mono text-right text-text-secondary">
                        {formatCurrency(loan.totalAPagar)}
                      </TableCell>
                      <TableCell className="font-mono text-right font-semibold text-foreground">
                        {formatCurrency(loan.saldoPendiente)}
                      </TableCell>
                      <TableCell className="text-center">
                        <LoanStatusBadge status={loan.estatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLoanId(loan.id)}
                          className="h-[28px] px-2 text-[12px] text-link hover:underline hover:bg-transparent"
                        >
                          {isSelected ? 'Mostrando' : 'Ver cuotas'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {clientLoans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-text-muted text-[13px]">
                      Este cliente aún no cuenta con créditos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Cronograma de Cuotas (Amortizaciones) */}
          <Card className="border-border shadow-2xs overflow-hidden">
            <CardHeader className="py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-[15px] flex items-center gap-2">
                  <span>Cronograma de Cuotas (Amortización)</span>
                  {selectedLoan && (
                    <Badge variant="outline" className="font-mono font-medium text-[11px]">
                      {selectedLoan.folio}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[12px]">
                  Desglose programado de pagos, saldo insoluto y devengo de mora
                </CardDescription>
              </div>

              {clientLoans.length > 1 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <label htmlFor="select-loan-schedule" className="text-[12px] text-text-muted font-medium">
                    Crédito:
                  </label>
                  <select
                    id="select-loan-schedule"
                    value={effectiveLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    className="text-[12px] h-[30px] px-2 rounded-[4px] border border-border bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  >
                    {clientLoans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.folio} - {l.productoNombre} ({l.estatus})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Monto Cuota</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo Insoluto</TableHead>
                  <TableHead className="text-right">Recargo / Mora</TableHead>
                  <TableHead className="text-center w-[120px]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((inst) => (
                  <TableRow key={inst.numeroCuota}>
                    <TableCell className="font-mono text-text-muted font-medium text-[12px]">
                      {inst.numeroCuota}
                    </TableCell>
                    <TableCell className="text-[12.5px] font-medium text-foreground">
                      {formatDate(inst.fechaVencimiento)}
                    </TableCell>
                    <TableCell className="font-mono text-right font-medium">
                      {formatCurrency(inst.cuotaTotal)}{' '}
                      <span className="text-[10px] text-text-muted">MXN</span>
                    </TableCell>
                    <TableCell className="font-mono text-right text-text-secondary">
                      {formatCurrency(inst.montoPagado)}
                    </TableCell>
                    <TableCell className="font-mono text-right font-semibold text-foreground">
                      {formatCurrency(inst.saldoPendiente)}
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      {inst.recargoPenalizacion && inst.recargoPenalizacion > 0 ? (
                        <span className="text-badge-danger-text font-medium">
                          +{formatCurrency(inst.recargoPenalizacion)}
                        </span>
                      ) : inst.penalizacionesMora && inst.penalizacionesMora > 0 ? (
                        <span className="text-badge-danger-text font-medium">
                          +{formatCurrency(inst.penalizacionesMora)}
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <InstallmentStatusBadge status={inst.estado} />
                    </TableCell>
                  </TableRow>
                ))}

                {installments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-text-muted text-[13px]">
                      {selectedLoan
                        ? 'Este préstamo no tiene tabla de amortización generada.'
                        : 'Selecciona un préstamo para consultar su cronograma.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Recibos de Pago e Historial de Cobros */}
          <Card className="border-border shadow-2xs overflow-hidden">
            <CardHeader className="py-3.5 px-5 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-[15px]">Recibos y Cobros Registrados</CardTitle>
                <CardDescription className="text-[12px]">
                  Historial de pagos recibidos en campo o sucursal ({clientPayments.length})
                </CardDescription>
              </div>
            </CardHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Folio Recibo</TableHead>
                  <TableHead>Crédito & Cuota</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Cobrador</TableHead>
                  <TableHead className="text-right">Monto Recibido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono font-medium text-foreground">
                      {payment.folioRecibo}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[12px] text-text-secondary">
                        {payment.prestamoFolio}
                      </span>
                      <span className="text-[11px] text-text-muted ml-1.5">
                        Cuota #{payment.numeroCuota}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-muted text-[12px]">
                      {formatDateWithTime(payment.fechaPago)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {payment.metodoPago}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[12.5px] text-foreground">
                      {payment.cobradorNombre}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      +{formatCurrency(payment.montoRecibido)}{' '}
                      <span className="text-[10px] text-text-muted">MXN</span>
                      {payment.penalizacionCobrada > 0 && (
                        <div className="text-[10px] text-badge-danger-text font-normal">
                          (inc. {formatCurrency(payment.penalizacionCobrada)} mora)
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {clientPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-text-muted text-[13px]">
                      No se han registrado cobros o recibos de pago para este cliente.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* ====================================================================
           MODAL 1: REASIGNAR PROMOTOR RESPONSABLE
           ==================================================================== */}
      <Dialog open={isReassignModalOpen} onOpenChange={setIsReassignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Asignación de Promotor Responsable
            </DialogTitle>
            <DialogDescription>
              Cliente: <strong className="text-foreground">{client.nombre}</strong> ({client.folio})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="promotor-select" className="block text-[13px] font-medium text-foreground mb-1.5">
                Selecciona Promotor Responsable
              </label>
              <select
                id="promotor-select"
                value={selectedPromotorId}
                onChange={(e) => setSelectedPromotorId(e.target.value)}
                className="w-full h-10 px-3 rounded-[4px] border border-border bg-white text-foreground text-[13px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              >
                <option value="">Sin Asignar (Solo visible para Administración)</option>
                {activePromotores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReassignModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleSavePromotor}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Guardando...
                </>
              ) : (
                'Guardar Asignación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====================================================================
           MODAL 2: EDITAR EXPEDIENTE DE CLIENTE
           ==================================================================== */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-[17px]">
              <Edit3 className="w-5 h-5 text-primary" />
              Editar Expediente del Cliente
            </DialogTitle>
            <DialogDescription>
              Modificación de datos generales, domicilio particular y referencias personales.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3.5 rounded-[4px] bg-badge-danger-bg border border-badge-danger-text/20 text-badge-danger-text text-[13px] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveEditClient} className="space-y-6 py-2">
            {/* Sección 1: Datos Personales */}
            <div className="p-4 rounded-[6px] bg-surface-subtle border border-border space-y-4">
              <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                1. Datos Personales & Identificación
              </h3>

              <div>
                <label className="block text-foreground font-medium mb-1 text-[13px]">
                  Nombre Completo *
                </label>
                <Input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-9 text-[13px] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    CURP (18 caracteres) *
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={18}
                    disabled={isSubmitting}
                    value={curp}
                    onChange={(e) => setCurp(e.target.value.toUpperCase())}
                    className="h-9 text-[13px] uppercase font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    RFC (12 o 13 caracteres) *
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={13}
                    disabled={isSubmitting}
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="h-9 text-[13px] uppercase font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    Clave / Folio INE *
                  </label>
                  <Input
                    type="text"
                    required
                    maxLength={18}
                    disabled={isSubmitting}
                    value={folioIne}
                    onChange={(e) => setFolioIne(e.target.value.toUpperCase())}
                    className="h-9 text-[13px] uppercase font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    Teléfono Móvil (10 dígitos) *
                  </label>
                  <Input
                    type="tel"
                    required
                    maxLength={10}
                    disabled={isSubmitting}
                    value={telefono}
                    onChange={(e) => setTelefono(onlyDigits(e.target.value, 10))}
                    className="h-9 text-[13px] font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    Correo Electrónico
                  </label>
                  <Input
                    type="email"
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    Score Crediticio *
                  </label>
                  <select
                    value={scoreCrediticio}
                    disabled={isSubmitting}
                    onChange={(e) => setScoreCrediticio(e.target.value as ScoreCrediticio)}
                    className="w-full h-9 px-3 rounded-[4px] border border-border bg-white text-foreground text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Alto Riesgo">Alto Riesgo</option>
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">
                    Promotor Asignado
                  </label>
                  <select
                    value={promotorAsignadoId}
                    disabled={isSubmitting}
                    onChange={(e) => setPromotorAsignadoId(e.target.value)}
                    className="w-full h-9 px-3 rounded-[4px] border border-border bg-white text-foreground text-[13px] focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Sin Asignar</option>
                    {activePromotores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sección 2: Domicilio Particular */}
            <div className="p-4 rounded-[6px] bg-surface-subtle border border-border space-y-4">
              <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                2. Domicilio Particular
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Calle *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={calle}
                    onChange={(e) => setCalle(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">N° Ext *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={numExterior}
                    onChange={(e) => setNumExterior(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">N° Int</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={numInterior}
                    onChange={(e) => setNumInterior(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Colonia *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={colonia}
                    onChange={(e) => setColonia(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">C.P. (5 dígitos) *</label>
                  <Input
                    type="text"
                    required
                    maxLength={5}
                    disabled={isSubmitting}
                    value={codigoPostal}
                    onChange={(e) => setCodigoPostal(onlyDigits(e.target.value, 5))}
                    className="h-9 text-[13px] font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Municipio / Ciudad *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground font-medium mb-1 text-[13px]">Estado *</label>
                <Input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="h-9 text-[13px] bg-white"
                />
              </div>
            </div>

            {/* Sección 3: Referencia 1 */}
            <div className="p-4 rounded-[6px] bg-surface-subtle border border-border space-y-4">
              <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                3. Referencia 1 (Obligatoria)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Nombre Completo *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={ref1Nombre}
                    onChange={(e) => setRef1Nombre(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Parentesco *</label>
                  <Input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={ref1Parentesco}
                    onChange={(e) => setRef1Parentesco(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Teléfono (10 dígitos) *</label>
                  <Input
                    type="tel"
                    required
                    maxLength={10}
                    disabled={isSubmitting}
                    value={ref1Telefono}
                    onChange={(e) => setRef1Telefono(onlyDigits(e.target.value, 10))}
                    className="h-9 text-[13px] font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Calle</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref1Calle}
                    onChange={(e) => setRef1Calle(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">N° Ext</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref1NumExterior}
                    onChange={(e) => setRef1NumExterior(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Colonia</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref1Colonia}
                    onChange={(e) => setRef1Colonia(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Sección 4: Referencia 2 */}
            <div className="p-4 rounded-[6px] bg-surface-subtle border border-border space-y-4">
              <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                4. Referencia 2
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Nombre Completo</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref2Nombre}
                    onChange={(e) => setRef2Nombre(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Parentesco</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref2Parentesco}
                    onChange={(e) => setRef2Parentesco(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Teléfono (10 dígitos)</label>
                  <Input
                    type="tel"
                    maxLength={10}
                    disabled={isSubmitting}
                    value={ref2Telefono}
                    onChange={(e) => setRef2Telefono(onlyDigits(e.target.value, 10))}
                    className="h-9 text-[13px] font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Calle</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref2Calle}
                    onChange={(e) => setRef2Calle(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">N° Ext</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref2NumExterior}
                    onChange={(e) => setRef2NumExterior(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-foreground font-medium mb-1 text-[13px]">Colonia</label>
                  <Input
                    type="text"
                    disabled={isSubmitting}
                    value={ref2Colonia}
                    onChange={(e) => setRef2Colonia(e.target.value)}
                    className="h-9 text-[13px] bg-white"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="default" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Guardando cambios...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}