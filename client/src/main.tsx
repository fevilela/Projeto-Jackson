import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

console.log("[INIT] Starting React app...");
createRoot(rootEl).render(<App />);
console.log("[INIT] React app rendered");
