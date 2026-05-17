import { readStorage, writeStorage } from "./storage.js";

export const FAVORITES_KEY = "psmobil-favorites";

export const DEMO_USER = {
  uid: "student-demo-user",
  email: "student@psmobil.app",
  displayName: "Aplikacja Demo",
};

export const state = {
  user: DEMO_USER,
  events: [],
  reviews: [],
  photos: [],
  feedQuery: "",
  map: null,
  markerLayer: null,
  currentLocation: null,
  deferredPrompt: null,
  favorites: readStorage(FAVORITES_KEY, []),
};
