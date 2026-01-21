/**
 * Electron Builder Configuration
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
export default {
  appId: 'com.specplanner.app',
  productName: 'Spec Planner',
  copyright: 'Copyright © 2024 Spec Planner',
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',

  directories: {
    output: 'release',
    buildResources: 'build',
  },

  asar: true,

  files: [
    'package.json',
    'dist/main/**',
    'dist/renderer/**',
  ],

  // Include templates as extra resources
  extraResources: [
    {
      from: 'src/templates',
      to: 'templates',
      filter: ['**/*'],
    },
  ],

  // ============================================
  // macOS Configuration
  // ============================================
  mac: {
    category: 'public.app-category.developer-tools',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64'],
      },
    ],
    icon: 'build/icon.icns',
    darkModeSupport: true,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
  },

  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
    window: {
      width: 540,
      height: 400,
    },
  },

  // ============================================
  // Windows Configuration
  // ============================================
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
      {
        target: 'zip',
        arch: ['x64'],
      },
    ],
    icon: 'build/icon.ico',
    // Code signing options are configured via signtoolOptions or environment variables
    // CSC_LINK: path to .pfx certificate
    // CSC_KEY_PASSWORD: certificate password
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    allowElevation: true,
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Spec Planner',
  },

  // ============================================
  // Linux Configuration
  // ============================================
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64'],
      },
      // Uncomment to build deb/rpm (requires fpm and ruby)
      // {
      //   target: 'deb',
      //   arch: ['x64'],
      // },
      // {
      //   target: 'rpm',
      //   arch: ['x64'],
      // },
    ],
    category: 'Development',
    icon: 'build/icons',
    maintainer: 'Spec Planner Team',
    vendor: 'Spec Planner',
    synopsis: 'Software specification and planning tool',
    description: 'An Electron application for creating software specifications and implementation plans through conversational AI interaction',
  },

  deb: {
    depends: ['libnotify4', 'libxtst6', 'libnss3'],
    afterInstall: 'build/linux/after-install.sh',
    afterRemove: 'build/linux/after-remove.sh',
  },

  rpm: {
    depends: ['libnotify', 'libXtst', 'nss'],
  },

  // ============================================
  // Auto-updater Configuration
  // ============================================
  publish: {
    provider: 'github',
    owner: 'your-org',
    repo: 'spec-planner',
    releaseType: 'release',
  },
}
