
import type { UpdateInfo } from 'velopack';

export interface IVelopackAPI {
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateInfo | null>;
  downloadUpdates: (updateInfo: UpdateInfo) => Promise<void>;
  applyUpdates: (updateInfo: UpdateInfo) => Promise<void>;
  clearAppData: () => void; // Kept for app reset functionality
}

declare global {
  interface Window {
    velopackApi: IVelopackAPI;
    // Only present inside Electron
    resonaWindow?: { setTheme: (source: 'system' | 'light' | 'dark') => void; setZoom: (factor: number) => void };
    resonaFiles?: { chooseExportFolder: () => Promise<string | null>; writeExport: (name: string, data: ArrayBuffer) => Promise<void> };
  }
}
