
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import faviconUrl from "figma:asset/e0cd63eca847c922f306abffb67a5c6de3fd7001.png";

const applyFavicon = () => {
  const existingLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  const link = existingLink ?? document.createElement("link");

  link.rel = "icon";
  link.type = "image/png";
  link.href = faviconUrl;

  if (!existingLink) {
    document.head.appendChild(link);
  }
};

applyFavicon();

createRoot(document.getElementById("root")!).render(<App />);
  