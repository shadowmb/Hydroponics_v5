/* eslint-env node */

const { configure } = require('quasar/wrappers');
const { PORTS } = require('../config/ports');

module.exports = configure(function (/* ctx */) {
  return {
    eslint: {
      fix: true,
      warnings: false,
      errors: false
    },

    preFetch: true,

    app: {
      head: {
        titleTemplate: title => `${title} - Hydroponics System`,
        title: 'Hydroponics',
        meta: {
          description: { name: 'description', content: 'Hydroponics automation system' },
          format: { name: 'format-detection', content: 'telephone=no' },
          msapplication: { name: 'msapplication-tap-highlight', content: 'no' }
        }
      }
    },

    css: [
      'app.scss'
    ],

    extras: [
      'material-icons',
      'mdi-v7'
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20'
      },

      vueRouterMode: 'history',
      
      typescript: {
        strict: true,
        vueShim: false
      }
    },

    devServer: {
      open: true,
      port: PORTS.FRONTEND_DEV,
      host: '0.0.0.0',
	 
    },

    framework: {
      config: {
        brand: {
          primary: '#1976d2',
          secondary: '#26a69a',
          accent: '#9c27b0',
          dark: '#1d1d1d',
          positive: '#21ba45',
          negative: '#c10015',
          info: '#31ccec',
          warning: '#f2c037'
        },
        // Force 24-hour format for all time inputs
        timeFormat: 24
      },

      iconSet: 'material-icons',
      lang: 'bg',

      plugins: [
        'Dialog',
        'Notify',
        'LoadingBar',
        'Loading'
      ]
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      inspectPort: 5858,

      bundler: 'packager',

      packager: {},

      builder: {
        appId: 'hydroponics-frontend'
      }
    },

    bex: {
      contentScripts: [
        'my-content-script'
      ]
    }
  };
});