# VectorEFB • SkyRoute Planner (MSFS 2024 & 2020)

[![Deploy to GitHub Pages](https://github.com/Amurut/Skyroute_Planner/actions/workflows/deploy.yml/badge.svg)](https://github.com/Amurut/Skyroute_Planner/actions/workflows/deploy.yml)
[![Live Application](https://img.shields.io/badge/Live_App-amurut.com%2FSkyroute__Planner-06B6D4?style=flat&logo=googlechrome)](https://amurut.com/Skyroute_Planner/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A modern, responsive Electronic Flight Bag (EFB) and flight operations planner designed for **Microsoft Flight Simulator 2024** and **MSFS 2020**. 

Explore airports on an interactive global map, inspect detailed runway dimensions and ILS frequencies, generate realistic AIRAC routes with SIDs and STARs, and export native `.pln` flight plans with a single click.

---

## ✈️ Key Features

* **Interactive Global Map (Leaflet Dark Matter):** Fullscreen pan & zoom with airport markers, flight path polylines, and waypoint diamonds.
* **Runway & Compass Dial:** Rotating visual compass dial illustrating exact runway magnetic headings, lengths in feet/meters, surfaces, and ILS localizer frequencies.
* **Vertical Situation Display (VSD):** Terrain cross-section diagram showing climb to cruise (TOC), step descent (TOD), and safe terrain clearance.
* **Beginner-Friendly Help System:** Inline `(?)` tooltip badges explaining aviation acronyms (*SID*, *STAR*, *ILS*, *METAR*, *TOC*, *TOD*, *Cost Index*) in plain English.
* **Native MSFS 2024 `.pln` Exporter:** Produces standards-compliant `AceXML` files that load directly into the MSFS 2024 World Map or in-cockpit EFB.
* **SimBrief Integration (Approach A):** Connect your free SimBrief account or select from popular simulator city-pairs.

---

## 🚀 How to Load into MSFS 2024

1. Click **Export .PLN** to download your flight plan file.
2. Launch **Microsoft Flight Simulator 2024** and enter **Free Flight** (World Map).
3. Press <kbd>SPACE</kbd> (or click **More > Load Flight Plan**) and choose the downloaded `.pln` file.
4. Your departure runway, SID, cruising altitude, airway sequence, STAR, and ILS frequency are automatically programmed!

---

## 🛠️ Local Development

```bash
# Clone repository
git clone https://github.com/Amurut/Skyroute_Planner.git
cd Skyroute_Planner

# Install dependencies
npm install

# Start local development server
npm run dev
```

---

## 🌐 Deployment to GitHub Pages (`amurut.com`)

This project is configured with automated GitHub Actions (`.github/workflows/deploy.yml`). 

To activate GitHub Pages on the repo:
1. Go to your repository on GitHub: **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push to `main` — GitHub Actions will automatically build and deploy the app to:
   **`https://amurut.com/Skyroute_Planner/`**
