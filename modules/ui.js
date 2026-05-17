import { els } from "./dom.js";
import { state } from "./state.js";

export function setActiveView(viewId) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  els.navItems.forEach((button) => button.classList.toggle("active", button.dataset.target === viewId));

  if (viewId === "view-map") {
    setTimeout(() => {
      import("./map.js").then((m) => {
        m.ensureMap();
        state.map.invalidateSize();
        m.updateMapMarkers();
      });
    }, 120);
  }
}
