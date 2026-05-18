import { els } from "./modules/dom.js";
import { state } from "./modules/state.js";
import { setupHandlers } from "./modules/handlers.js";
import { setupPWA } from "./modules/pwa.js";
import { setupFirebaseListeners } from "./modules/firebase.js";
import { onAuthStateChangedListener } from "./modules/auth.js";

function initialize() {
  setupPWA();
  setupHandlers();

  onAuthStateChangedListener((user) => {
    const isLoggedIn = Boolean(user);
    const loggedUser = user
      ? { uid: user.uid, email: user.email, displayName: user.displayName || user.email }
      : { uid: "guest", email: "Gość", displayName: "Gość" };

    state.user = loggedUser;
    els.userChip.textContent = loggedUser.displayName;
    els.authHint.textContent = isLoggedIn
      ? "Zalogowano"
      : "Zaloguj się, żeby dodawać wydarzenia";

    if (els.authPanel) {
      els.authPanel.classList.toggle("hidden", isLoggedIn);
    }

    if (els.logoutBtn) {
      els.logoutBtn.classList.toggle("hidden", !isLoggedIn);
    }
  });

  setupFirebaseListeners();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
