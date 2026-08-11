import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Client,
  FinancialProduct,
  Loan,
  PaymentRecord,
  User,
  UserRole,
  AmortizationInstallment,
} from '@/types';
import {
  INITIAL_USER,
  MOCK_CLIENTS,
  MOCK_LOANS,
  MOCK_PAYMENTS,
  MOCK_PRODUCTS,
  MOCK_USERS,
} from '@/lib/mockData';
import { getTodayDateString } from '@/lib/utils';

interface ImpulsoStoreState {
  // Autenticación & Sesión
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  login: (email: string, password?: string) => { success: boolean; message: string; user?: User };
  logout: () => void;

  // Gestión de Personal / Usuarios
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'fechaAlta'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;

  // Productos Financieros
  products: FinancialProduct[];
  addProduct: (product: Omit<FinancialProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<FinancialProduct>) => void;
  toggleProductStatus: (id: string) => void;

  // Clientes
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'folio' | 'fechaRegistro'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Préstamos
  loans: Loan[];
  addLoan: (loanData: Omit<Loan, 'id' | 'folio'>) => Loan;

  // Pagos y Cobranza
  payments: PaymentRecord[];
  registerPayment: (params: {
    prestamoId: string;
    numeroCuota: number;
    montoRecibido: number;
    penalizacionCobrada: number;
    metodoPago: 'Efectivo' | 'Transferencia' | 'Tarjeta';
    nota?: string;
  }) => { success: boolean; paymentRecord?: PaymentRecord; message: string };

  // Utilidades
  resetToSeedData: () => void;
}

