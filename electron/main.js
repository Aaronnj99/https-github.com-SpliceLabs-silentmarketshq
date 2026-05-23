const { app, BrowserWindow, shell, globalShortcut, Menu } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

const isDev = !app.isPackaged
const PORT = 3000
const DEV_URL = `http://localhost:${PORT}`

let mainWindow = null
let nextServer = null

// ─── Next.js server management ──────────────────────────────────────────────

function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In dev, assume `next dev` is already running (via electron:dev script)
      waitForServer(DEV_URL, resolve, reject)
      return
    }

    // In production, start the standalone Next.js server
    const serverPath = path.join(__dirname, '..', '.next', 'standalone', 'server.js')
    nextServer = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    })

    nextServer.stdout.on('data', (data) => {
      const msg = data.toString()
      if (msg.includes('started server') || msg.includes('ready')) {
        resolve()
      }
    })

    nextServer.stderr.on('data', (data) => console.error('[next]', data.toString()))
    nextServer.on('error', reject)

    // Fallback: poll until ready
    setTimeout(() => waitForServer(DEV_URL, resolve, reject), 2000)
  })
}

function waitForServer(url, resolve, reject, attempts = 0) {
  if (attempts > 30) {
    reject(new Error('Next.js server failed to start'))
    return
  }
  http.get(url, (res) => {
    if (res.statusCode < 500) resolve()
    else setTimeout(() => waitForServer(url, resolve, reject, attempts + 1), 1000)
  }).on('error', () => {
    setTimeout(() => waitForServer(url, resolve, reject, attempts + 1), 1000)
  })
}

// ─── Window creation ─────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#080A0F',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
  })

  // Show only when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

  mainWindow.loadURL(DEV_URL)

  // Open external links in the default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function buildMenu() {
  const template = [
    {
      label: 'APEX',
      submenu: [
        { label: 'About APEX', role: 'about' },
        { type: 'separator' },
        { label: 'Hide APEX', accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Option+H', role: 'hideOthers' },
        { type: 'separator' },
        { label: 'Quit APEX', accelerator: 'Command+Q', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'Command+R', click: () => mainWindow?.reload() },
        { label: 'Toggle DevTools', accelerator: 'Command+Option+I', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'Command+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'Command+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'Command+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Command+F', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Command+M', role: 'minimize' },
        { label: 'Zoom', role: 'zoom' },
        { type: 'separator' },
        { label: 'Bring All to Front', role: 'front' },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  buildMenu()

  try {
    await startNextServer()
  } catch (err) {
    console.error('Failed to start Next.js server:', err)
  }

  createWindow()

  // Re-create window on macOS dock click
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  if (nextServer) {
    nextServer.kill()
    nextServer = null
  }
})
