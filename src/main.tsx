import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Dispatch event for prerenderer to capture HTML after hydration
// Wait for body content to render (meta tags are handled by postProcess)
setTimeout(() => {
  document.dispatchEvent(new Event("render-event"));
}, 3000);
