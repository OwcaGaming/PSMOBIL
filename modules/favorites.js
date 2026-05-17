import { state, FAVORITES_KEY } from "./state.js";
import { writeStorage } from "./storage.js";
import { renderFavorites, renderProfile, renderEvents } from "./render.js";

export function saveFavorites() {
  writeStorage(FAVORITES_KEY, state.favorites);
}

export function isFavorite(eventId) {
  return state.favorites.includes(eventId);
}

export function toggleFavorite(eventId) {
  if (isFavorite(eventId)) {
    state.favorites = state.favorites.filter((id) => id !== eventId);
  } else {
    state.favorites.push(eventId);
  }

  saveFavorites();
  renderFavorites();
  renderProfile();
  renderEvents();
}
