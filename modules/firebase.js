import { db } from "../firebase-config.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  GeoPoint,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { state } from "./state.js";
import { renderAll } from "./render.js";

export async function saveProfile(user, displayName) {
  const profileRef = doc(db, "profiles", user.uid);
  const profileData = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || user.email?.split("@")[0] || "Użytkownik",
    lastLoginAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    providerIds: user.providerData.map((provider) => provider.providerId),
  };

  await setDoc(profileRef, profileData, { merge: true });
}

export async function saveEvent(eventData) {
  return await addDoc(collection(db, "events"), eventData);
}

export async function saveReview(reviewData) {
  return await addDoc(collection(db, "reviews"), reviewData);
}

export async function savePhoto(photoData) {
  return await addDoc(collection(db, "photos"), photoData);
}

export function setupFirebaseListeners() {
  onSnapshot(query(collection(db, "events"), orderBy("eventDate", "asc")), (snapshot) => {
    state.events = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderAll();
  });

  onSnapshot(query(collection(db, "reviews"), orderBy("createdAt", "desc")), (snapshot) => {
    state.reviews = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderAll();
  });

  onSnapshot(query(collection(db, "photos"), orderBy("createdAt", "desc")), (snapshot) => {
    state.photos = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderAll();
  });
}

export async function deleteEvent(eventId) {
  await deleteDoc(doc(db, "events", eventId));
}

export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, "reviews", reviewId));
}

export async function deletePhoto(photoId) {
  await deleteDoc(doc(db, "photos", photoId));
}

export { addDoc, collection, Timestamp, GeoPoint, serverTimestamp };
