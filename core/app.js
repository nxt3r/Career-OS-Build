import { createSidebar } from "../components/sidebar.js";
import { navigate } from "./router.js";

console.log("App booted");

createSidebar();
navigate("dashboard");