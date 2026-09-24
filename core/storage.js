import { db } from "./firestore.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUid = null;


export function setCurrentUid(uid) {

  currentUid = uid;

}


export async function loadUserData(uid) {

  const snapshot =
    await getDoc(doc(db, "userData", uid));

  return snapshot.exists()
    ? snapshot.data()
    : null;

}


export function saveData(data) {

  if (!currentUid) {

    console.error(
      "saveData called with no active user — write skipped."
    );

    return Promise.resolve();

  }

  return setDoc(doc(db, "userData", currentUid), data)
    .catch(error => {

      console.error("Firestore save failed:", error);

    });

}


export function resetAllData() {

  if (!currentUid) {

    return Promise.resolve();

  }

  return deleteDoc(doc(db, "userData", currentUid));

}