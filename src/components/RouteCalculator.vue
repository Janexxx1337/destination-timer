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
                  @update:model-value="updateRoute(index)"
                />

                <q-input
                  v-model="route.departureTime"
                  type="datetime-local"
                  label="Departure Time"
                  class="q-mb-md"
                  @update:model-value="updateRoute(index)"
                />

                <div v-for="(point, pointIndex) in route.coordinates" :key="pointIndex">
                  <div class="row q-mb-sm">
                    <q-input
                      v-model.number="point.lat"
                      type="number"
                      label="Latitude"
                      class="col q-pr-sm"
                      @update:model-value="updateRoute(index)"
                    />
                    <q-input
                      v-model.number="point.lng"
                      type="number"
                      label="Longitude"
                      class="col q-pl-sm"
                      @update:model-value="updateRoute(index)"
                    />
                    <q-btn
                      flat
                      round
                      color="negative"
                      icon="delete"
                      @click="removePoint(index, pointIndex)"
                      class="q-ml-sm"
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

    <q-page-container class="map-wr">
      <div ref="mapContainer" class="map-container"></div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet-draw';  // изменено
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.setIcon(DefaultIcon);

const drawer = ref(true);
const mapContainer = ref(null);
const map = ref(null);
const routes = ref([]);
const drawControl = ref(null);
const routeLayers = ref([]);
const updateInterval = ref(null);

const routeColors = [
  '#3388ff',
  '#ff3333',
  '#33ff33',
  '#ff33ff',
  '#ffaa33',
  '#33ffff',
  '#aa33ff',
  '#ffff33',
  '#ff9999',
  '#99ff99'
];

const addRoute = () => {
  routes.value.push({
    coordinates: [],
    speed: 60,
    departureTime: new Date().toISOString().slice(0, 16)
  });
};

const deleteRoute = (index) => {
  routes.value.splice(index, 1);
  if (routeLayers.value[index]) {
    map.value.removeLayer(routeLayers.value[index]);
    routeLayers.value.splice(index, 1);
  }
  routes.value.forEach((_, idx) => {
    updateRoute(idx);
  });
};

const removePoint = (routeIndex, pointIndex) => {
  routes.value[routeIndex].coordinates.splice(pointIndex, 1);
  updateRoute(routeIndex);
};

const formatTimeRemaining = (arrivalTime) => {
  const now = new Date();
  const arrival = new Date(arrivalTime);
  const diff = arrival - now;

  if (diff < 0) return 'Arrived';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m remaining`;
};

const calculateArrivalTime = (route) => {
  if (!route.coordinates || route.coordinates.length < 2) return null;

  let totalDistance = 0;
  for (let i = 0; i < route.coordinates.length - 1; i++) {
    const point1 = L.latLng(route.coordinates[i]);
    const point2 = L.latLng(route.coordinates[i + 1]);
    totalDistance += point1.distanceTo(point2) / 1000;
  }

  const timeInHours = totalDistance / route.speed;
  const departureTime = new Date(route.departureTime);
  const arrivalTime = new Date(departureTime.getTime() + timeInHours * 60 * 60 * 1000);

  return arrivalTime;
};

const updateRoute = (index) => {
  const route = routes.value[index];
  if (routeLayers.value[index]) {
    map.value.removeLayer(routeLayers.value[index]);
  }

  if (!route.coordinates || route.coordinates.length < 2) return;

  const routeColor = routeColors[index % routeColors.length];

  const polyline = L.polyline(route.coordinates, {
    color: routeColor,
    weight: 3,
    opacity: 0.8
  });

  const startMarker = L.marker(route.coordinates[0])
    .bindTooltip(`
      <div class="tooltip-content">
        <strong>Departure Time:</strong><br>
        ${new Date(route.departureTime).toLocaleString()}
      </div>
    `, {
      permanent: true,
      direction: 'right'
    });

  const arrivalTime = calculateArrivalTime(route);
  const endMarker = L.marker(route.coordinates[route.coordinates.length - 1])
    .bindTooltip(`
      <div class="tooltip-content">
        <strong style="color: ${routeColor}">Route ${index + 1} Info:</strong><br>
        Speed: ${route.speed} km/h<br>
        Arrival: ${arrivalTime ? arrivalTime.toLocaleString() : 'N/A'}<br>
        ${arrivalTime ? formatTimeRemaining(arrivalTime) : ''}
      </div>
    `, {
      permanent: true,
      direction: 'right'
    });

  const routeGroup = L.featureGroup([polyline, startMarker, endMarker]);
  routeGroup.addTo(map.value);
  routeLayers.value[index] = routeGroup;
};

onMounted(() => {
  map.value = L.map(mapContainer.value).setView([51.505, -0.09], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value);

  const drawnItems = new L.FeatureGroup();
  map.value.addLayer(drawnItems);

  drawControl.value = new L.Control.Draw({
    draw: {
      polyline: {
        shapeOptions: {
          color: routeColors[routes.value.length % routeColors.length],
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
      featureGroup: drawnItems
    }
  });

  map.value.addControl(drawControl.value);

  map.value.on('draw:created', (e) => {
    const layer = e.layer;
    const coordinates = layer.getLatLngs().map(latLng => ({
      lat: latLng.lat,
      lng: latLng.lng
    }));

    routes.value.push({
      coordinates,
      speed: 60,
      departureTime: new Date().toISOString().slice(0, 16)
    });
  });

  updateInterval.value = setInterval(() => {
    routes.value.forEach((_, index) => {
      updateRoute(index);
    });
  }, 1000);
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});

watch(routes, (newRoutes) => {
  newRoutes.forEach((_, index) => {
    updateRoute(index);
  });
}, { deep: true });
</script>

<style>
.map-container {
  height: 100%;
  width: 100%;
}

.tooltip-content {
  font-size: 12px;
  line-height: 1.4;
}

.leaflet-tooltip {
  background: white;
  border: 1px solid #666;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.map-wr {
  padding-top: 0px !important;
  height: calc(100vh - 50px);
}
</style>
