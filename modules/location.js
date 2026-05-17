import { state } from "./state.js";
import { updateMapMarkers } from "./map.js";
import { renderEvents } from "./render.js";

export function fillCurrentLocation(targetLatInput, targetLngInput) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      state.currentLocation = { latitude, longitude };

      if (targetLatInput && targetLngInput) {
        targetLatInput.value = latitude.toFixed(6);
        targetLngInput.value = longitude.toFixed(6);
      }

      if (state.map) {
        state.map.setView([latitude, longitude], 13);
        updateMapMarkers();
      }

      renderEvents();
    },
    (error) => {
      console.error("Geolocation error:", error.message);
    }
  );
}
