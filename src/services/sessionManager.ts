/**
 * Session Manager Service
 * Manages unique tab session IDs, heartbeats, and enforces simultaneous login limits.
 */

import { StorageService } from './storage';

export interface ActiveSession {
  sessionId: string;
  email: string;
  role?: string;
  ip?: string;
  device?: string;
  userAgent?: string;
  lastPing: number;
  createdAt: number;
  isCurrent?: boolean;
}

type SessionTerminatedListener = (reason: string, message: string) => void;

class SessionManager {
  private sessionId: string;
  private heartbeatInterval: any = null;
  private listeners: Set<SessionTerminatedListener> = new Set();
  private isTerminated: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'sess_server';
    let id = sessionStorage.getItem('msp_session_id');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('msp_session_id', id);
    }
    return id;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  private getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'Dispositivo';
    const ua = navigator.userAgent;
    let os = 'Dispositivo';
    if (ua.includes('Win')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    let browser = 'Navegador';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    return `${os} • ${browser}`;
  }

  public startHeartbeat(email: string, role?: string): void {
    if (!email || this.heartbeatInterval) return;

    // Send immediate ping
    this.sendPing(email, role);

    // Ping every 20 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendPing(email, role);
    }, 20_000);
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public async sendPing(email: string, role?: string): Promise<boolean> {
    if (this.isTerminated || !email || typeof window === 'undefined') return false;

    const company = StorageService.getCompanySettings();
    const isSuperAdmin = role === 'SUPER_ADMIN' || 
      email.includes('mmspmartins62') || 
      email.includes('msp404011');

    const maxLogins = isSuperAdmin
      ? (company.superAdminMaxSimultaneousLogins || 5)
      : (company.maxSimultaneousLogins || 2);

    try {
      const res = await fetch('/api/sessions/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          email,
          role: role || 'user',
          device: this.getDeviceInfo(),
          userAgent: navigator.userAgent,
          maxLogins,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.terminated) {
          this.handleTerminated(data.reason, data.message);
          return false;
        }
        return true;
      }
    } catch (_) {
      // Offline fallback
    }

    return true;
  }

  private handleTerminated(reason: string, message: string) {
    if (this.isTerminated) return;
    this.isTerminated = true;
    this.stopHeartbeat();

    for (const listener of this.listeners) {
      try {
        listener(reason, message);
      } catch (e) {
        console.error('[SessionManager] Listener error:', e);
      }
    }
  }

  public onTerminated(listener: SessionTerminatedListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async fetchActiveSessions(email?: string): Promise<ActiveSession[]> {
    try {
      const url = email ? `/api/sessions/active?email=${encodeURIComponent(email)}` : '/api/sessions/active';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) {
          return data.sessions.map((s: any) => ({
            ...s,
            isCurrent: s.sessionId === this.sessionId,
          }));
        }
      }
    } catch (e) {
      console.warn('Error fetching active sessions:', e);
    }
    return [];
  }

  public async disconnectOtherSessions(email: string): Promise<boolean> {
    try {
      const res = await fetch('/api/sessions/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          email,
          allOthers: true,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async disconnectSession(sessionId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/sessions/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const sessionManager = new SessionManager();
