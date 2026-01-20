/**
 * @type {import('electron-builder').Configuration}
 */
export default {
  appId: 'com.specplanner.app',
  productName: 'Spec Planner',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'package.json',
  ],
  mac: {
    category: 'public.app-category.developer-tools',
    target: ['dmg', 'zip'],
    icon: 'build/icon.icns',
  },
  win: {
    target: ['nsis', 'zip'],
    icon: 'build/icon.ico',
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Development',
    icon: 'build/icons',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
}
