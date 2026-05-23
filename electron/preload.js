const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('apex', {
  platform: process.platform,
  version: process.env.npm_package_version ?? '0.1.0',
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
})
