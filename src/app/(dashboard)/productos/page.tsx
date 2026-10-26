'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Settings,
  Plus,
  Percent,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Loader2,
  Layers,
  AlertCircle,
  X,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { useImpulsoStore } from '@/store/useImpulsoStore';
import { FinancialProduct, FrecuenciaPago, TipoPenalizacionMora } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { createProductAction, updateProductAction, deleteProductAction } from '@/app/actions/productActions';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ProductsPage() {
  const { products, currentUser, loadDataFromDB } = useImpulsoStore();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<FinancialProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [frecuenciaPago, setFrecuenciaPago] = useState<FrecuenciaPago>('semanal');
  const [plazo, setPlazo] = useState<number | string>('');
  const [tasaInteresGlobal, setTasaInteresGlobal] = useState<number | string>('');
  const [tipoPenalizacionMora, setTipoPenalizacionMora] = useState<TipoPenalizacionMora>('porcentaje');
  const [valorPenalizacionMora, setValorPenalizacionMora] = useState<number | string>('');

  useEffect(() => {
    let isMounted = true;
    setIsPageLoading(true);
    loadDataFromDB().finally(() => {
      if (isMounted) setIsPageLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadDataFromDB]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const isAdmin = currentUser?.role === 'Administrador';

  const showErrorMsg = (msg: string) => {
    setErrorMsg(msg);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  };

  if (isPageLoading) {
    return (
      <Card className="flex flex-col items-center justify-center min-h-[400px] p-12 space-y-4 my-8 bg-card border-border shadow-2xs">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-[13px] font-medium text-text-muted">Consultando catálogo de productos financieros en tiempo real...</p>
      </Card>
    );
  }

  // Si no es Administrador, bloquear acceso
  if (!isAdmin) {
    return (
      <Card className="p-8 rounded-[8px] border border-border bg-card text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xs">
        <div className="w-12 h-12 mx-auto rounded-full bg-badge-danger-bg border border-badge-danger-text/20 flex items-center justify-center text-badge-danger-text">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-[18px] font-semibold text-foreground tracking-tight">Acceso Restringido</h2>
        <p className="text-[13px] text-text-muted leading-relaxed">
          Únicamente los usuarios con rol de <strong>Administrador</strong> tienen autorización para configurar y gestionar los productos financieros.
        </p>
        <div className="pt-2">
          <Button asChild variant="outline">
            <Link href="/">Regresar al Inicio</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const activeVisibleProducts = products.filter((p) => !p.eliminado);
  const activeCount = activeVisibleProducts.filter((p) => p.activo).length;

  const handleToggleStatus = async (p: FinancialProduct) => {
    await updateProductAction(p.id, { activo: !p.activo });
    await loadDataFromDB();
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    await deleteProductAction(deletingProduct.id);
    setDeletingProduct(null);
    await loadDataFromDB();
  };

  const resetForm = () => {
    setErrorMsg(null);
    setEditingProductId(null);
    setNombre('');
    setDescripcion('');
    setFrecuenciaPago('semanal');
    setPlazo('');
    setTasaInteresGlobal('');
    setTipoPenalizacionMora('porcentaje');
    setValorPenalizacionMora('');
  };

  const openNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: FinancialProduct) => {
    setErrorMsg(null);
    setEditingProductId(product.id);
    setNombre(product.nombre);
    setDescripcion(product.descripcion);
    setFrecuenciaPago(product.frecuenciaPago);
    setPlazo(product.plazo);
    setTasaInteresGlobal(product.tasaInteresGlobal);
    setTipoPenalizacionMora(product.tipoPenalizacionMora || 'porcentaje');
    setValorPenalizacionMora(product.valorPenalizacionMora ?? 5);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // --- VALIDACIONES ESTRUCTURADAS (DE ARRIBA HACIA ABAJO SEGÚN EL FORMULARIO) ---
    // 1. Nombre del producto
    if (!nombre.trim() || nombre.trim().length < 3) {
      showErrorMsg('El nombre del producto es obligatorio (mínimo 3 caracteres).');
      return;
    }

    // 2. Plazo (Número de cuotas)
    if (plazo === '' || plazo === undefined || plazo === null) {
      showErrorMsg('El Plazo del producto es obligatorio (ingresa el número de cuotas).');
      return;
    }
    const numPlazo = Number(plazo);
    if (isNaN(numPlazo) || numPlazo <= 0) {
      showErrorMsg('El Plazo del producto debe ser un número entero mayor a 0 cuotas.');
      return;
    }

    // 3. Tasa de Interés Global (%)
    if (tasaInteresGlobal === '' || tasaInteresGlobal === undefined || tasaInteresGlobal === null) {
      showErrorMsg('La Tasa de Interés Global es obligatoria.');
      return;
    }
    const numTasa = Number(tasaInteresGlobal);
    if (isNaN(numTasa) || numTasa <= 0) {
      showErrorMsg('La Tasa de Interés Global debe ser un número mayor a 0%.');
      return;
    }

    // 4. Valor Penalización por Mora
    if (valorPenalizacionMora === '' || valorPenalizacionMora === undefined || valorPenalizacionMora === null) {
      showErrorMsg('El valor de la penalización por mora es obligatorio.');
      return;
    }
    const numPenalizacion = Number(valorPenalizacionMora);
    if (isNaN(numPenalizacion) || numPenalizacion < 0) {
      showErrorMsg('El valor de la penalización por mora no puede ser un número negativo.');
      return;
    }

    const productPayload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      frecuenciaPago,
      plazo: Math.round(numPlazo),
      tasaInteresGlobal: numTasa,
      tipoPenalizacionMora,
      valorPenalizacionMora: numPenalizacion,
      activo: true,
      eliminado: false,
    };

    setIsSaving(true);
    try {
      let res;
      if (editingProductId) {
        res = await updateProductAction(editingProductId, productPayload);
      } else {
        res = await createProductAction(productPayload);
      }

      if (!res || !res.success) {
        showErrorMsg(res?.message || 'No se pudo guardar el producto. Inténtalo de nuevo.');
        return;
      }

      await loadDataFromDB();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      showErrorMsg(err?.message || 'Error de conexión al guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-foreground flex items-center gap-2.5 tracking-tight">
            <Settings className="w-6 h-6 text-primary" />
            Configuración de Productos Financieros
          </h1>
          <p className="text-[13px] text-text-muted mt-1">
            Definición de tasas de interés global, plazos únicos en cuotas y esquemas de penalización por mora.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch de Vistas (Tabla / Tarjetas) */}
          <div className="flex items-center border border-border rounded-[4px] bg-white p-0.5">
            <Button
              type="button"
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-[28px] px-2 text-[12px] gap-1"
              title="Vista de Tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabla
            </Button>
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-[28px] px-2 text-[12px] gap-1"
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tarjetas
            </Button>
          </div>

          <Button
            onClick={openNewModal}
            variant="stripe-actions"
            className="h-[34px] px-3.5 text-[13px] font-medium"
          >
            <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
            + Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Quick Summary Cards (Stripe Dashboard Solid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card border border-border rounded-[6px] shadow-2xs">
          <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
            Productos Totales
          </span>
          <div className="text-[20px] font-semibold text-foreground font-mono mt-1">
            {activeVisibleProducts.length}
          </div>
          <span className="text-[12px] text-text-muted mt-0.5 block">
            Catálogo institucional registrado
          </span>
        </Card>

        <Card className="p-4 bg-card border border-border rounded-[6px] shadow-2xs">
          <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
            Productos Activos
          </span>
          <div className="text-[20px] font-semibold text-foreground font-mono mt-1">
            {activeCount}
          </div>
          <span className="text-[12px] text-badge-success-text font-medium mt-0.5 block">
            Disponibles para nuevas solicitudes
          </span>
        </Card>

        <Card className="p-4 bg-card border border-border rounded-[6px] shadow-2xs">
          <span className="text-[11.5px] font-medium text-text-muted uppercase tracking-wider block">
            Frecuencias Soportadas
          </span>
          <div className="text-[20px] font-semibold text-foreground font-mono mt-1">
            2
          </div>
          <span className="text-[12px] text-text-muted mt-0.5 block">
            Semanal y Diario para microcrédito
          </span>
        </Card>
      </div>

      {/* Catálogo de Productos - Vista de Tabla (Primaria) */}
      {viewMode === 'table' ? (
        <Card className="border border-border rounded-[6px] shadow-2xs overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Producto & Descripción</TableHead>
                <TableHead className="min-w-[120px]">Frecuencia</TableHead>
                <TableHead className="min-w-[110px]">Plazo</TableHead>
                <TableHead className="text-right min-w-[130px]">Tasa Global</TableHead>
                <TableHead className="text-right min-w-[160px]">Penalización Mora</TableHead>
                <TableHead className="min-w-[110px]">Estatus</TableHead>
                <TableHead className="text-right min-w-[180px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeVisibleProducts.map((product) => (
                <TableRow key={product.id}>
                  {/* Nombre & Descripción */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground text-[13px]">{product.nombre}</p>
                      <p className="text-[12px] text-text-muted line-clamp-1 max-w-[280px]">
                        {product.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </TableCell>

                  {/* Frecuencia */}
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[11px] font-medium">
                      {product.frecuenciaPago}
                    </Badge>
                  </TableCell>

                  {/* Plazo */}
                  <TableCell>
                    <span className="font-mono text-[13px] text-foreground font-medium">
                      {product.plazo} cuotas
                    </span>
                  </TableCell>

                  {/* Tasa Interés Global */}
                  <TableCell className="text-right font-mono text-[13px] font-semibold text-foreground">
                    {product.tasaInteresGlobal}%
                  </TableCell>

                  {/* Penalización Mora */}
                  <TableCell className="text-right font-mono text-[13px] text-text-secondary">
                    {product.tipoPenalizacionMora === 'monto_fijo' ? (
                      <span>{formatCurrency(product.valorPenalizacionMora || 0)}</span>
                    ) : (
                      <span>{product.valorPenalizacionMora ?? 0}%</span>
                    )}
                    <span className="block text-[11px] text-text-muted font-sans">
                      {product.tipoPenalizacionMora === 'monto_fijo' ? 'Fijo / cuota' : 'Porcentaje'}
                    </span>
                  </TableCell>

                  {/* Estatus */}
                  <TableCell>
                    {product.activo ? (
                      <Badge variant="success" className="text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(product)}
                        className="h-[28px] px-2 text-[12px] text-text-secondary hover:text-foreground"
                        title={product.activo ? 'Desactivar producto' : 'Activar producto'}
                      >
                        {product.activo ? 'Desactivar' : 'Activar'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(product)}
                        className="h-[28px] px-2.5 text-[12px]"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingProduct(product)}
                        className="h-[28px] px-2.5 text-[12px] text-badge-danger-text hover:bg-badge-danger-bg/50 border-badge-danger-text/20"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {activeVisibleProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center text-text-muted text-[13px]">
                    No hay productos financieros activos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Vista de Tarjetas (Alternativa) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeVisibleProducts.map((product) => (
            <Card
              key={product.id}
              className={`rounded-[6px] border border-border bg-card p-5 shadow-2xs flex flex-col justify-between transition-colors ${
                !product.activo ? 'opacity-65' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground tracking-tight">{product.nombre}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="capitalize text-[11px] font-medium">
                        Frecuencia: {product.frecuenciaPago}
                      </Badge>
                      {product.activo ? (
                        <Badge variant="success" className="text-[11px]">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px]">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStatus(product)}
                    className="h-7 w-7 text-text-muted hover:text-foreground"
                    title={product.activo ? 'Desactivar producto' : 'Activar producto'}
                  >
                    {product.activo ? <CheckCircle2 className="w-4 h-4 text-badge-success-text" /> : <XCircle className="w-4 h-4 text-text-muted" />}
                  </Button>
                </div>

                <p className="text-[12.5px] text-text-muted mb-4 line-clamp-2">
                  {product.descripcion || 'Sin descripción detallada.'}
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                  <div className="p-2.5 rounded-[4px] bg-surface-subtle border border-border">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                      <Percent className="w-3 h-3 text-primary" /> Tasa Interés Global
                    </span>
                    <p className="text-[16px] font-semibold text-foreground font-mono mt-0.5">
                      {product.tasaInteresGlobal}%
                    </p>
                  </div>

                  <div className="p-2.5 rounded-[4px] bg-surface-subtle border border-border">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                      <ShieldAlert className="w-3 h-3 text-badge-danger-text" /> Recargo por Mora
                    </span>
                    <p className="text-[14px] font-semibold text-badge-danger-text font-mono mt-0.5">
                      {product.tipoPenalizacionMora === 'monto_fijo'
                        ? `${formatCurrency(product.valorPenalizacionMora || 0)}`
                        : `${product.valorPenalizacionMora ?? 0}%`}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-[12px] text-text-secondary">
                  <span className="text-text-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Plazo:
                  </span>
                  <span className="font-semibold text-foreground font-mono">
                    {product.plazo} cuotas ({product.frecuenciaPago})
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingProduct(product)}
                  className="h-[28px] px-2.5 text-[12px] text-badge-danger-text hover:bg-badge-danger-bg/50 border-badge-danger-text/20"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(product)}
                  className="h-[28px] px-2.5 text-[12px]"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>
            </Card>
          ))}

          {activeVisibleProducts.length === 0 && (
            <Card className="col-span-full p-8 text-center text-text-muted text-[13px] border border-border bg-card rounded-[6px]">
              No hay productos financieros activos registrados.
            </Card>
          )}
        </div>
      )}

      {/* Modal de Confirmación para Deshabilitar */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Deshabilitar Producto Financiero"
        message={`¿Estás seguro de deshabilitar el producto "${deletingProduct?.nombre}"? No estará disponible para nuevas solicitudes de crédito.`}
        confirmText="Sí, Deshabilitar"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Modal Creación / Edición de Producto (Stripe Styled) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            // Regla estricta: No cerrar modal al hacer click en el backdrop
            e.stopPropagation();
          }}
        >
          <div
            ref={modalScrollRef}
            className="bg-card text-card-foreground w-full max-w-lg p-6 rounded-[8px] border border-border shadow-lg space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h2 className="text-[16px] font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                {editingProductId ? 'Editar Producto Financiero' : 'Nuevo Producto Financiero'}
              </h2>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 text-text-muted hover:text-foreground rounded-[4px]"
                title="Cerrar modal (Esc)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-[6px] bg-badge-danger-bg border border-badge-danger-text/20 text-badge-danger-text text-[12.5px] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} noValidate className="space-y-4 text-[13px]">
              {/* 1. Nombre */}
              <div>
                <label className="block text-text-secondary font-medium mb-1.5">
                  Nombre del Producto *
                </label>
                <Input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Microcrédito Negocio Semanal"
                  className="h-[36px]"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-text-secondary font-medium mb-1.5">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Resumen del público objetivo o condiciones de colocación..."
                  className="w-full px-3 py-2 rounded-[4px] border border-border bg-white text-foreground text-[13px] placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary transition-colors"
                />
              </div>

              {/* 2. Frecuencia y Plazo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1.5">
                    Frecuencia de Pago *
                  </label>
                  <select
                    value={frecuenciaPago}
                    onChange={(e) => setFrecuenciaPago(e.target.value as FrecuenciaPago)}
                    className="w-full h-[36px] px-3 py-1.5 rounded-[4px] border border-border bg-white text-foreground text-[13px] font-normal focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="diario">Diario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary font-medium mb-1.5">
                    Plazo (Número de Cuotas) *
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    required
                    value={plazo}
                    onChange={(e) => setPlazo(e.target.value)}
                    placeholder="Ej: 10"
                    className="h-[36px] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* 3. Tasa de Interés Global */}
              <div>
                <label className="block text-text-secondary font-medium mb-1.5">
                  Tasa de Interés Global (%) *
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  required
                  value={tasaInteresGlobal}
                  onChange={(e) => setTasaInteresGlobal(e.target.value)}
                  placeholder="Ej: 15"
                  className="h-[36px] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* 4. Penalización por Mora Configurable */}
              <div className="p-3.5 rounded-[6px] bg-surface-subtle border border-border space-y-3">
                <label className="block text-text-secondary font-medium">
                  Penalización por Mora (Por Pago Atrasado) *
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={tipoPenalizacionMora === 'porcentaje' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoPenalizacionMora('porcentaje')}
                    className="h-[32px] text-[12px]"
                  >
                    <Percent className="w-3.5 h-3.5 mr-1" /> Porcentaje (%)
                  </Button>

                  <Button
                    type="button"
                    variant={tipoPenalizacionMora === 'monto_fijo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTipoPenalizacionMora('monto_fijo')}
                    className="h-[32px] text-[12px]"
                  >
                    <span className="mr-1">$</span> Monto Fijo ($ MXN)
                  </Button>
                </div>

                <div>
                  <label className="block text-text-muted text-[11.5px] font-medium mb-1">
                    {tipoPenalizacionMora === 'porcentaje'
                      ? 'Porcentaje por cuota vencida (%):'
                      : 'Monto fijo en pesos por cuota vencida ($ MXN):'}
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    required
                    value={valorPenalizacionMora}
                    onChange={(e) => setValorPenalizacionMora(e.target.value)}
                    placeholder={tipoPenalizacionMora === 'porcentaje' ? 'Ej: 5' : 'Ej: 50'}
                    className="h-[36px] font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Aplica acumulativamente por cada cuota vencida según las reglas financieras del producto.
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="stripe-actions"
                  disabled={isSaving}
                  className="gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    'Guardar Producto'
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
