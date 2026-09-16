import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getTenantId } from './firestoreService';
import { STORAGE_KEYS } from './storage';

export interface CloudEngineStatus {
  isConnected: boolean;
  status: 'ONLINE_NUVEM' | 'SINCRONIZANDO' | 'ERRO_CONEXAO';
  tenantId: string;
  activeListenersCount: number;
  lastSyncTime: string;
  writesCount: number;
  collections: {
    orders: number;
    customers: number;
    products: number;
    devices: number;
    sales: number;
    expenses: number;
    receivables: number;
    employees: number;
    suppliers: number;
    supplier_orders: number;
    supplier_purchases: number;
    settings: number;
  };
}

type EngineListener = (status: CloudEngineStatus) => void;

class MegaCloudEngine {
  private activeUnsubs: Unsubscribe[] = [];
  private listeners: Set<EngineListener> = new Set();
  private isStarted = false;
  private status: CloudEngineStatus = {
    isConnected: true,
    status: 'ONLINE_NUVEM',
    tenantId: getTenantId(),
    activeListenersCount: 0,
    lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
    writesCount: 0,
    collections: {
      orders: 0,
      customers: 0,
      products: 0,
      devices: 0,
      sales: 0,
      expenses: 0,
      receivables: 0,
      employees: 0,
      suppliers: 0,
      supplier_orders: 0,
      supplier_purchases: 0,
      settings: 1,
    },
  };

  public getStatus(): CloudEngineStatus {
    return { ...this.status, tenantId: getTenantId() };
  }

  public subscribeStatus(listener: EngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.status.tenantId = getTenantId();
    this.status.lastSyncTime = new Date().toLocaleTimeString('pt-BR');
    const cur = this.getStatus();
    this.listeners.forEach((l) => {
      try {
        l(cur);
      } catch (e) {
        console.warn('Error in CloudEngine listener:', e);
      }
    });
  }

