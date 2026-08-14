import { create } from 'zustand';
import {
  Client,
  FinancialProduct,
  Loan,
  PaymentRecord,
  User,
} from '@/types';
import { INITIAL_USER } from '@/lib/mockData';
import { fetchAllDatabaseDataAction } from '@/app/actions/initActions';

interface ImpulsoStoreState {
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  login: (email: string, password?: string) => { success: boolean; message: string; user?: User };
  logout: () => void;

  isLoadingDB: boolean;
  loadDataFromDB: () => Promise<void>;
  setAllData: (data: {
    clients?: Client[];
    loans?: Loan[];
    users?: User[];
    products?: FinancialProduct[];
    payments?: PaymentRecord[];
  }) => void;

  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (userData: Omit<User, 'id' | 'fechaAlta'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;

  products: FinancialProduct[];
  setProducts: (products: FinancialProduct[]) => void;
  addProduct: (product: Omit<FinancialProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<FinancialProduct>) => void;
  toggleProductStatus: (id: string) => void;
  deleteProduct: (id: string) => void;

  clients: Client[];
  setClients: (clients: Client[]) => void;
  addClient: (client: Omit<Client, 'id' | 'folio' | 'fechaRegistro'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  addLoan: (loanData: Omit<Loan, 'id' | 'folio'>) => Loan;
  updateLoan: (id: string, loanData: Partial<Loan>) => void;
  approveLoan: (id: string) => void;
  rejectLoan: (id: string, motivoRechazo: string) => void;

  payments: PaymentRecord[];
  setPayments: (payments: PaymentRecord[]) => void;

  resetToSeedData: () => void;
}

export const useImpulsoStore = create<ImpulsoStoreState>()((set, get) => ({
  isAuthenticated: true,
  currentUser: INITIAL_USER,
  isLoadingDB: false,

  users: [],
  products: [],
  clients: [],
  loans: [],
  payments: [],

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

  loadDataFromDB: async () => {
    set({ isLoadingDB: true });
    try {
      const res = await fetchAllDatabaseDataAction();
      if (res.success) {
        set({
          clients: res.clients,
          loans: res.loans,
          users: res.users,
          products: res.products,
          payments: res.payments,
        });
      }
    } finally {
      set({ isLoadingDB: false });
    }
  },

  setAllData: (data) =>
    set((state) => ({
      clients: data.clients ?? state.clients,
      loans: data.loans ?? state.loans,
      users: data.users ?? state.users,
      products: data.products ?? state.products,
      payments: data.payments ?? state.payments,
    })),

  setUsers: (users) => set({ users }),
  addUser: (userData) => {
    const newUser: User = { ...userData, id: `usr-${Date.now()}`, fechaAlta: new Date().toISOString().split('T')[0] };
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
      users: state.users.map((u) => (u.id === id ? { ...u, estatus: u.estatus === 'Activo' ? 'Inactivo' : 'Activo' } : u)),
    })),
  deleteUser: (id) => set((state) => ({ users: state.users.filter((u) => u.id !== id) })),

  setProducts: (products) => set({ products }),
  addProduct: (productData) =>
    set((state) => {
      const newProduct: FinancialProduct = { ...productData, id: `prod-${Date.now()}` };
      return { products: [newProduct, ...state.products] };
    }),
  updateProduct: (id, productData) =>
    set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...productData } : p)) })),
  toggleProductStatus: (id) =>
    set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, activo: !p.activo } : p)) })),
  deleteProduct: (id) =>
    set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, activo: false, eliminado: true } : p)) })),

  setClients: (clients) => set({ clients }),
  addClient: (clientData) => {
    const nextFolioNum = get().clients.length + 101;
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      folio: `CLI-00${nextFolioNum}`,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ clients: [newClient, ...state.clients] }));
    return newClient;
  },
  updateClient: (id, clientData) =>
    set((state) => ({ clients: state.clients.map((c) => (c.id === id ? { ...c, ...clientData } : c)) })),
  deleteClient: (id) => set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

  setLoans: (loans) => set({ loans }),
  addLoan: (loanData) => {
    const nextLoanNum = String(get().loans.length + 1).padStart(3, '0');
    const newLoan: Loan = { ...loanData, id: `loan-${Date.now()}`, folio: `PRES-2026-${nextLoanNum}` };
    set((state) => ({ loans: [newLoan, ...state.loans] }));
    return newLoan;
  },
  updateLoan: (id, loanData) =>
    set((state) => ({ loans: state.loans.map((l) => (l.id === id ? { ...l, ...loanData } : l)) })),
  approveLoan: (id) =>
    set((state) => ({
      loans: state.loans.map((l) => (l.id === id ? { ...l, estatus: 'Activo' as const } : l)),
    })),
  rejectLoan: (id, motivoRechazo) =>
    set((state) => ({
      loans: state.loans.map((l) => (l.id === id ? { ...l, estatus: 'Rechazado' as const, motivoRechazo } : l)),
    })),

  setPayments: (payments) => set({ payments }),

  resetToSeedData: () => {
    get().loadDataFromDB();
  },
}));
