import { StorageService } from './storage';

export interface SystemVersionInfo {
  success: boolean;
  buildId: string;
  version: string;
  serverStartedAt: string;
  timestamp: number;
}

type UpdateListener = (updateAvailable: boolean, versionInfo?: SystemVersionInfo) => void;

class UpdateChecker {
  private initialBuildId: string | null = null;
  private initialServerStart: string | null = null;
  private isUpdateAvailable = false;
  private listeners: Set<UpdateListener> = new Set();
  private pollIntervalId: any = null;
  private hasCheckedOnce = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Check initially
    this.checkForUpdates();

    // Poll every 35 seconds
    this.pollIntervalId = setInterval(() => {
      this.checkForUpdates();
    }, 35000);

    // Also check when tab recovers focus / becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });

    window.addEventListener('focus', () => {
      this.checkForUpdates();
    });
  }

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    if (this.isUpdateAvailable) {
      listener(true);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async checkForUpdates(): Promise<boolean> {
    try {
      const res = await fetch(`/api/system/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) return false;

      const data: SystemVersionInfo = await res.json();
      if (!data || !data.buildId) return false;

      // On first successful check, record initial server build state
      if (!this.hasCheckedOnce) {
        this.initialBuildId = data.buildId;
        this.initialServerStart = data.serverStartedAt;
        this.hasCheckedOnce = true;
        try {
          sessionStorage.setItem('msp_initial_build_id', data.buildId);
          sessionStorage.setItem('msp_initial_server_start', data.serverStartedAt);
        } catch (_) {}
        return false;
      }

      // Read from session storage if available
      const storedBuildId = this.initialBuildId || sessionStorage.getItem('msp_initial_build_id');
      const storedServerStart = this.initialServerStart || sessionStorage.getItem('msp_initial_server_start');

      // Check if build changed or server was restarted with a new deployment
      const isNewBuild = storedBuildId && data.buildId !== storedBuildId;
      const isNewServerStart = storedServerStart && data.serverStartedAt !== storedServerStart;

      if (isNewBuild || isNewServerStart) {
        if (!this.isUpdateAvailable) {
          console.warn('🚀 [UpdateChecker] Nova atualização do sistema detectada no servidor!');
          this.isUpdateAvailable = true;
          this.notifyListeners(true, data);
        }
        return true;
      }

      return false;
    } catch (err) {
      // Offline or network error - ignore quietly
      return false;
    }
  }

  private notifyListeners(updateAvailable: boolean, data?: SystemVersionInfo) {
    this.listeners.forEach((fn) => {
      try {
        fn(updateAvailable, data);
      } catch (e) {
        console.error('Error in UpdateChecker listener:', e);
      }
    });
  }

  public getUpdateAvailable(): boolean {
    return this.isUpdateAvailable;
  }

  /**
   * Applies the update: clears session, clears active browser session flag,
   * signs out and reloads page to force re-login on the updated version.
   */
  public applyUpdateAndRelogin(signOutAuthFn?: () => Promise<void>) {
    try {
      StorageService.clearAuthSession();
      sessionStorage.removeItem('msp_browser_session_active');
      sessionStorage.removeItem('msp_auth_session_v1');
      sessionStorage.removeItem('msp_current_session_id');
      sessionStorage.removeItem('msp_initial_build_id');
      sessionStorage.removeItem('msp_initial_server_start');
    } catch (_) {}

    if (signOutAuthFn) {
      signOutAuthFn().catch(() => {}).finally(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
}

export const updateCheckerService = new UpdateChecker();
