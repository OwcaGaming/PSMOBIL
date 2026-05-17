import { els } from "./dom.js";

export function formatDate(value) {
  if (!value) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function getEventDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  return value instanceof Date ? value : new Date(value);
}

export function getCategoryLabel(value) {
  const labels = {
    koncert: "Koncert",
    sport: "Sport",
    kultura: "Kultura",
    food: "Jedzenie",
    spotkanie: "Spotkanie",
    inne: "Inne",
  };

  return labels[value] || "Inne";
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
