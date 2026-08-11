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
  MOCK_LOANS,
  MOCK_PAYMENTS,
  MOCK_PRODUCTS,
  MOCK_USERS,
} from '@/lib/mockData';
import { getTodayDateString } from '@/lib/utils';

interface ImpulsoStoreState {
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  login: (email: string, password?: string) => { success: boolean; message: string; user?: User };
  logout: () => void;

  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (userData: Omit<User, 'id' | 'fechaAlta'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;

  products: FinancialProduct[];
  addProduct: (product: Omit<FinancialProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<FinancialProduct>) => void;
  toggleProductStatus: (id: string) => void;

  clients: Client[];
  setClients: (clients: Client[]) => void;
  addClient: (client: Omit<Client, 'id' | 'folio' | 'fechaRegistro'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  loans: Loan[];
  addLoan: (loanData: Omit<Loan, 'id' | 'folio'>) => Loan;

  payments: PaymentRecord[];
  registerPayment: (params: {
    prestamoId: string;
    numeroCuota: number;
    montoRecibido: number;
    penalizacionCobrada: number;
    metodoPago: string;
    cobradorNombre: string;
    nota?: string;
  }) => { success: boolean; paymentRecord?: PaymentRecord; message: string };

  resetToSeedData: () => void;
}

export const useImpulsoStore = create<ImpulsoStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: INITIAL_USER,
      users: MOCK_USERS,
      products: MOCK_PRODUCTS,
      clients: [],
      loans: MOCK_LOANS,
      payments: MOCK_PAYMENTS,

      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),
      login: (email, password) => {
        const state = get();
        const foundUser = state.users.find(
          (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (!foundUser) {
          return { success: false, message: 'El correo electrónico no se encuentra registrado.' };
        }

        if (foundUser.estatus === 'Inactivo') {
          return { success: false, message: '⛔ Acceso Denegado' };
        }

        if (password && foundUser.password && foundUser.password !== password) {
          return { success: false, message: 'La contraseña ingresada es incorrecta.' };
        }

        set({ isAuthenticated: true, currentUser: foundUser });
        return { success: true, message: `¡Bienvenido!`, user: foundUser };
      },

      logout: () => set({ isAuthenticated: false }),

      setUsers: (users) => set({ users }),
      addUser: (userData) => {
        const newUser: User = { ...userData, id: `usr-${Date.now()}`, fechaAlta: getTodayDateString() };
        set((state) => ({ users: [newUser, ...state.users] }));
        return newUser;
      },
      updateUser: (id, userData) =>
        set((state) => {
          const updatedUsers = state.users.map((u) => (u.id === id ? { ...u, ...userData } : u));
          const isUpdatingCurrent = state.currentUser.id === id;
          return {
            users: updatedUsers,
            currentUser: isUpdatingCurrent ? { ...state.currentUser, ...userData } : state.currentUser,
          };
        }),
      toggleUserStatus: (id) =>
        set((state) => ({
          users: state.users.map((u) => u.id === id ? { ...u, estatus: u.estatus === 'Activo' ? 'Inactivo' : 'Activo' } : u),
        })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter((u) => u.id !== id) })),

      addProduct: (productData) =>
        set((state) => {
          const newProduct: FinancialProduct = { ...productData, id: `prod-${Date.now()}` };
          return { products: [newProduct, ...state.products] };
        }),
      updateProduct: (id, productData) =>
        set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...productData } : p)) })),
      toggleProductStatus: (id) =>
        set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)) })),

      setClients: (clients) => set({ clients }),
      addClient: (clientData) => {
        const nextFolioNum = get().clients.length + 101;
        const newClient: Client = {
          ...clientData,
          id: `cli-${Date.now()}`,
          folio: `CLI-00${nextFolioNum}`,
          fechaRegistro: getTodayDateString(),
        };
        set((state) => ({ clients: [newClient, ...state.clients] }));
        return newClient;
      },
      updateClient: (id, clientData) =>
        set((state) => ({ clients: state.clients.map((c) => (c.id === id ? { ...c, ...clientData } : c)) })),
      deleteClient: (id) => set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

      addLoan: (loanData) => {
        const nextLoanNum = String(get().loans.length + 1).padStart(3, '0');
        const newLoan: Loan = { ...loanData, id: `loan-${Date.now()}`, folio: `PRES-2026-${nextLoanNum}` };
        set((state) => ({ loans: [newLoan, ...state.loans] }));
        return newLoan;
      },

      registerPayment: ({ prestamoId, numeroCuota, montoRecibido, penalizacionCobrada, metodoPago, cobradorNombre, nota }) => {
        return { success: true, message: 'Implementacion dummy' };
      },

      resetToSeedData: () =>
        set({
          isAuthenticated: true,
          currentUser: INITIAL_USER,
          users: MOCK_USERS,
          products: MOCK_PRODUCTS,
          clients: [],
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
