export type View = 'dashboard' | 'teachers' | 'scanner' | 'profile' | 'qr-generator' | 'admin'
export type AuthState = 'login' | 'register' | 'authenticated'

// Importar tipo Teacher de la base de datos
export type { Teacher } from './database'

export interface AppState {
  activeView: View
  authState: AuthState
  currentTeacher: any | null
  showGroupSelector: boolean
  showQRLanding: boolean
  dbInitialized: boolean
  initError: string | null
  isFirstInstall: boolean
  showDevReset: boolean
  resetInProgress: boolean
}

export const INITIAL_APP_STATE: AppState = {
  activeView: 'dashboard',
  authState: 'login',
  currentTeacher: null,
  showGroupSelector: false,
  showQRLanding: false,
  dbInitialized: false,
  initError: null,
  isFirstInstall: false,
  showDevReset: false,
  resetInProgress: false
}

export const isDevelopment = () => 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

// Event system para comunicación entre componentes
class EventBus {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();