import L from "leaflet";
import type { GpsPoint } from "./types";

export interface MapHandle {
  destroy(): void;
  setZoomLevel(z: number): void;
  setStyle(style: "street" | "satellite"): void;
}

const STREET_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const STREET_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTR = "Tiles &copy; Esri, Maxar, Earthstar Geographics";

const ACCENT = "#7df3c6";

function makePinElement(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:22px;height:22px;";

  const halo = document.createElement("div");
  halo.style.cssText =
    `position:absolute;inset:0;background:${ACCENT};border-radius:9999px;opacity:0.25;animation:nkpdot 2s ease-in-out infinite;`;
  wrap.appendChild(halo);

  const dot = document.createElement("div");
  dot.style.cssText =
    `position:absolute;top:5px;left:5px;width:12px;height:12px;background:${ACCENT};border:2px solid #06080c;border-radius:9999px;box-shadow:0 0 8px ${ACCENT};`;
  wrap.appendChild(dot);

  return wrap;
}

function ensurePinKeyframesInjected(): void {
  if (document.getElementById("nkrypt-pin-keyframes")) return;
  const style = document.createElement("style");
  style.id = "nkrypt-pin-keyframes";
  style.textContent =
    "@keyframes nkpdot{0%,100%{transform:scale(1);opacity:0.25}50%{transform:scale(1.8);opacity:0}}";
  document.head.appendChild(style);
}

export function mountMap(container: HTMLElement, point: GpsPoint): MapHandle {
  ensurePinKeyframesInjected();
  container.replaceChildren();
  const map = L.map(container, {
    center: [point.lat, point.lon],
    zoom: 16,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
  });

  let tileLayer = L.tileLayer(STREET_TILES, {
    maxZoom: 19,
    attribution: STREET_ATTR,
  }).addTo(map);

  const pinIcon = L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: makePinElement().outerHTML,
  });

  L.marker([point.lat, point.lon], { icon: pinIcon }).addTo(map);

  if (point.accuracyMeters && point.accuracyMeters > 0) {
    L.circle([point.lat, point.lon], {
      radius: point.accuracyMeters,
      color: ACCENT,
      opacity: 0.35,
      weight: 1,
      fillColor: ACCENT,
      fillOpacity: 0.08,
    }).addTo(map);
  }

  return {
    destroy() {
      map.remove();
    },
    setZoomLevel(z: number) {
      map.setZoom(z);
    },
    setStyle(style) {
      map.removeLayer(tileLayer);
      tileLayer = L.tileLayer(style === "satellite" ? SATELLITE_TILES : STREET_TILES, {
        maxZoom: 19,
        attribution: style === "satellite" ? SATELLITE_ATTR : STREET_ATTR,
      }).addTo(map);
    },
  };
}
