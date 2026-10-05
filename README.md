# NYGCI Schedule Plot

React + Vite static app. No Next.js, server, or database service is required.

## Run locally

Use Node.js 22 LTS or newer supported LTS.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. To verify the release:

```sh
npm test
npm run build
npm run preview
```

## Features

- Monthly Sunday-to-Saturday calendar with previous/next month and Today navigation.
- Click any date: RTO, WFH, HOLIDAY, LEAVE, CLEAR, CANCEL.
- CLEAR removes the selected plot; CANCEL and Escape close without changes.
- The text download starts with the month title (such as `October 2026`), followed by `Week,Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday` and numbered weekly rows.
- Cells contain only the plotted status or `UNP` (Unplotted). Dates outside the displayed month use `---` (Not part of the month). All weeks are included, including partial weeks with weekend dates; rows are numbered from Week 1.
- A legend beneath the text schedule explains RTO, WFH, UNP, ---, HOLIDAY, and LEAVE.
- JSON export backs up all months. Import merges entries and replaces matching dates.

## JSON and saving

`public/data/schedule.json` is the bundled starting schedule. It begins empty:

```json
{}
```

You can populate it like this:

```json
{
  "2026-10-05": "RTO",
  "2026-10-06": "WFH"
}
```

The app reads this file when there is no browser-saved schedule. Edits save automatically in localStorage on that browser and origin. Clearing browser data removes these edits, so use Export JSON for backups. Browser edits are not sent to GitHub and cannot rewrite the hosted JSON. There are no accounts or cross-device synchronization.

To change the shared starting schedule, export JSON, replace `public/data/schedule.json`, commit and push. Browsers with saved schedules keep their own copy; they can import the updated JSON (merge) or clear this app's browser storage to reload the bundled file. The bundled file is publicly readable on a public website, so include only data intended for publication.

## GitHub Pages deployment

1. Create a GitHub repository named `nygci.schedule_plot` and push this project's files to its `main` branch.
2. In the repository, select Settings > Pages > Build and deployment > Source > GitHub Actions.
3. Run the included Deploy GitHub Pages workflow, or push to `main`.
4. When the workflow succeeds, open the URL shown in its deployment output.

The workflow installs locked dependencies, tests, builds, and publishes `dist/`. Vite uses relative asset paths so repository subdirectory hosting works. This project has no remote configured and has not been published by this task.

For another static host, set the build command to `npm run build` and the publish directory to `dist`.

## Text download

The only schedule download is a .txt file containing the exact comma-separated CSV layout, including the month title, workweeks, a blank line, and legends. Open it directly in Notepad. JSON import/export remains available for backups.


## Copy to Teams

The read-only schedule text area updates with your selected month and plotted days. Copy text copies the same comma-separated content as the .txt download. Paste it into your Teams chat and send manually. If clipboard access is unavailable, the app selects the text for manual copying.
