const config = {
  appId: 'jp.nicovideo.nair',
  productName: 'N Air',
  icon: 'media/images/icon.ico',
  files: [
    'bundles',
    'node_modules',
    'vendor',
    'app/i18n',
    'updater/index.html',
    'updater/Updater.js',
    'index.html',
    'main.js',
    'obs-api'
  ],
  extraFiles: [
    'LICENSE',
    'AGREEMENT.sjis'
  ],
  detectUpdateChannel: false,
  publish: {
    provider: 'generic',
    useMultipleRangeRequest: false,
    channel: 'latest',
    url: 'https://n-air-app.nicovideo.jp/download/windows'
  },
  nsis: {
    license: 'AGREEMENT.sjis',
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: true,
    // eslint-disable-next-line no-template-curly-in-string
    artifactName: 'n-air-app-setup.${version}.${ext}',
    include: 'installer.nsh'
  },
  win: {
    publisherName: [
      'DWANGO Co.,Ltd.'
    ],
    rfc3161TimeStampServer: 'http://timestamp.digicert.com'
  },
  extraMetadata: {
    env: 'production'
  }
};

if (process.env.NAIR_LICENSE_API_KEY) {
  config.extraMetadata.getlicensenair_key = process.env.NAIR_LICENSE_API_KEY;
}

module.exports = config;
