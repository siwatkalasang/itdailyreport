# Transportation Request WebApp

This repository contains a simple front-end web application for submitting and managing transportation requests for The Sands Khaolak and related hotels. The application integrates with a Google Apps Script to store and retrieve data from Google Sheets.

## Files
- `index.html` – main single-page application with Request form, HM approval, and export sections.
- `style.css` – blue and white theme styling.
- `script.js` – client side logic (form handling, Google Apps Script communication, charts).
- `google-app-script.gs` – sample Google Apps Script backend to copy into Google Apps Script.

## Usage
Open `index.html` in a browser. All interactions with data rely on the published Google Apps Script endpoint defined in `script.js`.
