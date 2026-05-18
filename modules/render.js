import { els } from "./dom.js";
import { state } from "./state.js";
import { formatDate, getEventDate, normalizeText, getCategoryLabel } from "./utils.js";
import { isFavorite } from "./favorites.js";
import { updateMapMarkers } from "./map.js";

function createEl(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.attrs) Object.entries(props.attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (props.text) el.textContent = props.text;
  if (props.html) el.innerHTML = props.html;
  if (props.on) Object.entries(props.on).forEach(([e, fn]) => el.addEventListener(e, fn));
  children.flat().forEach((c) => {
    if (c === null || c === undefined) return;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return el;
}

function showConfirmPopup({ title, message, confirmLabel = "Usuń", cancelLabel = "Anuluj" }) {
  return new Promise((resolve) => {
    const overlay = createEl("div", { class: "confirm-overlay", attrs: { role: "dialog", "aria-modal": "true" } });
    const dialog = createEl("div", { class: "confirm-dialog card-surface" });
    const heading = createEl("h3", { text: title });
    const text = createEl("p", { class: "muted-text", text: message });

    const cancelBtn = createEl(
      "button",
      {
        class: "btn-soft",
        attrs: { type: "button" },
        on: { click: () => close(false) },
      },
      cancelLabel,
    );

    const confirmBtn = createEl(
      "button",
      {
        class: "btn-soft btn-danger",
        attrs: { type: "button" },
        on: { click: () => close(true) },
      },
      confirmLabel,
    );

    const actions = createEl("div", { class: "confirm-actions" }, cancelBtn, confirmBtn);
    dialog.append(heading, text, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close(false);
      }
    });

    document.addEventListener("keydown", onKeyDown);
    confirmBtn.focus();

    function close(result) {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      overlay.remove();
      resolve(result);
    }
  });
}

async function handleDeleteEvent(event) {
  const confirmed = await showConfirmPopup({
    title: "Usuń wydarzenie",
    message: `Czy na pewno chcesz usunąć "${event.Title}"? Ta akcja jest nieodwracalna.`,
    confirmLabel: "Usuń",
  });

  if (!confirmed) return;

  import("./firebase.js").then((m) => {
    m.deleteEvent(event.id).catch((error) => console.error("Błąd przy usuwaniu wydarzenia:", error));
  });
}

async function handleDeleteReview(review) {
  const confirmed = await showConfirmPopup({
    title: "Usuń opinię",
    message: "Czy na pewno chcesz usunąć tę opinię? Ta akcja jest nieodwracalna.",
    confirmLabel: "Usuń",
  });

  if (!confirmed) return;

  import("./firebase.js").then((m) => {
    m.deleteReview(review.id).catch((error) => console.error("Błąd przy usuwaniu opinii:", error));
  });
}

async function handleDeletePhoto(photo) {
  const confirmed = await showConfirmPopup({
    title: "Usuń zdjęcie",
    message: "Czy na pewno chcesz usunąć to zdjęcie? Ta akcja jest nieodwracalna.",
    confirmLabel: "Usuń",
  });

  if (!confirmed) return;

  import("./firebase.js").then((m) => {
    m.deletePhoto(photo.id).catch((error) => console.error("Błąd przy usuwaniu zdjęcia:", error));
  });
}

export function renderEventOptions() {
  els.reviewEvent.innerHTML = "";
  els.photoEvent.innerHTML = "";

  const sorted = [...state.events].sort((a, b) => {
    const dateA = getEventDate(a.eventDate)?.getTime() || 0;
    const dateB = getEventDate(b.eventDate)?.getTime() || 0;
    return dateA - dateB;
  });

  sorted.forEach((event) => {
    const opt1 = createEl("option", { attrs: { value: event.id }, text: `${event.Title} - ${event.city}` });
    const opt2 = opt1.cloneNode(true);
    els.reviewEvent.appendChild(opt1);
    els.photoEvent.appendChild(opt2);
  });

  if (!sorted.length) {
    els.reviewEvent.innerHTML = '<option value="">Najpierw dodaj wydarzenie</option>';
    els.photoEvent.innerHTML = '<option value="">Najpierw dodaj wydarzenie</option>';
  }
}

export function getEventImage(eventId) {
  const photo = [...state.photos]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .find((item) => item.eventId === eventId && item.imageUrl);

  return photo?.imageUrl || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80";
}

export function getReviewsForEvent(eventId, limit = 2) {
  return [...state.reviews]
    .filter((review) => review.eventId === eventId)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, limit);
}