export const useImpulsoStore = create<ImpulsoStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true,
      currentUser: INITIAL_USER,
      users: MOCK_USERS,

      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),

      login: (email, password) => {
        const state = get();
        const foundUser = state.users.find(
          (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (!foundUser) {
          return {
            success: false,
            message: 'El correo electrónico no se encuentra registrado.',
          };
        }

        if (foundUser.estatus === 'Inactivo') {
          return {
            success: false,
            message: '⛔ Acceso Denegado: Tu cuenta de colaborador se encuentra INACTIVA. Un Administrador ha deshabilitado tu acceso al sistema. Comunícate con la administración para reactivar tu cuenta.',
          };
        }

        if (password && foundUser.password && foundUser.password !== password) {
          return {
            success: false,
            message: 'La contraseña ingresada es incorrecta.',
          };
        }

        set({
          isAuthenticated: true,
          currentUser: foundUser,
        });

        return {
          success: true,
          message: `¡Bienvenido de nuevo, ${foundUser.name}!`,
          user: foundUser,
        };
      },

      logout: () =>
        set({
          isAuthenticated: false,
        }),

      // Operaciones de Personal / Usuarios
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: `usr-${Date.now()}`,
          fechaAlta: getTodayDateString(),
        };

        set((state) => ({
          users: [newUser, ...state.users],
        }));

        return newUser;
      },

      updateUser: (id, userData) =>
        set((state) => {
          const updatedUsers = state.users.map((u) => (u.id === id ? { ...u, ...userData } : u));
          const isUpdatingCurrent = state.currentUser.id === id;
          return {
            users: updatedUsers,
            currentUser: isUpdatingCurrent
              ? { ...state.currentUser, ...userData }
              : state.currentUser,
          };
        }),

      toggleUserStatus: (id) =>
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, estatus: u.estatus === 'Activo' ? 'Inactivo' : 'Activo' } : u
          ),
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),

      // Productos
      products: MOCK_PRODUCTS,

      addProduct: (productData) =>
        set((state) => {
          const newProduct: FinancialProduct = {
            ...productData,
            id: `prod-${Date.now()}`,
          };
          return { products: [newProduct, ...state.products] };
        }),

      updateProduct: (id, productData) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...productData } : p)),
        })),

      toggleProductStatus: (id) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)),
        })),

      // Clientes
      clients: MOCK_CLIENTS,

      addClient: (clientData) => {
        const nextFolioNum = get().clients.length + 101;
        const newClient: Client = {
          ...clientData,
          id: `cli-${Date.now()}`,
          folio: `CLI-00${nextFolioNum}`,
          fechaRegistro: getTodayDateString(),
        };

        set((state) => ({
          clients: [newClient, ...state.clients],
        }));

        return newClient;
      },

      updateClient: (id, clientData) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...clientData } : c)),
        })),

      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),

      // Préstamos
      loans: MOCK_LOANS,

      addLoan: (loanData) => {
        const nextLoanNum = String(get().loans.length + 1).padStart(3, '0');
        const newLoan: Loan = {
          ...loanData,
          id: `loan-${Date.now()}`,
          folio: `PRES-2026-${nextLoanNum}`,
        };

        set((state) => ({
          loans: [newLoan, ...state.loans],
        }));

        return newLoan;
      },

      // Pagos
      payments: MOCK_PAYMENTS,

      registerPayment: ({
        prestamoId,
        numeroCuota,
        montoRecibido,
        penalizacionCobrada,
        metodoPago,
        nota,
      }) => {
        const state = get();
        const loan = state.loans.find((l) => l.id === prestamoId);

        if (!loan) {
          return { success: false, message: 'Préstamo no encontrado.' };
        }

        const installmentIndex = loan.tablaAmortizacion.findIndex(
          (c) => c.numeroCuota === numeroCuota
        );

        if (installmentIndex === -1) {
          return { success: false, message: 'Cuota no encontrada en la tabla.' };
        }

        const installment = loan.tablaAmortizacion[installmentIndex];
        const nuevoMontoPagado = installment.montoPagado + montoRecibido;
        const esPagadoCompleto = nuevoMontoPagado >= installment.cuotaTotal;

        const updatedInstallment: AmortizationInstallment = {
          ...installment,
          montoPagado: nuevoMontoPagado,
          penalizacionesMora: (installment.penalizacionesMora || 0) + penalizacionCobrada,
          estado: esPagadoCompleto ? 'Pagado' : 'Parcial',
          fechaPagoReal: new Date().toISOString(),
        };

        const receiptNum = String(state.payments.length + 90).padStart(3, '0');
        const now = new Date();
        const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          '0'
        )}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
          2,
          '0'
        )}:${String(now.getMinutes()).padStart(2, '0')}`;

        const paymentRecord: PaymentRecord = {
          id: `pay-${Date.now()}`,
          folioRecibo: `REC-2026-${receiptNum}`,
          prestamoId: loan.id,
          prestamoFolio: loan.folio,
          clienteId: loan.clienteId,
          clienteNombre: loan.clienteNombre,
          numeroCuota,
          montoRecibido,
          penalizacionCobrada,
          fechaPago: timestampStr,
          metodoPago,
          cobradorNombre: state.currentUser.name,
          esAbonoParcial: !esPagadoCompleto,
          nota,
        };

        const updatedTable = [...loan.tablaAmortizacion];
        updatedTable[installmentIndex] = updatedInstallment;

        const nuevoSaldoPendiente = Math.max(0, loan.saldoPendiente - montoRecibido);
        const todasCuotasPagadas = updatedTable.every((c) => c.estado === 'Pagado');
        const algunMora = updatedTable.some((c) => c.estado === 'Mora');

        const nuevoEstatus = todasCuotasPagadas
          ? 'Liquidado'
          : algunMora
          ? 'En Mora'
          : 'Activo';

        const updatedLoan: Loan = {
          ...loan,
          saldoPendiente: nuevoSaldoPendiente,
          estatus: nuevoEstatus,
          tablaAmortizacion: updatedTable,
        };

        set({
          loans: state.loans.map((l) => (l.id === prestamoId ? updatedLoan : l)),
          payments: [paymentRecord, ...state.payments],
        });

        return {
          success: true,
          paymentRecord,
          message: esPagadoCompleto
            ? `¡Pago de $${montoRecibido} registrado exitosamente! Cuota #${numeroCuota} liquidada.`
            : `Abono de $${montoRecibido} registrado a la cuota #${numeroCuota}.`,
        };
      },

      resetToSeedData: () =>
        set({
          isAuthenticated: true,
          currentUser: INITIAL_USER,
          users: MOCK_USERS,
          products: MOCK_PRODUCTS,
          clients: MOCK_CLIENTS,
          loans: MOCK_LOANS,
          payments: MOCK_PAYMENTS,
        }),
    }),
    {
      name: 'financiera-impulso-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
