import { GoogleUserProfile } from '../types';
import { StorageService } from './storage';

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  mimeType?: string;
  modifiedTime?: string;
}

export interface SyncStatus {
  lastSync?: string;
  inProgress: boolean;
  error?: string;
  fileId?: string;
  accountEmail?: string;
  status: 'idle' | 'syncing' | 'synced' | 'error';
}

const BACKUP_FILENAME_PREFIX = 'msp_informatica_backup_';

export const GoogleDriveBackupService = {
  // Get the active access token for Google API
  getAccessToken(): string | null {
    return localStorage.getItem('msp_google_access_token');
  },

  setAccessToken(token: string | null) {
    if (token) {
      localStorage.setItem('msp_google_access_token', token);
    } else {
      localStorage.removeItem('msp_google_access_token');
    }
  },

  // Generate complete workspace snapshot for current logged user
  generateBackupPayload(userEmail: string) {
    return {
      version: '2.5.0',
      accountEmail: userEmail,
      createdAt: new Date().toISOString(),
      appName: 'MSP Informática',
      data: {
        customers: StorageService.getCustomers(),
        devices: StorageService.getDevices(),
        products: StorageService.getProducts(),
        orders: StorageService.getOrders(),
        sales: StorageService.getSales(),
        cashSession: StorageService.getCashSession(),
        cashMovements: StorageService.getCashMovements(),
        expenses: StorageService.getExpenses(),
        employees: StorageService.getEmployees(),
        purchases: StorageService.getPurchases(),
        stockMovements: StorageService.getStockMovements(),
        receivables: StorageService.getReceivables(),
        settings: StorageService.getSettings(),
        subscription: StorageService.getSubscriptionPlan(),
        customCategories: StorageService.getCustomCategories(),
        customBrands: StorageService.getCustomBrands(),
        customOsStatuses: StorageService.getCustomOsStatuses(),
        customDeviceTypes: StorageService.getCustomDeviceTypes(),
        customAccessories: StorageService.getCustomAccessories(),
        customPaymentMethods: StorageService.getCustomPaymentMethods(),
        suppliers: StorageService.getSuppliers(),
        resellers: StorageService.getResellers(),
        resellerTransactions: StorageService.getResellerTransactions(),
      },
    };
  },

  // Save full JSON backup directly to Google Drive of the logged-in client
  async uploadBackupToGoogleDrive(userEmail: string, token?: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
    const activeToken = token || this.getAccessToken();
    if (!activeToken) {
      return { success: false, error: 'Token de autorização do Google Drive não encontrado. Faça login novamente.' };
    }

    try {
      const cleanEmail = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${BACKUP_FILENAME_PREFIX}${cleanEmail}.json`;
      const payload = this.generateBackupPayload(userEmail);
      const jsonContent = JSON.stringify(payload, null, 2);

      // 1. Search if existing backup file for this user exists
      const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );

      let existingFileId: string | null = null;
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          existingFileId = searchData.files[0].id;
        }
      }

      // 2. Prepare multipart body for upload/update
      const metadata = {
        name: filename,
        mimeType: 'application/json',
        description: `Backup isolado e automático do sistema MSP Informática - Conta: ${userEmail}`,
      };

      if (existingFileId) {
        // Update existing file
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Content-Type': 'application/json',
            },
            body: jsonContent,
          }
        );

        if (!updateRes.ok) {
          throw new Error(`Erro ao atualizar arquivo no Google Drive: ${updateRes.statusText}`);
        }

        const updatedData = await updateRes.json();
        this.recordSyncEvent(userEmail, 'synced', updatedData.id);
        return { success: true, fileId: updatedData.id };
      } else {
        // Create new file
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([jsonContent], { type: 'application/json' }));

        const createRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeToken}`,
            },
            body: form,
          }
        );

        if (!createRes.ok) {
          throw new Error(`Erro ao criar arquivo no Google Drive: ${createRes.statusText}`);
        }

        const createdData = await createRes.json();
        this.recordSyncEvent(userEmail, 'synced', createdData.id);
        return { success: true, fileId: createdData.id };
      }
    } catch (err: any) {
      console.error('Falha no upload do Google Drive:', err);
      this.recordSyncEvent(userEmail, 'error', undefined, err?.message || 'Erro de comunicação');
      return { success: false, error: err?.message || 'Falha ao sincronizar com o Google Drive.' };
    }
  },

  // Restore data from Google Drive of the current logged-in client
  async restoreBackupFromGoogleDrive(userEmail: string, token?: string): Promise<{ success: boolean; error?: string; restoredItems?: number }> {
    const activeToken = token || this.getAccessToken();
    if (!activeToken) {
      return { success: false, error: 'Token do Google Drive não encontrado.' };
    }

    try {
      const cleanEmail = userEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${BACKUP_FILENAME_PREFIX}${cleanEmail}.json`;

      const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );

      if (!searchRes.ok) {
        throw new Error('Não foi possível consultar os arquivos no Google Drive.');
      }

      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        return { success: false, error: `Nenhum arquivo de backup anterior (${filename}) foi encontrado no seu Google Drive.` };
      }

      const fileId = searchData.files[0].id;
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (!downloadRes.ok) {
        throw new Error('Falha ao baixar os dados do backup do Google Drive.');
      }

      const backupData = await downloadRes.json();
      if (!backupData || !backupData.data) {
        throw new Error('Arquivo de backup inválido ou corrompido no Google Drive.');
      }

      // Restore data to current isolated workspace
      const data = backupData.data;
      let count = 0;
      if (Array.isArray(data.customers)) { StorageService.saveCustomers(data.customers); count += data.customers.length; }
      if (Array.isArray(data.devices)) { StorageService.saveDevices(data.devices); count += data.devices.length; }
      if (Array.isArray(data.products)) { StorageService.saveProducts(data.products); count += data.products.length; }
      if (Array.isArray(data.orders)) { StorageService.saveOrders(data.orders); count += data.orders.length; }
      if (Array.isArray(data.sales)) { StorageService.saveSales(data.sales); count += data.sales.length; }
      if (Array.isArray(data.expenses)) { StorageService.saveExpenses(data.expenses); count += data.expenses.length; }
      if (Array.isArray(data.employees)) { StorageService.saveEmployees(data.employees); count += data.employees.length; }
      if (Array.isArray(data.receivables)) { StorageService.saveReceivables(data.receivables); count += data.receivables.length; }
      if (data.settings) { StorageService.saveSettings(data.settings); }
      if (data.subscription) { StorageService.saveSubscriptionPlan(data.subscription); }

      StorageService.logAction(
        'Restauração de Backup do Google Drive',
        `Backup baixado e restaurado com sucesso do Google Drive de ${userEmail}.`
      );

      return { success: true, restoredItems: count };
    } catch (err: any) {
      console.error('Erro na restauração do Google Drive:', err);
      return { success: false, error: err?.message || 'Falha ao restaurar dados do Google Drive.' };
    }
  },

  // Record sync status in localStorage
  recordSyncEvent(accountEmail: string, status: 'synced' | 'error' | 'syncing', fileId?: string, error?: string) {
    const syncInfo: SyncStatus = {
      accountEmail,
      inProgress: status === 'syncing',
      lastSync: status === 'synced' ? new Date().toISOString() : undefined,
      fileId,
      status,
      error,
    };
    localStorage.setItem(`msp_drive_sync_${accountEmail.toLowerCase()}`, JSON.stringify(syncInfo));
  },

  getSyncStatus(accountEmail: string): SyncStatus {
    const raw = localStorage.getItem(`msp_drive_sync_${accountEmail.toLowerCase()}`);
    if (!raw) {
      return { status: 'idle', inProgress: false, accountEmail };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { status: 'idle', inProgress: false, accountEmail };
    }
  },
};
