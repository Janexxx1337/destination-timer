// RouteCalculator.vue
<template>
  <q-layout view="hHh LpR fFf">
    <q-drawer show-if-above v-model="drawer" side="right" bordered>
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header>Routes</q-item-label>

          <div v-for="(route, index) in routes" :key="index" class="q-pa-md">
            <q-card>
              <q-card-section>
                <div class="text-h6">Route {{ index + 1 }}</div>

                <q-input
                  v-model="route.speed"
                  type="number"
                  label="Average Speed (km/h)"
                  class="q-mb-md"
                />

                <div v-for="(point, pointIndex) in route.coordinates" :key="pointIndex">
                  <div class="row q-mb-sm">
                    <q-input
                      v-model="point.lat"
                      type="number"
                      label="Latitude"
                      class="col q-pr-sm"
                    />
                    <q-input
                      v-model="point.lng"
                      type="number"
                      label="Longitude"
                      class="col q-pl-sm"
                    />
                  </div>
                </div>

                <q-btn
                  color="negative"
                  label="Delete Route"
                  @click="deleteRoute(index)"
                  class="q-mt-sm"
                />
              </q-card-section>
            </q-card>
          </div>

          <q-btn
            color="primary"
            label="Add Route"
            @click="addRoute"
            class="q-ma-md"
          />
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <div ref="mapContainer" class="map-container"></div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet-draw';

const drawer = ref(true);
const mapContainer = ref(null);
const map = ref(null);
const routes = ref([]);
const drawControl = ref(null);
const routeLayers = ref([]);

// Добавление нового маршрута
const addRoute = () => {
  routes.value.push({
    coordinates: [],
    speed: 60,
    departureTime: new Date()
  });
};

// Удаление маршрута
const deleteRoute = (index) => {
  routes.value.splice(index, 1);
  if (routeLayers.value[index]) {
    map.value.removeLayer(routeLayers.value[index]);
    routeLayers.value.splice(index, 1);
  }
};

// Расчет времени прибытия
const calculateArrivalTime = (route) => {
  if (!route.coordinates || route.coordinates.length < 2) return null;

  let totalDistance = 0;
  for (let i = 0; i < route.coordinates.length - 1; i++) {
    const point1 = L.latLng(route.coordinates[i]);
    const point2 = L.latLng(route.coordinates[i + 1]);
    totalDistance += point1.distanceTo(point2) / 1000; // Конвертация в километры
  }

  const timeInHours = totalDistance / route.speed;
  const arrivalTime = new Date(route.departureTime);
  arrivalTime.setHours(arrivalTime.getHours() + timeInHours);

  return arrivalTime;
};

// Обновление маршрута на карте
const updateRouteOnMap = (route, index) => {
  if (routeLayers.value[index]) {
    map.value.removeLayer(routeLayers.value[index]);
  }

  if (!route.coordinates || route.coordinates.length < 2) return;

  const polyline = L.polyline(route.coordinates, {
    color: 'blue',
    weight: 3,
    opacity: 0.8
  });

  // Маркер начальной точки с временем отправления
  const startMarker = L.marker(route.coordinates[0])
    .bindTooltip(`
      <div class="tooltip-content">
        <strong>Departure Time:</strong><br>
        ${route.departureTime.toLocaleTimeString()}
      </div>
    `, {
      permanent: true,
      direction: 'right'
    });

  // Маркер конечной точки с расчетным временем прибытия
  const arrivalTime = calculateArrivalTime(route);
  const endMarker = L.marker(route.coordinates[route.coordinates.length - 1])
    .bindTooltip(`
      <div class="tooltip-content">
        <strong>Route Info:</strong><br>
        Speed: ${route.speed} km/h<br>
        Arrival: ${arrivalTime ? arrivalTime.toLocaleTimeString() : 'N/A'}<br>
        <button class="delete-btn" onclick="window.routeCalculator.deleteRoute(${index})">
          Delete Route
        </button>
      </div>
    `, {
      permanent: true,
      direction: 'right'
    });

  const routeGroup = L.featureGroup([polyline, startMarker, endMarker]);
  routeGroup.addTo(map.value);
  routeLayers.value[index] = routeGroup;
};

// Инициализация карты при монтировании компонента
onMounted(() => {
  // Инициализация карты
  map.value = L.map(mapContainer.value).setView([51.505, -0.09], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value);

  // Инициализация инструментов рисования
  drawControl.value = new L.Control.Draw({
    draw: {
      polyline: {
        shapeOptions: {
          color: 'blue',
          weight: 3
        }
      },
      polygon: false,
      circle: false,
      rectangle: false,
      circlemarker: false,
      marker: false
    },
    edit: {
      featureGroup: L.featureGroup(),
      remove: true
    }
  });

  map.value.addControl(drawControl.value);

  // Обработка события создания маршрута
  map.value.on('draw:created', (e) => {
    const layer = e.layer;
    const coordinates = layer.getLatLngs().map(latLng => ({
      lat: latLng.lat,
      lng: latLng.lng
    }));

    routes.value.push({
      coordinates,
      speed: 60,
      departureTime: new Date()
    });
  });

  // Экспорт функции удаления маршрута в глобальный объект
  window.routeCalculator = {
    deleteRoute
  };
});

// Отслеживание изменений маршрутов
watch(routes, (newRoutes) => {
  newRoutes.forEach((route, index) => {
    updateRouteOnMap(route, index);
  });
}, { deep: true });

// Обновление времени прибытия каждую минуту
const startTimeUpdates = () => {
  setInterval(() => {
    routes.value.forEach((route, index) => {
      updateRouteOnMap(route, index);
    });
  }, 60000); // 60 секунд
};

onMounted(() => {
  startTimeUpdates();
});
</script>

<style>
.map-container {
  height: 100vh;
  width: 100%;
}

.tooltip-content {
  font-size: 12px;
  line-height: 1.4;
}

.delete-btn {
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #cc0000;
}

/* Стили Leaflet */
@import 'leaflet/dist/leaflet.css';
@import 'leaflet-draw/dist/leaflet.draw.css';

.leaflet-tooltip {
  background: white;
  border: 1px solid #666;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.q-page-container {
  padding-top: 0px !important;
}
</style>
