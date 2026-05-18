import { state } from "./state.js";
import { formatDate } from "./utils.js";

export function ensureMap() {
  if (state.map) return;

  const center = state.currentLocation
    ? [state.currentLocation.latitude, state.currentLocation.longitude]
    : [52.2297, 21.0122];

  state.map = L.map("map_canvas", { zoomControl: true }).setView(center, 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(state.map);
  state.markerLayer = L.layerGroup().addTo(state.map);
}

export function updateMapMarkers() {
  if (!state.map || !state.markerLayer) return;

  state.markerLayer.clearLayers();

  const bounds = [];

  state.events.forEach((event) => {
    const lat = event.coordinates?.latitude;
    const lng = event.coordinates?.longitude;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const marker = L.marker([lat, lng]).addTo(state.markerLayer);
    marker.bindPopup(`
      <strong>${event.Title}</strong><br>
      ${event.city}, ${event.place}<br>
      ${formatDate(event.eventDate)}
    `);
    bounds.push([lat, lng]);
  });

  if (state.currentLocation) {
    const userMarker = L.circleMarker(
      [state.currentLocation.latitude, state.currentLocation.longitude],
      {
        radius: 10,
        color: "#760f24",
        fillColor: "#b81414",
      },
    ).addTo(state.markerLayer);
    bounds.push([state.currentLocation.latitude, state.currentLocation.longitude]);
  }

  if (bounds.length > 0) {
    state.map.fitBounds(bounds, { padding: [30, 30] });
  }
}
