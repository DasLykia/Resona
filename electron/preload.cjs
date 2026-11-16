const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("velopackApi", {
    getVersion: () => ipcRenderer.invoke("velopack:get-version"),
    checkForUpdates: () => ipcRenderer.invoke("velopack:check-for-update"),
    downloadUpdates: (updateInfo) => ipcRenderer.invoke("velopack:download-update", updateInfo),
    applyUpdates: (updateInfo) => ipcRenderer.invoke("velopack:apply-update", updateInfo),
    clearAppData: () => ipcRenderer.send('clear-app-data'),
});

contextBridge.exposeInMainWorld("resonaWindow", {
    setTheme: (source) => ipcRenderer.send("window:set-theme", source),
    setZoom: (factor) => ipcRenderer.send("window:set-zoom", factor),
    setBackground: (config) => ipcRenderer.send("app:set-background", config),
    setBusy: (busy) => ipcRenderer.send("app:set-busy", busy),
    closeNow: () => ipcRenderer.send("app:close-now"),
    // Each returns an unsubscribe for React effects
    onCloseRequested: (cb) => { const h = () => cb(); ipcRenderer.on("app:close-requested", h); return () => ipcRenderer.off("app:close-requested", h); },
    onGo: (cb) => { const h = (e, to) => cb(to); ipcRenderer.on("app:go", h); return () => ipcRenderer.off("app:go", h); },
});

contextBridge.exposeInMainWorld("resonaFiles", {
    chooseExportFolder: () => ipcRenderer.invoke("export:choose-folder"),
    writeExport: (name, data) => ipcRenderer.invoke("export:write", name, data),
});
