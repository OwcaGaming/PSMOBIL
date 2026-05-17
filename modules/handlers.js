import { els } from "./dom.js";
import { state } from "./state.js";
import { setActiveView } from "./ui.js";
import { fillCurrentLocation } from "./location.js";
import { updatePhotoPreview } from "./photo.js";
import { renderEvents } from "./render.js";
import { saveEvent, saveReview, savePhoto, Timestamp, GeoPoint } from "./firebase.js";
import { uploadPhoto } from "./photo.js";
import { login, register, googleLogin, logoutUser } from "./auth.js";

function onError(error) {
  console.error(error);
}

export function setupHandlers() {
  els.navItems.forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.target));
  });

  if (els.eventSearch) {
    els.eventSearch.addEventListener("input", () => {
      state.feedQuery = els.eventSearch.value;
      renderEvents();
    });
  }



  if (els.photoFile) {
    els.photoFile.addEventListener("change", updatePhotoPreview);
  }

  els.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    login(els.loginForm.email.value.trim(), els.loginForm.password.value.trim())
      .then(() => {
        els.loginForm.reset();
      })
      .catch(onError);
  });

  els.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    register(els.registerForm.email.value.trim(), els.registerForm.password.value.trim())
      .then(() => {
        els.registerForm.reset();
      })
      .catch(onError);
  });

  if (els.googleLoginBtn) {
    els.googleLoginBtn.addEventListener("click", () => {
      googleLogin()
        .catch(onError);
    });
  }

  if (els.quickLocationBtn) {
    els.quickLocationBtn.addEventListener("click", () => {
      setActiveView("view-add");
      fillCurrentLocation(els.eventLat, els.eventLng);
    });
  }

  els.logoutBtn.addEventListener("click", () => {
    logoutUser()
      .catch(onError);
  });

  els.fillLocationBtn.addEventListener("click", () => {
    fillCurrentLocation(els.eventLat, els.eventLng);
  });

  els.locateBtn.addEventListener("click", () => {
    import("./map.js").then((module) => {
      module.ensureMap();
      fillCurrentLocation();
    });
  });

  els.installBtn.addEventListener("click", () => {
    if (!state.deferredPrompt) return;

    state.deferredPrompt.prompt();
    state.deferredPrompt.userChoice.then(() => {
      state.deferredPrompt = null;
      els.installBar.classList.add("hidden");
    });
  });

  els.dismissInstallBtn.addEventListener("click", () => {
    els.installBar.classList.add("hidden");
  });

  els.eventForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.user.uid === "guest") {
      return;
    }

    saveEvent({
      Title: els.eventTitle.value.trim(),
      category: els.eventCategory.value,
      city: els.eventCity.value.trim(),
      place: els.eventPlace.value.trim(),
      description: els.eventDescription.value.trim(),
      eventDate: Timestamp.fromDate(new Date(els.eventDate.value)),
      coordinates: new GeoPoint(Number(els.eventLat.value), Number(els.eventLng.value)),
      tags: els.eventTags.value.split(",").map((tag) => tag.trim()).filter(Boolean),
      authorId: state.user.uid,
      authorName: state.user.displayName,
    })
      .then(() => {
        els.eventForm.reset();
      })
      .catch(onError);
  });

  if (els.reviewRatingStars) {
    const starBtns = els.reviewRatingStars.querySelectorAll(".star-btn");

    starBtns.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        const rating = Number(btn.dataset.rating);
        els.reviewRating.value = rating;

        starBtns.forEach((starButton) => {
          const starRating = Number(starButton.dataset.rating);
          const icon = starButton.querySelector("i");

          if (starRating <= rating) {
            icon.classList.remove("bi-star");
            icon.classList.add("bi-star-fill");
          } else {
            icon.classList.remove("bi-star-fill");
            icon.classList.add("bi-star");
          }
        });
      });
    });
  }

  els.reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();

    saveReview({
      eventId: els.reviewEvent.value,
      rating: Number(els.reviewRating.value),
      text: els.reviewText.value.trim(),
      visited: els.reviewVisited.checked,
      authorId: state.user.uid,
      authorName: state.user.displayName,
      createdAt: new Date(),
    })
      .then(() => {
        els.reviewForm.reset();
        els.reviewVisited.checked = true;
      })
      .catch(onError);
  });

  els.photoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const file = els.photoFile.files[0];

    const storagePath = `event-photos/${file.name}`;

    uploadPhoto(file, storagePath)
      .then((imageUrl) =>
        savePhoto({
          eventId: els.photoEvent.value,
          caption: els.photoCaption.value.trim(),
          imageUrl,
          storagePath,
          authorId: state.user.uid,
          authorName: state.user.displayName,
          createdAt: new Date(),
        }),
      )
      .then(() => {
        els.photoForm.reset();
        updatePhotoPreview();
      })
      .catch(onError);
  });
}
