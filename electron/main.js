import { VelopackApp, UpdateManager } from 'velopack';
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, Notification, Tray } from "electron";
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

// One Resona at a time: starting it again (Start menu, login) brings the existing one up
if (!app.requestSingleInstanceLock()) app.exit(0);
app.on("second-instance", () => showWindow());
// Matches the Velopack Start menu shortcut, so Windows shows our notifications under Resona
app.setAppUserModelId("velopack.Resona");

// Keep a global reference of the window object to send messages
let win;

const TITLEBAR_HEIGHT = 36;
let zoom = 1; // interface size; the native caption buttons scale with the page's title bar
const overlayFor = (dark) => ({
  color: "#00000000",
  symbolColor: dark ? "#f2f2f2" : "#1c1c1c",
  height: Math.round(TITLEBAR_HEIGHT * zoom),
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
  win.on("close", (e) => {
    saveState();
    // Mid-session: the page asks first, saves what was recorded, then calls app:close-now
    if (busy && !win.isDestroyed()) {
      e.preventDefault();
      win.show();
      win.webContents.send("app:close-requested");
    }
  });
  
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

// Interface size (Settings › Appearance, Ctrl +/−). Page zoom keeps layout and popover maths consistent.
ipcMain.on("window:set-zoom", (event, factor) => {
  if (typeof factor !== "number" || !(factor >= 0.8 && factor <= 1.6) || !win || win.isDestroyed()) return;
  zoom = factor;
  win.webContents.setZoomFactor(factor);
  win.setTitleBarOverlay(overlayFor(nativeTheme.shouldUseDarkColors));
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

// --- Background: tray, start with Windows, training reminder ---
// Settings › Background. Kept in the store too, so a login start (no page loaded) knows them.
// plan: routine name per weekday (getDay index, null = rest); skip: rest/time-off dates and today once trained.
let bg = store.get("background", { openAtLogin: false, tray: false, reminder: { on: false, time: "18:00" }, plan: [], override: null, skip: [] });
let tray = null;
let quitting = false;
let busy = false; // a session is running in the page
let notice = null; // held so the click handler isn't garbage-collected

function showWindow(go) {
  // In the tray the page is unloaded; a fresh one opens on Today anyway
  if (!win || win.isDestroyed()) return app.isReady() && createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (go) win.webContents.send("app:go", go);
}

function applyTray() {
  if (bg.tray && !tray) {
    tray = new Tray(path.join(__dirname, "../build/icon.ico"));
    tray.setToolTip("Resona");
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: "Open Resona", click: () => showWindow() },
      { type: "separator" },
      { label: "Quit Resona", click: () => { quitting = true; app.quit(); } },
    ]));
    tray.on("click", () => showWindow());
  } else if (!bg.tray && tray) {
    tray.destroy();
    tray = null;
  }
}

function applyLogin() {
  if (!app.isPackaged) return; // dev runs would register electron.exe
  // Velopack keeps the exe at ...\Resona\current\Resona.exe, so this path survives updates
  app.setLoginItemSettings({ openAtLogin: !!bg.openAtLogin, args: ["--hidden"] });
}

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const reminderTime = (d) => { const [h, m] = bg.reminder.time.split(":").map(Number); const t = new Date(d); t.setHours(h, m, 0, 0); return t; };

function checkReminder() {
  const now = new Date();
  const today = dayKey(now);
  if (!bg.reminder?.on || now < reminderTime(now) || store.get("lastReminded") === today) return;
  const name = bg.override?.date === today ? bg.override.name : bg.plan[now.getDay()];
  if (!name || bg.skip.includes(today) || !Notification.isSupported()) return;
  store.set("lastReminded", today);
  notice = new Notification({ title: "Time to train", body: `${name} is planned for today.`, icon: path.join(__dirname, "../build/icon.ico") });
  notice.on("click", () => showWindow({ section: "today" }));
  notice.show();
}

const isDay = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isName = (v) => typeof v === "string" && v.length <= 200;
ipcMain.on("app:set-background", (event, c) => {
  if (!c || typeof c !== "object") return;
  const time = typeof c.reminder?.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(c.reminder.time) ? c.reminder.time : "18:00";
  const next = {
    openAtLogin: c.openAtLogin === true,
    tray: c.tray === true,
    reminder: { on: c.reminder?.on === true, time },
    plan: Array.isArray(c.plan) ? c.plan.slice(0, 7).map((n) => (isName(n) ? n : null)) : [],
    override: c.override && isDay(c.override.date) && isName(c.override.name) ? { date: c.override.date, name: c.override.name } : null,
    skip: Array.isArray(c.skip) ? c.skip.filter(isDay).slice(0, 400) : [],
  };
  // Turning the reminder on (or moving it) after today's time has passed waits for tomorrow instead of firing at once
  if (next.reminder.on && (!bg.reminder?.on || bg.reminder.time !== time) && new Date() >= reminderTime(new Date())) {
    store.set("lastReminded", dayKey(new Date()));
  }
  const loginChanged = next.openAtLogin !== bg.openAtLogin;
  bg = next;
  store.set("background", bg);
  applyTray();
  if (loginChanged) applyLogin();
});

ipcMain.on("app:set-busy", (event, value) => { busy = value === true; });
ipcMain.on("app:close-now", () => {
  busy = false;
  if (win && !win.isDestroyed()) win.close();
});

// --- Other IPC Handlers ---
ipcMain.on('clear-app-data', () => {
  store.clear();
});

// --- App Events ---
app.whenReady().then(() => {
  applyTray();
  applyLogin();
  setInterval(checkReminder, 30_000);
  // A login start stays in the tray; without the tray there'd be no way to reach it, so open the window
  if (!(process.argv.includes("--hidden") && bg.tray)) createWindow();
});

app.on("before-quit", () => { quitting = true; });

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// With the tray on, closing the window unloads the page and Resona keeps running small
app.on("window-all-closed", () => {
  if (quitting || !bg.tray) app.quit();
});