  /**
   * Initializes real-time listeners for all 12+ cloud collections in Firebase Firestore.
   */
  public start(onDataUpdated?: () => void): () => void {
    if (this.isStarted) {
      this.stop();
    }
    this.isStarted = true;

    if (!db) {
      console.warn('⚠️ [MegaCloudEngine] Firestore não inicializado.');
      this.status.isConnected = false;
      this.status.status = 'ERRO_CONEXAO';
      this.notify();
      return () => {};
    }

    const tenantId = getTenantId();
    this.status.tenantId = tenantId;
    this.status.isConnected = true;
    this.status.status = 'SINCRONIZANDO';
    this.notify();

    console.log(`🚀 [MegaCloudEngine] Iniciando Motor em Tempo Real Direto na Nuvem para Tenant: ${tenantId}`);

    const syncCollection = (
      colName: string,
      storageKey: string,
      statusKey: keyof CloudEngineStatus['collections'],
      filterFn?: (item: any) => boolean
    ) => {
      try {
        const colRef = collection(db, 'accounts', tenantId, colName);
        const unsub = onSnapshot(
          colRef,
          (snap) => {
            const list: any[] = [];
            snap.forEach((d) => {
              const data = d.data();
              if (data) {
                if (!filterFn || filterFn(data)) {
                  list.push(data);
                }
              }
            });

            // Atualiza status e memória
            this.status.collections[statusKey] = list.length;
            this.status.isConnected = true;
            this.status.status = 'ONLINE_NUVEM';

            // Armazena na memória do StorageService de forma transparente para reatividade instantânea
            try {
              const scope = `tenant_${tenantId.replace(/[^a-z0-9_]/g, '_')}`;
              const json = JSON.stringify(list);
              localStorage.setItem(`${scope}__${storageKey}`, json);
              localStorage.setItem(`${scope}_${storageKey}`, json);
              localStorage.setItem(storageKey, json);
            } catch (_) {}

            this.notify();
            if (onDataUpdated) onDataUpdated();
          },
          (err) => {
            console.warn(`⚠️ [MegaCloudEngine] Erro de escuta em ${colName}:`, err.message);
          }
        );
        this.activeUnsubs.push(unsub);
      } catch (err) {
        console.warn(`[MegaCloudEngine] Falha ao registrar ${colName}:`, err);
      }
    };

    // 1. Ordens de Serviço
    syncCollection('orders', STORAGE_KEYS.ORDERS, 'orders', (o) => !o.id?.startsWith('os-10'));
    // 2. Clientes
    syncCollection('customers', STORAGE_KEYS.CUSTOMERS, 'customers');
    // 3. Produtos / Peças Estoque
    syncCollection('products', STORAGE_KEYS.PRODUCTS, 'products');
    // 4. Aparelhos
    syncCollection('devices', STORAGE_KEYS.DEVICES, 'devices');
    // 5. Vendas
    syncCollection('sales', STORAGE_KEYS.SALES, 'sales');
    // 6. Despesas
    syncCollection('expenses', STORAGE_KEYS.EXPENSES, 'expenses');
    // 7. Recebíveis
    syncCollection('receivables', STORAGE_KEYS.RECEIVABLES, 'receivables');
    // 8. Funcionários
    syncCollection('employees', STORAGE_KEYS.EMPLOYEES, 'employees');
    // 9. Fornecedores
    syncCollection('suppliers', STORAGE_KEYS.SUPPLIERS, 'suppliers');
    // 10. Grupos de Pedidos Fornecedores
    syncCollection('supplier_orders', 'msp_supplier_order_groups_v1', 'supplier_orders');
    // 11. Peças Compradas / Débitos Fornecedores
    syncCollection('supplier_purchases', 'msp_supplier_purchases_v1', 'supplier_purchases');

    // 12. Configurações Globais da Conta no Firestore
    try {
      const accountDocRef = doc(db, 'accounts', tenantId);
      const unsubAccount = onSnapshot(accountDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const scope = `tenant_${tenantId.replace(/[^a-z0-9_]/g, '_')}`;
          if (data.companySettings) {
            try {
              localStorage.setItem(`${scope}_msp_settings_v1`, JSON.stringify(data.companySettings));
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.companySettings));
            } catch (_) {}
          }
          if (data.customOsConfigs) {
            const cfg = data.customOsConfigs;
            try {
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
            } catch (_) {}
          }
          this.notify();
          if (onDataUpdated) onDataUpdated();
        }
      });
      this.activeUnsubs.push(unsubAccount);
    } catch (e) {
      console.warn('[MegaCloudEngine] Erro no listener da conta:', e);
    }

    // 13. Configurações de Campos de Pedidos de Peças (Botões, Categorias, Opções)
    try {
      const fieldsDocRef = doc(db, 'accounts', tenantId, 'settings', 'supplierOrderFields');
      const unsubFields = onSnapshot(fieldsDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          try {
            localStorage.setItem('msp_supplier_field_settings_v4', JSON.stringify(data));
          } catch (_) {}
          this.notify();
          if (onDataUpdated) onDataUpdated();
        }
      });
      this.activeUnsubs.push(unsubFields);
    } catch (e) {
      console.warn('[MegaCloudEngine] Erro no listener de supplierOrderFields:', e);
    }

    this.status.activeListenersCount = this.activeUnsubs.length;
    this.status.status = 'ONLINE_NUVEM';
    this.notify();

    return () => this.stop();
  }

  public stop() {
    this.activeUnsubs.forEach((unsub) => {
      try {
        unsub();
      } catch (_) {}
    });
    this.activeUnsubs = [];
    this.status.activeListenersCount = 0;
    this.isStarted = false;
    this.notify();
  }

  /**
   * Salva qualquer entidade diretamente no Firestore na Nuvem de forma instantânea.
   */
  public async directCloudWrite(
    subcollection: string,
    docId: string,
    data: any
  ): Promise<boolean> {
    if (!db || !docId) return false;
    const tenantId = getTenantId();
    try {
      const docRef = doc(db, 'accounts', tenantId, subcollection, docId);
      await setDoc(docRef, data, { merge: true });
      this.status.writesCount++;
      this.notify();
      return true;
    } catch (err) {
      console.error(`❌ [MegaCloudEngine] Erro ao salvar na nuvem (${subcollection}/${docId}):`, err);
      return false;
    }
  }

  /**
   * Remove qualquer entidade diretamente no Firestore na Nuvem de forma definitiva.
   */
  public async directCloudDelete(
    subcollection: string,
    docId: string
  ): Promise<boolean> {
    if (!db || !docId) return false;
    const tenantId = getTenantId();
    try {
      const docRef = doc(db, 'accounts', tenantId, subcollection, docId);
      await deleteDoc(docRef);
      this.status.writesCount++;
      this.notify();
      return true;
    } catch (err) {
      console.error(`❌ [MegaCloudEngine] Erro ao excluir na nuvem (${subcollection}/${docId}):`, err);
      return false;
    }
  }

  /**
   * Salva configurações no Firestore
   */
  public async directCloudSettingsWrite(
    settingKey: string,
    data: any
  ): Promise<boolean> {
    if (!db) return false;
    const tenantId = getTenantId();
    try {
      const docRef = doc(db, 'accounts', tenantId, 'settings', settingKey);
      await setDoc(docRef, data, { merge: true });
      this.status.writesCount++;
      this.notify();
      return true;
    } catch (err) {
      console.error(`❌ [MegaCloudEngine] Erro ao salvar configuração na nuvem:`, err);
      return false;
    }
  }
}

export const CloudEngine = new MegaCloudEngine();
