import { doc, setDoc, getDocs, getDoc, collection, onSnapshot, deleteDoc, writeBatch, Unsubscribe } from 'firebase/firestore';
import firebaseConfig, { db } from '../lib/firebase';
import {
  UserAccount,
  Employee,
  CompanySettings,
  AccountReceivable,
  Expense,
  ServiceOrder,
  SubscriptionPlanInfo,
  Customer,
  Product,
  Device,
  Sale
} from '../types';
import { prepareAccountForSave, normalizeAccountData, CanonicalAccount } from './accountSchema';
import { CloudEngine } from './cloudEngine';

export const DEMO_ORDER_IDS = new Set([
  'os-1001', 'os-1002', 'os-1003', 'os-1004', 'os-1005', 'os-1006', 'os-1007',
  'os-1008', 'os-1009', 'os-1010', 'os-1011', 'os-1012', 'os-1013', 'os-1014',
  'os-1015', 'os-1016', 'os-1017', 'os-1018', 'os-1019', 'os-1020'
]);

export function getTenantId(): string {
  try {
    if (typeof window !== 'undefined') {
      const rawSession1 = sessionStorage.getItem('msp_auth_session_v1') || localStorage.getItem('msp_auth_session_v1');
      if (rawSession1) {
        const session = JSON.parse(rawSession1);
        if (session && session.email && session.email.includes('@')) {
          return session.email.trim().toLowerCase();
        }
      }
      const rawSession2 = sessionStorage.getItem('msp_auth_session') || localStorage.getItem('msp_auth_session');
      if (rawSession2) {
        const session = JSON.parse(rawSession2);
        if (session && session.email && session.email.includes('@')) {
          return session.email.trim().toLowerCase();
        }
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('current_user')) {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const u = JSON.parse(raw);
              if (u && u.email && u.email.includes('@')) {
                return u.email.trim().toLowerCase();
              }
            }
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'msp404011@gmail.com';
}

function getTenantStorageScope(): string {
  const t = getTenantId();
  return `tenant_${t.replace(/[^a-z0-9_]/g, '_')}`;
}

let ordersUnsubscribe: Unsubscribe | null = null;

export const FirestoreSyncService = {
  /**
   * Save user account to Firestore /accounts/{id} (global account record)
   */
  async saveUserAccount(account: UserAccount): Promise<void> {
    try {
      if (!db || !account.id || account.id === 'default_tenant') return;
      const prepared = prepareAccountForSave(account);
      const docRef = doc(db, 'accounts', account.id);
      await setDoc(docRef, prepared, { merge: true });
    } catch (err) {
      console.warn('Firestore saveUserAccount error:', err);
    }
  },

  /**
   * Save a giant flat JSON payload compatible with external admin panel
   */
  async saveFullTenantProfile(data: any): Promise<void> {
    try {
      if (!db || !data.email) return;
      const targetId = (data.email || data.id || data.uid).trim().toLowerCase();
      if (targetId === 'default_tenant') return;
      const prepared = prepareAccountForSave({ ...data, id: targetId });
      const docRef = doc(db, 'accounts', targetId);
      await setDoc(docRef, prepared, { merge: true });
    } catch (err) {
      console.warn('Firestore saveFullTenantProfile error:', err);
    }
  },

  /**
   * Save company settings & shop info to Firestore /accounts/{tenantId}
   */
  async saveCompanySettings(settings: CompanySettings): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId);
      await setDoc(
        docRef,
        {
          companySettings: settings,
          empresa: settings.commercialName || settings.name || 'Assistência Técnica',
          nomeEmpresa: settings.name || settings.commercialName || 'Assistência Técnica',
          nomeFantasia: settings.commercialName || settings.name || 'Assistência Técnica',
          logoUrl: settings.logoUrl || '',
          telefone: settings.phone || settings.whatsapp || '',
          whatsapp: settings.whatsapp || settings.phone || '',
          cnpj: settings.cnpj || settings.cnpjCpf || '',
          endereco: settings.address || '',
          responsavel: settings.ownerName || '',
          slogan: settings.slogan || '',
          cidade: settings.city || '',
          bairro: settings.neighborhood || '',
          cep: settings.zipCode || '',
          uf: settings.state || '',
          chavePix: settings.pixKey || '',
          termoGarantia: settings.warrantyText || settings.defaultWarrantyTerms || '',
          prazoGarantia: settings.defaultWarrantyDays || 90,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore saveCompanySettings error:', err);
    }
  },

  /**
   * Save custom OS configurations (device types, accessories, statuses, payments) to Firestore
   */
  async saveCustomOsConfigs(configs: {
    customOSStatuses?: any[];
    customDeviceTypes?: any[];
    customAccessories?: any[];
    customPaymentMethods?: any[];
    customCategories?: any[];
  }): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId);
      await setDoc(
        docRef,
        {
          customOsConfigs: configs,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Firestore saveCustomOsConfigs error:', err);
    }
  },

  /**
   * Save service order to Firestore /accounts/{tenantId}/orders/{id}
   */
  async saveOrder(order: ServiceOrder): Promise<void> {
    try {
      if (!db || !order.id || DEMO_ORDER_IDS.has(order.id)) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'orders', order.id);
      await setDoc(docRef, order, { merge: true });
    } catch (err) {
      console.warn('Firestore saveOrder error:', err);
    }
  },

  /**
   * Save customer to Firestore /accounts/{tenantId}/customers/{id}
   */
  async saveCustomer(customer: Customer): Promise<void> {
    try {
      if (!db || !customer.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'customers', customer.id);
      await setDoc(docRef, customer, { merge: true });
    } catch (err) {
      console.warn('Firestore saveCustomer error:', err);
    }
  },

  /**
   * Save product to Firestore /accounts/{tenantId}/products/{id}
   */
  async saveProduct(product: Product): Promise<void> {
    try {
      if (!db || !product.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'products', product.id);
      await setDoc(docRef, product, { merge: true });
    } catch (err) {
      console.warn('Firestore saveProduct error:', err);
    }
  },

  /**
   * Save device to Firestore /accounts/{tenantId}/devices/{id}
   */
  async saveDevice(device: Device): Promise<void> {
    try {
      if (!db || !device.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'devices', device.id);
      await setDoc(docRef, device, { merge: true });
    } catch (err) {
      console.warn('Firestore saveDevice error:', err);
    }
  },

  /**
   * Save sale to Firestore /accounts/{tenantId}/sales/{id}
   */
  async saveSale(sale: Sale): Promise<void> {
    try {
      if (!db || !sale.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'sales', sale.id);
      await setDoc(docRef, sale, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSale error:', err);
    }
  },

  /**
   * Save accounts receivable to Firestore /accounts/{tenantId}/receivables/{id}
   */
  async saveReceivable(receivable: AccountReceivable): Promise<void> {
    try {
      if (!db || !receivable.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'receivables', receivable.id);
      await setDoc(docRef, receivable, { merge: true });
    } catch (err) {
      console.warn('Firestore saveReceivable error:', err);
    }
  },

  /**
   * Save expense / account payable to Firestore /accounts/{tenantId}/expenses/{id}
   */
  async saveExpense(expense: Expense): Promise<void> {
    try {
      if (!db || !expense.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'expenses', expense.id);
      await setDoc(docRef, expense, { merge: true });
    } catch (err) {
      console.warn('Firestore saveExpense error:', err);
    }
  },

  /**
   * Delete service order from Firestore
   */
  async deleteOrder(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'orders', id));
    } catch (err) {
      console.warn('Firestore deleteOrder error:', err);
    }
  },

  /**
   * Delete customer from Firestore
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'customers', id));
    } catch (err) {
      console.warn('Firestore deleteCustomer error:', err);
    }
  },

  /**
   * Delete product from Firestore
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'products', id));
    } catch (err) {
      console.warn('Firestore deleteProduct error:', err);
    }
  },

  /**
   * Delete device from Firestore
   */
  async deleteDevice(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'devices', id));
    } catch (err) {
      console.warn('Firestore deleteDevice error:', err);
    }
  },

  /**
   * Delete sale from Firestore
   */
  async deleteSale(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'sales', id));
    } catch (err) {
      console.warn('Firestore deleteSale error:', err);
    }
  },

  /**
   * Delete expense from Firestore
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'expenses', id));
    } catch (err) {
      console.warn('Firestore deleteExpense error:', err);
    }
  },

  /**
   * Delete receivable from Firestore
   */
  async deleteReceivable(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'receivables', id));
    } catch (err) {
      console.warn('Firestore deleteReceivable error:', err);
    }
  },

  /**
   * Save employee to Firestore /accounts/{tenantId}/employees/{id}
   */
  async saveEmployee(employee: Employee): Promise<void> {
    try {
      if (!db || !employee.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'employees', employee.id);
      await setDoc(docRef, employee, { merge: true });
    } catch (err) {
      console.warn('Firestore saveEmployee error:', err);
    }
  },

  /**
   * Delete employee from Firestore
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'employees', id));
    } catch (err) {
      console.warn('Firestore deleteEmployee error:', err);
    }
  },

  /**
   * Fetch employees from Firestore
   */
  async fetchEmployees(): Promise<Employee[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'employees');
      const snap = await getDocs(colRef);
      const list: Employee[] = [];
      snap.forEach((d) => {
        const item = d.data() as Employee;
        if (item && item.id) list.push(item);
      });
      return list;
    } catch (err) {
      console.warn('Firestore fetchEmployees error:', err);
      return [];
    }
  },

  /**
   * Save supplier to Firestore /accounts/{tenantId}/suppliers/{id}
   */
  async saveSupplier(supplier: any): Promise<void> {
    try {
      if (!db || !supplier.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'suppliers', supplier.id);
      await setDoc(docRef, supplier, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSupplier error:', err);
    }
  },

  /**
   * Delete supplier from Firestore
   */
  async deleteSupplier(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'suppliers', id));
    } catch (err) {
      console.warn('Firestore deleteSupplier error:', err);
    }
  },

  /**
   * Fetch suppliers from Firestore
   */
  async fetchSuppliers(): Promise<any[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'suppliers');
      const snap = await getDocs(colRef);
      const list: any[] = [];
      snap.forEach((d) => {
        const item = d.data();
        if (item && item.id) list.push(item);
      });
      return list;
    } catch (err) {
      console.warn('Firestore fetchSuppliers error:', err);
      return [];
    }
  },

  /**
   * Save supplier order group to Firestore
   */
  async saveSupplierOrder(order: any): Promise<void> {
    try {
      if (!db || !order.id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'supplier_orders', order.id);
      await setDoc(docRef, order, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSupplierOrder error:', err);
    }
  },

  /**
   * Delete supplier order group from Firestore
   */
  async deleteSupplierOrder(id: string): Promise<void> {
    try {
      if (!db || !id) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'supplier_orders', id));
    } catch (err) {
      console.warn('Firestore deleteSupplierOrder error:', err);
    }
  },

  /**
   * Save supplier purchase piece/debt to Firestore
   */
  async saveSupplierPurchase(item: any): Promise<void> {
    try {
      if (!db || !item.purchaseId) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'supplier_purchases', item.purchaseId);
      await setDoc(docRef, item, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSupplierPurchase error:', err);
    }
  },

  /**
   * Delete supplier purchase piece from Firestore
   */
  async deleteSupplierPurchase(purchaseId: string): Promise<void> {
    try {
      if (!db || !purchaseId) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      await deleteDoc(doc(db, 'accounts', tenantId, 'supplier_purchases', purchaseId));
    } catch (err) {
      console.warn('Firestore deleteSupplierPurchase error:', err);
    }
  },

  /**
   * Save supplier field settings (Categories, Buttons, Options) directly to Firestore
   */
  async saveSupplierFieldSettings(settings: any): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId, 'settings', 'supplierOrderFields');
      await setDoc(docRef, settings, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSupplierFieldSettings error:', err);
    }
  },

  /**
   * Clear all tenant data from Firestore
   */
  async clearAllFirestoreData(): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const collections = ['orders', 'customers', 'products', 'devices', 'sales', 'expenses', 'receivables'];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, 'accounts', tenantId, colName));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
    } catch (err) {
      console.warn('Firestore clearAllFirestoreData error:', err);
    }
  },

  /**
   * Save subscription plan to Firestore /accounts/{tenantId} (Flat structure)
   */
  async saveSubscriptionPlan(plan: SubscriptionPlanInfo): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;
      const docRef = doc(db, 'accounts', tenantId);
      
      const flatPlanData = {
        plan: plan.planName,
        planName: plan.planName,
        plano: plan.planName,
        planoNome: plan.planName,
        planoId: plan.planType,
        planType: plan.planType,
        valorPlano: plan.planPrice,
        valorMensalidade: plan.planPrice,
        mensalidade: plan.planPrice,
        amount: plan.planPrice,
        status: plan.status === 'active' ? 'ativo' : 'inativo',
        situacao: plan.status,
        userStatus: plan.status,
        vencimento: plan.expiryDate,
        dataVencimento: plan.expiryDate,
        dueDate: plan.expiryDate,
        trialEndsAt: plan.expiryDate
      };
      
      await setDoc(docRef, flatPlanData, { merge: true });
    } catch (err) {
      console.warn('Firestore saveSubscriptionPlan error:', err);
    }
  },

  /**
   * Load all service orders from Firestore for current tenant
   */
  async fetchOrders(): Promise<ServiceOrder[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'orders');
      const snap = await getDocs(colRef);
      const orders: ServiceOrder[] = [];
      snap.forEach((d) => {
        const o = d.data() as ServiceOrder;
        if (o && o.id && !DEMO_ORDER_IDS.has(o.id)) orders.push(o);
      });
      return orders;
    } catch (err) {
      console.warn('Firestore fetchOrders error:', err);
      return [];
    }
  },

  /**
   * Load all customers from Firestore for current tenant
   */
  async fetchCustomers(): Promise<Customer[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'customers');
      const snap = await getDocs(colRef);
      const customers: Customer[] = [];
      snap.forEach((d) => {
        const c = d.data() as Customer;
        if (c && c.id) customers.push(c);
      });
      return customers;
    } catch (err) {
      console.warn('Firestore fetchCustomers error:', err);
      return [];
    }
  },

  /**
   * Load all products from Firestore for current tenant
   */
  async fetchProducts(): Promise<Product[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'products');
      const snap = await getDocs(colRef);
      const products: Product[] = [];
      snap.forEach((d) => {
        const p = d.data() as Product;
        if (p && p.id) products.push(p);
      });
      return products;
    } catch (err) {
      console.warn('Firestore fetchProducts error:', err);
      return [];
    }
  },

  /**
   * Load all devices from Firestore for current tenant
   */
  async fetchDevices(): Promise<Device[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'devices');
      const snap = await getDocs(colRef);
      const devices: Device[] = [];
      snap.forEach((d) => {
        const dev = d.data() as Device;
        if (dev && dev.id) devices.push(dev);
      });
      return devices;
    } catch (err) {
      console.warn('Firestore fetchDevices error:', err);
      return [];
    }
  },

  /**
   * Load all receivables (fiados) from Firestore for current tenant
   */
  async fetchReceivables(): Promise<AccountReceivable[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'receivables');
      const snap = await getDocs(colRef);
      const receivables: AccountReceivable[] = [];
      snap.forEach((d) => {
        const rec = d.data() as AccountReceivable;
        if (rec && rec.id) receivables.push(rec);
      });
      return receivables;
    } catch (err) {
      console.warn('Firestore fetchReceivables error:', err);
      return [];
    }
  },

  /**
   * Load all expenses from Firestore for current tenant
   */
  async fetchExpenses(): Promise<Expense[]> {
    try {
      if (!db) return [];
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return [];
      const colRef = collection(db, 'accounts', tenantId, 'expenses');
      const snap = await getDocs(colRef);
      const expenses: Expense[] = [];
      snap.forEach((d) => {
        const exp = d.data() as Expense;
        if (exp && exp.id) expenses.push(exp);
      });
      return expenses;
    } catch (err) {
      console.warn('Firestore fetchExpenses error:', err);
      return [];
    }
  },

  /**
   * Load all user accounts from Firestore
   */
  async fetchUserAccounts(): Promise<CanonicalAccount[]> {
    try {
      if (!db) return [];
      const querySnapshot = await getDocs(collection(db, 'accounts'));
      const accounts: CanonicalAccount[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        if (data) {
          accounts.push(normalizeAccountData(d.id, data));
        }
      });
      return accounts;
    } catch (err) {
      console.warn('Firestore fetchUserAccounts error:', err);
      return [];
    }
  },

  /**
   * Downloads all tenant data from Firestore and merges it into local storage.
   * Ensures that any computer logging in immediately sees all OS, Customers, Products, etc.
   */
  async syncAllFromFirestore(onSuccess?: () => void): Promise<boolean> {
    try {
      if (!db) return false;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return false;

      const scope = getTenantStorageScope();

      // 1. Fetch Company Settings & Custom OS Configs from tenant doc
      const tenantDocRef = doc(db, 'accounts', tenantId);
      const tenantSnap = await getDoc(tenantDocRef);
      if (tenantSnap.exists()) {
        const data = tenantSnap.data();
        if (data.companySettings) {
          localStorage.setItem(`${scope}_msp_settings_v1`, JSON.stringify(data.companySettings));
        }
        if (data.customOsConfigs) {
          const cfg = data.customOsConfigs;
          if (cfg.customOSStatuses) {
            localStorage.setItem(`${scope}_msp_custom_os_statuses_v1`, JSON.stringify(cfg.customOSStatuses));
          }
          if (cfg.customDeviceTypes) {
            localStorage.setItem(`${scope}_msp_custom_device_types_v1`, JSON.stringify(cfg.customDeviceTypes));
          }
          if (cfg.customAccessories) {
            localStorage.setItem(`${scope}_msp_custom_accessories_v4`, JSON.stringify(cfg.customAccessories));
          }
          if (cfg.customPaymentMethods) {
            localStorage.setItem(`${scope}_msp_custom_payment_methods_v1`, JSON.stringify(cfg.customPaymentMethods));
          }
        }
      }

      // Helper to merge remote array with local array by ID (remote takes priority)
      const mergeCollections = <T extends { id: string }>(localArr: T[], remoteArr: T[]): T[] => {
        const map = new Map<string, T>();
        localArr.forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
        remoteArr.forEach((item) => {
          if (item && item.id) map.set(item.id, item);
        });
        return Array.from(map.values());
      };

      const getLocalKey = <T extends { id: string }>(key: string): T[] => {
        try {
          const map = new Map<string, T>();
          const keysToTry = [`${scope}__${key}`, `${scope}_${key}`, key];
          for (const k of keysToTry) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                parsed.forEach((item) => {
                  if (item && item.id) {
                    if (key === 'msp_orders_v2' && DEMO_ORDER_IDS.has(item.id)) return;
                    map.set(item.id, item as T);
                  }
                });
              }
            }
          }
          return Array.from(map.values());
        } catch {
          return [];
        }
      };

      const setLocalKey = <T extends { id?: string }>(key: string, data: T[]): void => {
        try {
          let cleanData = data;
          if (key === 'msp_orders_v2') {
            cleanData = data.filter((item) => item && item.id && !DEMO_ORDER_IDS.has(item.id));
          }
          const json = JSON.stringify(cleanData);
          localStorage.setItem(`${scope}__${key}`, json);
          localStorage.setItem(`${scope}_${key}`, json);
          localStorage.setItem(key, json);
        } catch (e) {
          console.warn('Error setting local key during sync:', e);
        }
      };

      // 2. Fetch Orders (Remote is 100% authoritative - never restore deleted items)
      const remoteOrders = await this.fetchOrders();
      setLocalKey('msp_orders_v2', remoteOrders);

      // 3. Fetch Customers
      const remoteCustomers = await this.fetchCustomers();
      setLocalKey('msp_customers_v1', remoteCustomers);

      // 4. Fetch Products
      const remoteProducts = await this.fetchProducts();
      setLocalKey('msp_products_v1', remoteProducts);

      // 5. Fetch Devices
      const remoteDevices = await this.fetchDevices();
      setLocalKey('msp_devices_v1', remoteDevices);

      // 6. Fetch Employees
      const remoteEmployees = await this.fetchEmployees();
      setLocalKey('msp_employees_v1', remoteEmployees);

      // 7. Fetch Suppliers
      const remoteSuppliers = await this.fetchSuppliers();
      setLocalKey('msp_suppliers_v1', remoteSuppliers);

      // 8. Fetch Receivables (Fiados)
      const remoteReceivables = await this.fetchReceivables();
      setLocalKey('msp_receivables_v1', remoteReceivables);

      // 9. Fetch Expenses
      const remoteExpenses = await this.fetchExpenses();
      setLocalKey('msp_expenses_v1', remoteExpenses);

      console.log('✅ [FirestoreSyncService] Sincronização 100% Nuvem Firebase concluída!');
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      console.warn('❌ [FirestoreSyncService] Erro ao baixar dados da nuvem:', err);
      return false;
    }
  },

  /**
   * Uploads local data for active tenant to Firestore using safe batched writes
   */
  async syncAllToFirestore(localData: {
    orders?: ServiceOrder[];
    customers?: Customer[];
    products?: Product[];
    devices?: Device[];
    receivables?: AccountReceivable[];
    expenses?: Expense[];
    settings?: CompanySettings;
    customOsConfigs?: any;
  }): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return;

      if (localData.settings) {
        await this.saveCompanySettings(localData.settings);
      }

      if (localData.customOsConfigs) {
        await this.saveCustomOsConfigs(localData.customOsConfigs);
      }

      // Safe batch helper (max 100 items per batch to stay far below the 500-op limit and avoid bandwidth bursts)
      const commitItemsInBatches = async <T extends { id?: string }>(
        subcollection: string,
        items: T[],
        filter?: (item: T) => boolean
      ) => {
        if (!items || items.length === 0) return;
        const validItems = items.filter((item) => item && item.id && (!filter || filter(item)));
        const CHUNK_SIZE = 50;

        for (let i = 0; i < validItems.length; i += CHUNK_SIZE) {
          const chunk = validItems.slice(i, i + CHUNK_SIZE);
          try {
            const batch = writeBatch(db);
            for (const item of chunk) {
              const docRef = doc(db, 'accounts', tenantId, subcollection, item.id!);
              batch.set(docRef, item, { merge: true });
            }
            await batch.commit();
            // Small pause between batches to respect Firestore bandwidth
            await new Promise((resolve) => setTimeout(resolve, 80));
          } catch (batchErr: any) {
            console.warn(`[FirestoreSyncService] Batch commit error on ${subcollection}:`, batchErr?.message || batchErr);
            // If rate-limited, wait 1 second before attempting remaining chunks
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      };

      if (localData.orders && localData.orders.length > 0) {
        await commitItemsInBatches('orders', localData.orders, (o) => !DEMO_ORDER_IDS.has(o.id));
      }

      if (localData.customers && localData.customers.length > 0) {
        await commitItemsInBatches('customers', localData.customers);
      }

      if (localData.products && localData.products.length > 0) {
        await commitItemsInBatches('products', localData.products);
      }

      if (localData.devices && localData.devices.length > 0) {
        await commitItemsInBatches('devices', localData.devices);
      }

      if (localData.receivables && localData.receivables.length > 0) {
        await commitItemsInBatches('receivables', localData.receivables);
      }

      if (localData.expenses && localData.expenses.length > 0) {
        await commitItemsInBatches('expenses', localData.expenses);
      }

      console.log('✅ [FirestoreSyncService] Envio controlado de dados para a nuvem concluído!');
    } catch (err: any) {
      console.warn('❌ [FirestoreSyncService] Erro ao enviar dados para a nuvem:', err?.message || err);
    }
  },

  /**
   * Listens to changes on Orders in real time so other computers update automatically
   */
  startRealTimeOrdersListener(onOrdersUpdated?: () => void): () => void {
    if (ordersUnsubscribe) {
      ordersUnsubscribe();
      ordersUnsubscribe = null;
    }

    try {
      if (!db) return () => {};
      const tenantId = getTenantId();
      if (!tenantId || tenantId === 'default_tenant') return () => {};

      const scope = getTenantStorageScope();
      const colRef = collection(db, 'accounts', tenantId, 'orders');
      ordersUnsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const remoteOrders: ServiceOrder[] = [];
          snapshot.forEach((d) => {
            const o = d.data() as ServiceOrder;
            if (o && o.id && !DEMO_ORDER_IDS.has(o.id)) remoteOrders.push(o);
          });

          const jsonStr = JSON.stringify(remoteOrders);
          localStorage.setItem(`${scope}__msp_orders_v2`, jsonStr);
          localStorage.setItem(`${scope}_msp_orders_v2`, jsonStr);
          localStorage.setItem('msp_orders_v2', jsonStr);
          if (onOrdersUpdated) onOrdersUpdated();
        },
        (err) => {
          console.warn('RealTime Orders listener error:', err);
        }
      );

      return () => {
        if (ordersUnsubscribe) {
          ordersUnsubscribe();
          ordersUnsubscribe = null;
        }
      };
    } catch (err) {
      console.warn('Error starting RealTime Orders Listener:', err);
      return () => {};
    }
  },

  /**
   * Subscribes to real-time updates for all collections via MegaCloudEngine
   */
  startAllRealTimeListeners(onUpdated?: () => void): () => void {
    try {
      return CloudEngine.start(onUpdated);
    } catch (err) {
      console.warn('Error starting MegaCloudEngine listeners:', err);
      return () => {};
    }
  },
};


