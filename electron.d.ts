
import type { UpdateInfo } from 'velopack';

export interface IVelopackAPI {
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateInfo | null>;
  downloadUpdates: (updateInfo: UpdateInfo) => Promise<void>;
  applyUpdates: (updateInfo: UpdateInfo) => Promise<void>;
  clearAppData: () => void; // Kept for app reset functionality
}

// What the main process needs to run the tray and the reminder while no page is loaded
export interface BackgroundConfig {
  openAtLogin: boolean;
  tray: boolean;
  reminder: { on: boolean; time: string }; // "HH:MM"
  plan: (string | null)[]; // routine name per weekday (getDay index), null = rest
  override: { date: string; name: string } | null; // "just today" routine pick
  skip: string[]; // YYYY-MM-DD: rest and time-off days, and today once trained
}

declare global {
  interface Window {
    velopackApi: IVelopackAPI;
    // Only present inside Electron
    resonaWindow?: {
      setTheme: (source: 'system' | 'light' | 'dark') => void;
      setZoom: (factor: number) => void;
      setBackground: (config: BackgroundConfig) => void;
      setBusy: (busy: boolean) => void;
      closeNow: () => void;
      onCloseRequested: (cb: () => void) => () => void;
      onGo: (cb: (to: { section: 'today' }) => void) => () => void;
    };
    resonaFiles?: { chooseExportFolder: () => Promise<string | null>; writeExport: (name: string, data: ArrayBuffer) => Promise<void> };
  }
}
