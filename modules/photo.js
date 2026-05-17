import { storage } from "../firebase-config.js";
import { getDownloadURL, ref as storageRef, uploadBytes } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { els } from "./dom.js";

export async function uploadPhoto(file, path) {
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

export function updatePhotoPreview() {
  const file = els.photoFile?.files?.[0];

  if (file) {
    els.photoPreview.src = URL.createObjectURL(file);
    els.photoPreview.classList.remove("hidden");
  } else {
    els.photoPreview.src = "";
    els.photoPreview.classList.add("hidden");
  }
}

