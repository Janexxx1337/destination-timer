import { defineConfig } from '#q-app/wrappers';

export default defineConfig(() => {
  return {
    boot: [
      // Можно добавить boot файл для инициализации Leaflet
      'leaflet'
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons',
      // Добавим Material иконки для UI элементов
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
        }
      }
    },

    devServer: {
      open: true
    },

    framework: {
      config: {},
      // Добавляем нужные плагины Quasar
      plugins: [
        'Notify', // Для уведомлений
        'Dialog', // Для диалоговых окон
        'Loading' // Для индикации загрузки
      ],
      // Добавляем часто используемые компоненты
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
    ]
  }
});
