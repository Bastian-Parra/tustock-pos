module.exports = {
  appId: 'cl.tustock.pos',
  productName: 'TuStock POS',
  directories: {
    output: 'release',
    buildResources: 'assets',
  },
  files: [
    'dist/**/*',
    'package.json',
  ],
  publish: {
    provider: 'github',
    owner: 'Bastian-Parra',
    repo: 'tustock-pos',
    releaseType: 'release',
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'assets/logo.ico',
    artifactName: 'TuStock-POS-Setup-${version}.exe',
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
    ],
    category: 'public.app-category.business',
    artifactName: 'TuStock-POS-${version}.dmg',
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64'],
      },
    ],
    icon: 'assets/icon.png',
    category: 'Office',
    artifactName: 'TuStock-POS-${version}.AppImage',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
}
