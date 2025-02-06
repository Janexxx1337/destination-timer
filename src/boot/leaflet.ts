import { boot } from 'quasar/wrappers';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

// Исправляем импорт иконок
const iconUrl = new URL('../../node_modules/leaflet/dist/images/marker-icon.png', import.meta.url).href;
const iconRetinaUrl = new URL('../../node_modules/leaflet/dist/images/marker-icon-2x.png', import.meta.url).href;
const shadowUrl = new URL('../../node_modules/leaflet/dist/images/marker-shadow.png', import.meta.url).href;

export default boot(() => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  });
});
