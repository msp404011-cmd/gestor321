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
   * Save employee / operator to Firestore /accounts/{tenantId}/employees/{id}
   */
  async saveEmployee(employee: Employee): Promise<void> {
    try {
      if (!db || !employee.id) return;
      const tenantId = getTenantId();
      const docRef = doc(db, 'accounts', tenantId, 'employees', employee.id);
      await setDoc(docRef, employee, { merge: true });
    } catch (err) {
      console.warn('Firestore saveEmployee error:', err);
    }
  },

  /**
   * Save company settings to Firestore /accounts/{tenantId}/settings/company
   */
  async saveCompanySettings(settings: CompanySettings): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      const docRef = doc(db, 'accounts', tenantId, 'settings', 'company');
      await setDoc(docRef, settings, { merge: true });
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
   * Save subscription plan to Firestore /accounts/{tenantId}/settings/subscription
   */
  async saveSubscriptionPlan(plan: SubscriptionPlanInfo): Promise<void> {
    try {
      if (!db) return;
      const tenantId = getTenantId();
      const docRef = doc(db, 'accounts', tenantId, 'settings', 'subscription');
      await setDoc(docRef, plan, { merge: true });
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

