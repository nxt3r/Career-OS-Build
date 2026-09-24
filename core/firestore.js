import { firebaseApp } from "./firebase.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/*
 * persistentLocalCache enables offline support:
 * reads/writes work without internet and sync
 * automatically once reconnected.
 */

export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});