function buildEventCard(event) {
  const tags = Array.isArray(event.tags) ? event.tags : [];
  const reviews = getReviewsForEvent(event.id, 2);
  const reviewCount = state.reviews.filter((r) => r.eventId === event.id).length;
  const isPast = getEventDate(event.eventDate) < new Date();

  const img = createEl("img", {
    class: "event-photo",
    attrs: { src: getEventImage(event.id), alt: `Zdjęcie wydarzenia ${event.Title}` },
  });

  const title = createEl("div", { class: "event-title", text: event.Title });
  const meta = createEl("div", { class: "muted-text", text: `${event.city} • ${event.place}` });
  const category = createEl("span", { class: "badge-inline", text: getCategoryLabel(event.category) });

  const reviewBtn = createEl(
    "button",
    {
      class: "btn-soft btn-share",
      attrs: { type: "button", "data-review-event": event.id },
      on: {
        click: () => {
          if (!els.reviewEvent || !els.reviewForm) return;
          els.reviewEvent.value = event.id;
          import("./ui.js").then((m) => m.setActiveView("view-feed"));
          els.reviewForm.scrollIntoView({ behavior: "smooth", block: "start" });
        },
      },
    },
    createEl("i", { class: "bi bi-chat-square-heart" }),
    " Napisz opinię"
  );

  const favBtn = createEl(
    "button",
    {
      class: `btn-soft btn-favorite ${isFavorite(event.id) ? "active" : ""}`,
      attrs: { type: "button", "data-favorite-event": event.id, "aria-pressed": isFavorite(event.id) ? "true" : "false" },
      on: {
        click: () => {
          if (state.user.uid === "guest") return;
          import("./favorites.js").then((m) => m.toggleFavorite(event.id));
        },
      },
    },
    createEl("i", { class: `bi ${isFavorite(event.id) ? "bi-heart-fill" : "bi-heart"}` }),
    isFavorite(event.id) ? " Ulubione" : " Do ulubionych"
  );

  const reviewList = createEl("div");
  if (reviews.length) {
    reviews.forEach((review) => {
      const reviewDeleteBtn = state.user.uid === review.authorId && state.user.uid !== "guest"
        ? createEl("button", {
            class: "btn-soft btn-delete",
            attrs: { type: "button", title: "Usuń opinię" },
            on: { click: () => handleDeleteReview(review) },
          }, createEl("i", { class: "bi bi-trash" }))
        : null;

      const rev = createEl("article", { class: "event-review" },
        createEl("div", { class: "event-review-top" }, createEl("strong", { text: review.authorName || "Anonim" }), createEl("span", { class: "badge-inline", text: `${review.rating}/5` }), reviewDeleteBtn),
        createEl("p", { class: "mb-1", text: review.text }),
        createEl("small", { class: "muted-text", text: review.visited ? "Uczestnik wydarzenia" : "Opinia zdalna" }),
      );
      reviewList.appendChild(rev);
    });
  } 

  const deleteBtn = state.user.uid === event.authorId && state.user.uid !== "guest"
    ? createEl("button", {
        class: "btn-soft btn-delete",
        attrs: { type: "button", title: "Usuń wydarzenie" },
        on: { click: () => handleDeleteEvent(event) },
      }, createEl("i", { class: "bi bi-trash" }))
    : null;

  const card = createEl(
    "article",
    { class: "event-card", attrs: { id: `event-${event.id}` } },
    createEl("div", { class: "event-photo-wrap" }, img),
    createEl("div", { class: "event-top" }, createEl("div", {}, title, meta), createEl("div", { class: "pill-row" }, category, isPast ? createEl("span", { class: "badge-inline", text: "Archiwum" }) : null)),
    createEl("div", { class: "event-meta" }, createEl("span", {}, createEl("i", { class: "bi bi-calendar-event" }), ` ${formatDate(getEventDate(event.eventDate))}`)),
    createEl("p", { class: "mb-0", text: event.description }),
    createEl("div", { class: "pill-row" }, ...(tags.length ? tags : ["wydarzenie"]).map((t) => createEl("span", { class: "pill", text: t }))),
    createEl("div", { class: "event-actions" }, reviewBtn, favBtn, deleteBtn),
    createEl("div", { class: "event-reviews" }, createEl("div", { class: "event-reviews-head" }, createEl("strong", { text: "Opinie" }), createEl("span", { class: "muted-text", text: `${reviewCount} ${reviewCount === 1 ? "opinia" : "opinii"}` })), reviewList)
  );

  return card;
}

export function renderEvents() {
  els.eventsList.innerHTML = "";
  const search = normalizeText(state.feedQuery);

  const eventsWithDate = state.events.map((event) => ({ ...event, dateObj: getEventDate(event.eventDate) })).filter((e) => e.dateObj);

  const visibleEvents = eventsWithDate
    .filter((event) => {
      const searchable = normalizeText([event.Title, event.city, event.place, event.description].join(" "));
      return !search || searchable.includes(search);
    })
    .sort((a, b) => a.dateObj - b.dateObj);

  els.eventCount.textContent = String(visibleEvents.length);

  if (!visibleEvents.length) {
    els.eventsList.appendChild(
      createEl("div", { class: "empty-state" }, createEl("strong", { text: "Brak wydarzeń do pokazania" }), createEl("p", { class: "muted-text mb-0", text: "Spróbuj zmienić wyszukiwanie." })),
    );
    return;
  }

  visibleEvents.forEach((event) => els.eventsList.appendChild(buildEventCard(event)));
}

