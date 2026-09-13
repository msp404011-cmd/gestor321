import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import firebaseConfig, { db } from '../lib/firebase';
import { UserAccount, Employee, CompanySettings, AccountReceivable, Expense, ServiceOrder, SubscriptionPlanInfo } from '../types';

export function getTenantId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const rawSession = localStorage.getItem('msp_auth_session_v1');
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session && session.email) {
          const clean = session.email.trim().toLowerCase();
          if (clean) return clean;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'default_tenant';
}

export const FirestoreSyncService = {
  /**
   * Save user account to Firestore /accounts/{id} (global account record)
   */
  async saveUserAccount(account: UserAccount): Promise<void> {
    try {
      if (!db || !account.id) return;
      const docRef = doc(db, 'accounts', account.id);
      await setDoc(docRef, account, { merge: true });
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
      const docRef = doc(db, 'accounts', data.email);
      await setDoc(docRef, data, { merge: true });
    } catch (err) {
      console.warn('Firestore saveFullTenantProfile error:', err);
    }
  },

  /**
   * (Disabled) Prevent creating 'employees' folder in Firebase. Operates locally only.
   */
  async saveEmployee(employee: Employee): Promise<void> {
    try {
      // Disabled to strictly comply with flat data structure
      return;
    } catch (err) {
      console.warn('Firestore saveEmployee error:', err);
    }
  },

  /**
   * (Disabled) Prevent creating 'settings' folder in Firebase. Operates locally only.
   */
  async saveCompanySettings(settings: CompanySettings): Promise<void> {
    try {
      // Disabled to strictly comply with flat data structure
      return;
    } catch (err) {
      console.warn('Firestore saveCompanySettings error:', err);
    }
  },

  /**
   * Save service order to Firestore /accounts/{tenantId}/orders/{id}
   */
  async saveOrder(order: ServiceOrder): Promise<void> {
    try {
      if (!db || !order.id) return;
      const tenantId = getTenantId();
      const docRef = doc(db, 'accounts', tenantId, 'orders', order.id);
      await setDoc(docRef, order, { merge: true });
    } catch (err) {
      console.warn('Firestore saveOrder error:', err);
    }
  },

  /**
   * Save accounts receivable to Firestore /accounts/{tenantId}/receivables/{id}
   */
  async saveReceivable(receivable: AccountReceivable): Promise<void> {
    try {
      if (!db || !receivable.id) return;
      const tenantId = getTenantId();
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
      const docRef = doc(db, 'accounts', tenantId);
      
      const flatPlanData = {
        plan: plan.planName,
        planName: plan.planName,
        plano: plan.planName,
        planoNome: plan.planName,
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
   * Load all user accounts from Firestore
   */
  async fetchUserAccounts(): Promise<UserAccount[]> {
    try {
      if (!db) return [];
      const querySnapshot = await getDocs(collection(db, 'accounts'));
      const accounts: UserAccount[] = [];
      querySnapshot.forEach((d) => {
        const data = d.data();
        if (data && data.email && data.shopName) {
          accounts.push(data as UserAccount);
        }
      });
      return accounts;
    } catch (err) {
      console.warn('Firestore fetchUserAccounts error:', err);
      return [];
    }
  },
};

