import { els } from "./dom.js";
import { state } from "./state.js";

export function setupPWA() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    els.installBar.classList.remove("hidden");
  });
}
