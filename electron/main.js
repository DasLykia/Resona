import { VelopackApp, UpdateManager } from 'velopack';
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme } from "electron";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Store from "electron-store";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- VELOPACK SETUP ---
VelopackApp.build().run();

// Production URL (Specific to 1.0.2)
const updateUrl = 'https://github.com/DasLykia/Resona/releases/latest/download';

// Initialize the store
const store = new Store();

// Keep a global reference of the window object to send messages
let win;

const TITLEBAR_HEIGHT = 36;
const overlayFor = (dark) => ({
  color: "#00000000",
  symbolColor: dark ? "#f2f2f2" : "#1c1c1c",
  height: TITLEBAR_HEIGHT,
});

function createWindow() {
  const defaultBounds = { width: 1200, height: 800 };
  const bounds = store.get("windowBounds", defaultBounds);

  win = new BrowserWindow({
    ...bounds,
    minWidth: 880,
    minHeight: 600,
    // Mica behind a transparent page; the app draws its own title bar, Windows keeps the caption buttons
    backgroundColor: "#00000000",
    backgroundMaterial: "mica",
    titleBarStyle: "hidden",
    titleBarOverlay: overlayFor(nativeTheme.shouldUseDarkColors),
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"), 
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false 
    },
    autoHideMenuBar: true,
  });

  Menu.setApplicationMenu(null);

  const saveState = () => {
    if (!win.isDestroyed()) {
      store.set("windowBounds", win.getBounds());
    }
  };

  win.on("resize", saveState);
  win.on("move", saveState);
  win.on("close", saveState);
  
  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    const indexHtml = path.join(__dirname, "../dist/index.html");
    win.loadFile(indexHtml);
  }
}

// --- Velopack IPC Handlers ---
ipcMain.handle("velopack:get-version", () => {
    try {
        const um = new UpdateManager(updateUrl);
        const version = um.getCurrentVersion();
        return version || "Dev-Mode"; 
    } catch (e) {
        return `Not Installed`;
    }
});

ipcMain.handle("velopack:check-for-update", async () => {
    // No debug logs, just return the result
    const um = new UpdateManager(updateUrl);
    return await um.checkForUpdatesAsync();
});

ipcMain.handle("velopack:download-update", async (event, updateInfo) => {
    const um = new UpdateManager(updateUrl);
    await um.downloadUpdateAsync(updateInfo);
    return true;
});

ipcMain.handle("velopack:apply-update", async (event, updateInfo) => {
    const um = new UpdateManager(updateUrl);
    await um.waitExitThenApplyUpdate(updateInfo); 
    app.quit(); 
    return true;
});

// --- Window / Theme ---
// 'system' | 'light' | 'dark'. Drives Mica's tint and prefers-color-scheme in the page.
ipcMain.on("window:set-theme", (event, source) => {
  if (["system", "light", "dark"].includes(source)) nativeTheme.themeSource = source;
});

nativeTheme.on("updated", () => {
  if (win && !win.isDestroyed()) win.setTitleBarOverlay(overlayFor(nativeTheme.shouldUseDarkColors));
});

// --- Export recordings ---
// The renderer only sends a file name and bytes; files land in the folder the user picked here, never elsewhere
let exportDir = null;
ipcMain.handle("export:choose-folder", async () => {
  const r = await dialog.showOpenDialog(win, { title: "Export recordings to", properties: ["openDirectory", "createDirectory"] });
  exportDir = r.canceled ? null : r.filePaths[0];
  return exportDir;
});

ipcMain.handle("export:write", async (event, name, data) => {
  if (!exportDir) throw new Error("No export folder chosen");
  const safe = path.basename(String(name)).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 150) || "recording.wav";
  const { name: stem, ext } = path.parse(safe);
  let target = path.join(exportDir, safe);
  // Never overwrite: "name (2).wav", "name (3).wav", ...
  for (let i = 2; await fs.access(target).then(() => true, () => false); i++) target = path.join(exportDir, `${stem} (${i})${ext}`);
  await fs.writeFile(target, Buffer.from(data));
});

// --- Other IPC Handlers ---
ipcMain.on('clear-app-data', () => {
  store.clear();
});

// --- App Events ---
app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});