export function renderFavorites() {
  if (!els.favoritesList) return;
  els.favoritesList.innerHTML = "";

  const favoriteEvents = state.favorites.map((id) => state.events.find((e) => e.id === id)).filter(Boolean).sort((a, b) => {
    const dateA = getEventDate(a.eventDate)?.getTime() || 0;
    const dateB = getEventDate(b.eventDate)?.getTime() || 0;
    return dateA - dateB;
  });

  if (!favoriteEvents.length) {
    els.favoritesList.appendChild(createEl("p", { class: "muted-text mb-0", text: "Nie masz jeszcze żadnych ulubionych wydarzeń." }));
    return;
  }

  favoriteEvents.forEach((event) => {
    const item = createEl("article", { class: "favorite-item" }, createEl("div", {}, createEl("strong", { text: event.Title }), createEl("div", { class: "muted-text", text: `${event.city} • ${formatDate(getEventDate(event.eventDate))}` })), createEl("button", { class: "btn-soft btn-favorite active", attrs: { type: "button", "data-favorite-event": event.id }, on: { click: () => import("./favorites.js").then((m) => m.toggleFavorite(event.id)) } }, createEl("i", { class: "bi bi-heart-fill" }), " Usuń"));
    els.favoritesList.appendChild(item);
  });
}

export function renderReviews() {
  els.reviewsList.innerHTML = "";
  const eventById = new Map(state.events.map((event) => [event.id, event]));

  const latest = [...state.reviews].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);

  if (!latest.length) {
    els.reviewsList.appendChild(createEl("div", { class: "empty-state" }, createEl("p", { class: "mb-0 muted-text", text: "Jeszcze nie ma opinii." })));
    return;
  }

  latest.forEach((review) => {
    const event = eventById.get(review.eventId);
    
    const reviewDeleteBtn = state.user.uid === review.authorId && state.user.uid !== "guest"
      ? createEl("button", {
          class: "btn-soft btn-delete",
          attrs: { type: "button", title: "Usuń opinię" },
          on: { click: () => handleDeleteReview(review) },
        }, createEl("i", { class: "bi bi-trash" }))
      : null;
    
    const head = createEl("div", { class: "review-head" }, createEl("strong", { text: review.authorName || "Anonim" }), createEl("span", { class: "badge-inline", text: `${review.rating}/5` }), reviewDeleteBtn);
    const titleDiv = createEl("div", { class: "muted-text mb-2", text: event ? event.Title : "Nieznane wydarzenie" });
    const p = createEl("p", { class: "mb-2", text: review.text });
    const small = createEl("small", { class: "muted-text", text: `${review.visited ? "Uczestnik wydarzenia" : "Opinia zdalna"}${review.createdAt?.toDate ? ` • ${formatDate(review.createdAt.toDate())}` : ""}` });
    const card = createEl("article", { class: "review-card" }, head, titleDiv, p, small);
    els.reviewsList.appendChild(card);
  });
}

export function renderPhotos() {
  els.photosList.innerHTML = "";
  const eventById = new Map(state.events.map((event) => [event.id, event]));

  const latest = [...state.photos].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);

  if (!latest.length) {
    els.photosList.appendChild(createEl("div", { class: "empty-state" }, createEl("p", { class: "mb-0 muted-text", text: "Brak zdjęć w galerii." })));
    return;
  }

  latest.forEach((photo) => {
    const event = eventById.get(photo.eventId);
    
    const photoDeleteBtn = state.user.uid === photo.authorId && state.user.uid !== "guest"
      ? createEl("button", {
          class: "btn-soft btn-delete",
          attrs: { type: "button", title: "Usuń zdjęcie" },
          on: { click: () => handleDeletePhoto(photo) },
        }, createEl("i", { class: "bi bi-trash" }))
      : null;
    
    const card = createEl("article", { class: "photo-card" }, createEl("div", { class: "photo-head" }, createEl("strong", { text: photo.authorName || "Anonim" }), createEl("span", { class: "badge-inline", html: `<i class=\"bi bi-image\"></i> ${event ? event.Title : "Zdjęcie"}` }), photoDeleteBtn), createEl("p", { class: "muted-text mb-2", text: photo.caption }), createEl("img", { attrs: { src: photo.imageUrl, alt: `Zdjęcie z wydarzenia ${event ? event.Title : ""}` } }));
    els.photosList.appendChild(card);
  });
}

export function renderProfile() {
  els.profileName.textContent = state.user.displayName || "Użytkownik BędęTam";
  els.profileEmail.textContent = state.user.email || "Brak adresu e-mail";
  els.profileEvents.textContent = String(state.events.filter((event) => event.authorId === state.user.uid).length);
  els.profileReviews.textContent = String(state.reviews.filter((review) => review.authorId === state.user.uid).length);
  els.profilePhotos.textContent = String(state.photos.filter((photo) => photo.authorId === state.user.uid).length);
  if (els.profileFavorites) {
    els.profileFavorites.textContent = String(state.favorites.length);
  }
}

export function renderAll() {
  renderEventOptions();
  renderEvents();
  renderReviews();
  renderPhotos();
  renderFavorites();
  renderProfile();
  updateMapMarkers();
}
