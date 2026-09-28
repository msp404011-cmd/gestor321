/**
 * Update Detection Service
 * Periodically checks if a new version/build has been deployed to the server.
 * When detected, notifies the application to prompt the user to reload and log in again.
 */

export interface SystemVersionInfo {
  version: string;
  serverStartTime: number;
  buildId: string;
  timestamp: number;
}

type UpdateListener = (info: { currentVersion: string; newVersion: string; buildId: string }) => void;

class UpdateService {
  private initialServerStartTime: number | null = null;
  private initialBuildId: string | null = null;
  private currentVersion: string = '2.7.0';
  private hasUpdate: boolean = false;
  private listeners: Set<UpdateListener> = new Set();
  private checkIntervalId: any = null;
  private isChecking: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    // Fetch initial version
    try {
      const res = await fetch('/api/system/version', { cache: 'no-store' });
      if (res.ok) {
        const data: SystemVersionInfo = await res.json();
        this.initialServerStartTime = data.serverStartTime;
        this.initialBuildId = data.buildId;
        this.currentVersion = data.version;

        // Remember in sessionStorage so F5 in same session knows initial baseline
        const storedBoot = sessionStorage.getItem('msp_app_boot_time');
        if (!storedBoot) {
          sessionStorage.setItem('msp_app_boot_time', String(data.serverStartTime));
        } else if (Number(storedBoot) !== data.serverStartTime) {
          // If stored boot from previous tab load differs, notify update immediately
          this.triggerUpdate(data.version, data.buildId);
        }
      }
    } catch (e) {
      console.warn('[UpdateService] Initial version check error:', e);
    }

    // Start periodic polling every 35 seconds
    this.startPolling();

    // Check immediately on focus / tab visibility
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });
    window.addEventListener('focus', () => {
      this.checkForUpdates();
    });
  }

  public startPolling() {
    if (this.checkIntervalId) return;
    this.checkIntervalId = setInterval(() => {
      this.checkForUpdates();
    }, 35_000);
  }

  public stopPolling() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  public async checkForUpdates(): Promise<boolean> {
    if (this.isChecking || typeof window === 'undefined') return this.hasUpdate;
    this.isChecking = true;

    try {
      const res = await fetch(`/api/system/version?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data: SystemVersionInfo = await res.json();
        
        // If we didn't have an initial baseline yet, record it
        if (!this.initialServerStartTime) {
          this.initialServerStartTime = data.serverStartTime;
          this.initialBuildId = data.buildId;
          this.currentVersion = data.version;
          return false;
        }

        // Compare server boot time / build ID
        if (data.serverStartTime !== this.initialServerStartTime || (data.buildId && data.buildId !== this.initialBuildId)) {
          this.triggerUpdate(data.version, data.buildId);
          return true;
        }
      }
    } catch (_) {
      // Offline or network error - skip silently
    } finally {
      this.isChecking = false;
    }

    return this.hasUpdate;
  }

  private triggerUpdate(newVersion: string, buildId: string) {
    if (this.hasUpdate) return;
    this.hasUpdate = true;
    console.info(`[UpdateService] Nova atualização detectada no servidor! Versão: ${newVersion}, Build: ${buildId}`);
    for (const listener of this.listeners) {
      try {
        listener({
          currentVersion: this.currentVersion,
          newVersion,
          buildId,
        });
      } catch (err) {
        console.error('[UpdateService] Listener error:', err);
      }
    }
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    if (this.hasUpdate) {
      listener({
        currentVersion: this.currentVersion,
        newVersion: this.currentVersion,
        buildId: this.initialBuildId || '',
      });
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isUpdateAvailable(): boolean {
    return this.hasUpdate;
  }

  /**
   * Applies update: Clears session flag to require fresh login as requested by user,
   * then force reloads page without cache.
   */
  public applyUpdateAndRelogin(): void {
    try {
      sessionStorage.removeItem('msp_browser_session_active');
      sessionStorage.removeItem('msp_app_boot_time');
      sessionStorage.removeItem('msp_auth_session_v1');
      sessionStorage.removeItem('msp_auth_session');
      localStorage.removeItem('msp_auth_session_v1');
      localStorage.removeItem('msp_auth_session');
    } catch {}
    window.location.reload();
  }
}

export const updateService = new UpdateService();
