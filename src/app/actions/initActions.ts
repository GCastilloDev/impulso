'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getClientsAction } from './clienteActions';
import { getLoansAction } from './loanActions';
import { getUsersAction } from './userActions';
import { getProductsAction } from './productActions';
import { getPaymentsAction } from './paymentActions';
import { getCashClosuresAction } from './closureActions';

export async function fetchAllDatabaseDataAction() {
  noStore();
  try {
    const [clientsRes, loansRes, usersRes, productsRes, paymentsRes, closuresRes] = await Promise.all([
      getClientsAction(),
      getLoansAction(),
      getUsersAction(),
      getProductsAction(),
      getPaymentsAction(),
      getCashClosuresAction(),
    ]);

    return {
      success: true,
      clients: clientsRes.clients || [],
      loans: loansRes.loans || [],
      users: usersRes.users || [],
      products: productsRes.products || [],
      payments: paymentsRes.payments || [],
      closures: closuresRes.closures || [],
    };
  } catch (error: any) {
    console.error('Error fetching initial database data:', error);
    return {
      success: false,
      message: error.message || 'Error al conectar con la base de datos.',
      clients: [],
      loans: [],
      users: [],
      products: [],
      payments: [],
      closures: [],
    };
  }
}
