'use server';

import { getClientsAction } from './clienteActions';
import { getLoansAction } from './loanActions';
import { getUsersAction } from './userActions';
import { getProductsAction } from './productActions';
import { getPaymentsAction } from './paymentActions';

export async function fetchAllDatabaseDataAction() {
  try {
    const [clientsRes, loansRes, usersRes, productsRes, paymentsRes] = await Promise.all([
      getClientsAction(),
      getLoansAction(),
      getUsersAction(),
      getProductsAction(),
      getPaymentsAction(),
    ]);

    return {
      success: true,
      clients: clientsRes.clients || [],
      loans: loansRes.loans || [],
      users: usersRes.users || [],
      products: productsRes.products || [],
      payments: paymentsRes.payments || [],
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
    };
  }
}
