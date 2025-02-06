import { defineConfig } from '#q-app/wrappers';

export default defineConfig(() => {
  return {
    boot: [
      'leaflet'
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: {
        browser: [ 'es2022', 'firefox115', 'chrome115', 'safari14' ],
        node: 'node20'
      },

      typescript: {
        strict: true,
        vueShim: true
      },

      vueRouterMode: 'history',
      viteOptions: {
        build: {
          modulePreload: true,
          cssCodeSplit: true
        },
        optimizeDeps: {
          include: ['leaflet', 'leaflet-draw']
        },
        resolve: {
          alias: {
            'leaflet': 'leaflet/dist/leaflet-src.esm.js'
          }
        }
      }
    },

    devServer: {
      open: true
    },

    framework: {
      config: {},
      plugins: [
        'Notify',
        'Dialog',
        'Loading'
      ],
      components: [
        'QBtn',
        'QInput',
        'QForm',
        'QCard',
        'QCardSection',
        'QDrawer',
        'QList',
        'QItem',
        'QItemSection',
        'QItemLabel',
        'QToolbar',
        'QToolbarTitle',
        'QHeader',
        'QFooter',
        'QPageContainer',
        'QPage'
      ]
    },

    animations: [
      'fadeIn',
      'fadeOut'
    ],

    // Добавляем поддержку ассетов
    build: {
      // ... существующие настройки build
      rollupOptions: {
        external: ['leaflet'],
        output: {
          globals: {
            leaflet: 'L'
          }
        }
      }
    }
  }
});
