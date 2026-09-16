import { doc, setDoc, getDocs, getDoc, collection, onSnapshot, deleteDoc, Unsubscribe } from 'firebase/firestore';
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

const DEMO_ORDER_IDS = new Set([
  'os-1001', 'os-1002', 'os-1003', 'os-1004', 'os-1005', 'os-1006', 'os-1007',
  'os-1008', 'os-1009', 'os-1010', 'os-1011', 'os-1012', 'os-1013', 'os-1014',
  'os-1015', 'os-1016', 'os-1017', 'os-1018', 'os-1019', 'os-1020'
]);

export function getTenantId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawSession1 = localStorage.getItem('msp_auth_session_v1');
      if (rawSession1) {
        const session = JSON.parse(rawSession1);
        if (session && session.email && session.email.includes('@')) {
          const clean = session.email.trim().toLowerCase();
          if (clean === 'msp404011@gmail.com' || clean === 'mmspmartins62@gmail.com') {
            return 'mmspmartins62@gmail.com';
          }
          return clean;
        }
      }
      const rawSession2 = localStorage.getItem('msp_auth_session');
      if (rawSession2) {
        const session = JSON.parse(rawSession2);
        if (session && session.email && session.email.includes('@')) {
          const clean = session.email.trim().toLowerCase();
          if (clean === 'msp404011@gmail.com' || clean === 'mmspmartins62@gmail.com') {
            return 'mmspmartins62@gmail.com';
          }
          return clean;
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
                const clean = u.email.trim().toLowerCase();
                if (clean === 'msp404011@gmail.com' || clean === 'mmspmartins62@gmail.com') {
                  return 'mmspmartins62@gmail.com';
                }
                return clean;
              }
            }
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'mmspmartins62@gmail.com';
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
   * (Disabled) Prevent creating 'employees' folder in Firebase. Operates locally only.
   */
  async saveEmployee(employee: Employee): Promise<void> {
    try {
      return;
    } catch (err) {
      console.warn('Firestore saveEmployee error:', err);
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

      // 2. Fetch Orders
      const remoteOrders = await this.fetchOrders();
      if (remoteOrders.length > 0) {
        const localOrders = getLocalKey<ServiceOrder>('msp_orders_v2');
        const mergedOrders = mergeCollections(localOrders, remoteOrders);
        setLocalKey('msp_orders_v2', mergedOrders);
      }

      // 3. Fetch Customers
      const remoteCustomers = await this.fetchCustomers();
      if (remoteCustomers.length > 0) {
        const localCustomers = getLocalKey<Customer>('msp_customers_v1');
        const mergedCustomers = mergeCollections(localCustomers, remoteCustomers);
        setLocalKey('msp_customers_v1', mergedCustomers);
      }

      // 4. Fetch Products
      const remoteProducts = await this.fetchProducts();
      if (remoteProducts.length > 0) {
        const localProducts = getLocalKey<Product>('msp_products_v1');
        const mergedProducts = mergeCollections(localProducts, remoteProducts);
        setLocalKey('msp_products_v1', mergedProducts);
      }

      // 5. Fetch Devices
      const remoteDevices = await this.fetchDevices();
      if (remoteDevices.length > 0) {
        const localDevices = getLocalKey<Device>('msp_devices_v1');
        const mergedDevices = mergeCollections(localDevices, remoteDevices);
        setLocalKey('msp_devices_v1', mergedDevices);
      }

      console.log('✅ [FirestoreSyncService] Sincronização da Nuvem concluída com sucesso!');
      if (onSuccess) onSuccess();
      return true;
    } catch (err) {
      console.warn('❌ [FirestoreSyncService] Erro ao baixar dados da nuvem:', err);
      return false;
    }
  },

  /**
   * Uploads all local data for active tenant to Firestore
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

      if (localData.orders && localData.orders.length > 0) {
        for (const order of localData.orders) {
          await this.saveOrder(order);
        }
      }

      if (localData.customers && localData.customers.length > 0) {
        for (const customer of localData.customers) {
          await this.saveCustomer(customer);
        }
      }

      if (localData.products && localData.products.length > 0) {
        for (const product of localData.products) {
          await this.saveProduct(product);
        }
      }

      if (localData.devices && localData.devices.length > 0) {
        for (const device of localData.devices) {
          await this.saveDevice(device);
        }
      }

      if (localData.receivables && localData.receivables.length > 0) {
        for (const receivable of localData.receivables) {
          await this.saveReceivable(receivable);
        }
      }

      if (localData.expenses && localData.expenses.length > 0) {
        for (const expense of localData.expenses) {
          await this.saveExpense(expense);
        }
      }

      console.log('✅ [FirestoreSyncService] Envio completo de dados para a nuvem concluído!');
    } catch (err) {
      console.warn('❌ [FirestoreSyncService] Erro ao enviar dados para a nuvem:', err);
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

      const colRef = collection(db, 'accounts', tenantId, 'orders');
      ordersUnsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) return;
          const scope = getTenantStorageScope();
          const remoteOrders: ServiceOrder[] = [];
          snapshot.forEach((d) => {
            const o = d.data() as ServiceOrder;
            if (o && o.id && !DEMO_ORDER_IDS.has(o.id)) remoteOrders.push(o);
          });

          if (remoteOrders.length > 0) {
            let localOrders: ServiceOrder[] = [];
            try {
              const keysToTry = [`${scope}__msp_orders_v2`, `${scope}_msp_orders_v2`, 'msp_orders_v2'];
              const mapLoc = new Map<string, ServiceOrder>();
              for (const k of keysToTry) {
                const raw = localStorage.getItem(k);
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) {
                    parsed.forEach((item) => {
                      if (item && item.id && !DEMO_ORDER_IDS.has(item.id)) {
                        mapLoc.set(item.id, item);
                      }
                    });
                  }
                }
              }
              localOrders = Array.from(mapLoc.values());
            } catch {}

            const map = new Map<string, ServiceOrder>();
            localOrders.forEach((o) => {
              if (o && o.id && !DEMO_ORDER_IDS.has(o.id)) map.set(o.id, o);
            });
            remoteOrders.forEach((o) => {
              if (o && o.id && !DEMO_ORDER_IDS.has(o.id)) map.set(o.id, o);
            });
            const merged = Array.from(map.values());

            const jsonStr = JSON.stringify(merged);
            localStorage.setItem(`${scope}__msp_orders_v2`, jsonStr);
            localStorage.setItem(`${scope}_msp_orders_v2`, jsonStr);
            localStorage.setItem('msp_orders_v2', jsonStr);
            if (onOrdersUpdated) onOrdersUpdated();
          }
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
};


