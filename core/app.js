import { createSidebar } from "../components/sidebar.js";

import {
  loadRoute
} from "./router.js";

console.log("App booted");

createSidebar();

/*
 * Load the current route when Career OS starts
 */
loadRoute();

/*
 * React to browser navigation
 * and hash changes
 */
window.addEventListener(
  "hashchange",
  loadRoute
);