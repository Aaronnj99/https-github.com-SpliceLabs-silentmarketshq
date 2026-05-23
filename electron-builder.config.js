/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.apex.dashboard',
  productName: 'APEX',
  copyright: 'Copyright © 2025',

  directories: {
    output: 'dist-electron',
    buildResources: 'electron/assets',
  },

  files: [
    'electron/**/*',
    '.next/standalone/**/*',
    '.next/static/**/*',
    'public/**/*',
    'package.json',
  ],

  extraResources: [
    {
      from: '.next/static',
      to: '.next/static',
    },
    {
      from: 'public',
      to: 'public',
    },
  ],

  mac: {
    category: 'public.app-category.finance',
    icon: 'electron/assets/icon.icns',
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
      { target: 'zip', arch: ['arm64', 'x64'] },
    ],
    darkModeSupport: true,
    hardenedRuntime: false,
    gatekeeperAssess: false,
  },

  dmg: {
    title: 'APEX — Personal Command Center',
    icon: 'electron/assets/icon.icns',
    background: 'electron/assets/dmg-background.png',
    window: { width: 540, height: 380 },
    contents: [
      { x: 150, y: 200, type: 'file' },
      { x: 390, y: 200, type: 'link', path: '/Applications' },
    ],
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  afterSign: undefined,
  publish: null,
}
