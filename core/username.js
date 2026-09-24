import { db } from "./firestore.js";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


export async function getUserProfile(uid) {

  const snapshot =
    await getDoc(doc(db, "users", uid));

  return snapshot.exists()
    ? snapshot.data()
    : null;

}


export async function isUsernameTaken(username) {

  const key =
    username.toLowerCase();

  const snapshot =
    await getDoc(doc(db, "usernames", key));

  return snapshot.exists();

}


export async function getEmailForUsername(username) {

  const key =
    username.toLowerCase();

  const snapshot =
    await getDoc(doc(db, "usernames", key));

  return snapshot.exists()
    ? snapshot.data().email
    : null;

}


export function isValidUsernameFormat(username) {

  return /^[a-zA-Z0-9_]{3,20}$/.test(username);

}


export async function claimUsername(uid, username, displayName, photoURL, email) {

  const key =
    username.toLowerCase();

  const taken =
    await isUsernameTaken(username);

  if (taken) {

    throw new Error("username-taken");

  }

  await setDoc(
    doc(db, "usernames", key),
    { uid, email: email || null }
  );

  await setDoc(
    doc(db, "users", uid),
    {
      username: username,
      displayName: displayName || username,
      avatarUrl: photoURL || null,
      role: "user",
      suspended: false,
      email: email || null,
      createdAt: Date.now()
    }
  );

}


export async function changeUsername(uid, oldUsername, newUsername) {

  const newKey =
    newUsername.toLowerCase();

  const taken =
    await isUsernameTaken(newUsername);

  if (taken) {

    throw new Error("username-taken");

  }

  let email = null;

  if (oldUsername) {

    const oldDoc =
      await getDoc(doc(db, "usernames", oldUsername.toLowerCase()));

    email =
      oldDoc.exists() ? oldDoc.data().email : null;

    await deleteDoc(
      doc(db, "usernames", oldUsername.toLowerCase())
    );

  }

  await setDoc(
    doc(db, "usernames", newKey),
    { uid, email }
  );

  await updateDoc(
    doc(db, "users", uid),
    { username: newUsername }
  );

}

export async function updateDisplayName(uid, displayName) {

  await setDoc(
    doc(db, "users", uid),
    { displayName: displayName },
    { merge: true }
  );

}


export async function updateAvatar(uid, avatar) {

  await setDoc(
    doc(db, "users", uid),
    avatar,
    { merge: true }
  );

}


export async function requestAccountDeletion(uid) {

  const now = Date.now();

  const thirtyDaysMs =
    30 * 24 * 60 * 60 * 1000;

  await setDoc(
    doc(db, "users", uid),
    {
      pendingDeletion: {
        requestedAt: now,
        deleteAfter: now + thirtyDaysMs
      }
    },
    { merge: true }
  );

}


export async function cancelAccountDeletion(uid) {

  await setDoc(
    doc(db, "users", uid),
    { pendingDeletion: null },
    { merge: true }
  );

}