
import { collection, onSnapshot, Unsubscribe, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizeAccountData, CanonicalAccount } from './accountSchema';

type ListenerCallback = (data: CanonicalAccount[]) => void;

class RealTimeSyncService {
  private listener: Unsubscribe | null = null;
  private callbacks: ListenerCallback[] = [];
  private currentData: CanonicalAccount[] = [];

  constructor() {
    this.startEngine();
  }

  private startEngine() {
    if (this.listener) return;

    console.log('🚀 [RealTimeSyncService] Motor de sincronização em tempo real iniciado.');

    const colRef = collection(db, 'accounts');
    this.listener = onSnapshot(colRef, (snapshot) => {
      const newData: CanonicalAccount[] = [];
      const seen = new Set<string>();

      snapshot.docs.forEach((docSnap) => {
        const norm = normalizeAccountData(docSnap.id, docSnap.data());
        
        const key = norm.uid || norm.email || norm.id;
        if (key && seen.has(key)) return;
        if (key) seen.add(key);
        
        newData.push(norm);
      });

      this.currentData = newData;
      this.notifyListeners();
    }, (error) => {
      console.error('❌ [RealTimeSyncService] Erro na sincronização:', error);
    });
  }

  private notifyListeners() {
    this.callbacks.forEach(callback => callback(this.currentData));
  }

  public subscribe(callback: ListenerCallback) {
    this.callbacks.push(callback);
    callback(this.currentData); // Retorna o estado atual imediatamente
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  public stop() {
    if (this.listener) {
      this.listener();
      this.listener = null;
      console.log('🛑 [RealTimeSyncService] Motor de sincronização parado.');
    }
  }
}

export const realTimeSyncEngine = new RealTimeSyncService();
