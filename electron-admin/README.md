# Photo Memory Admin Electron

This is a desktop wrapper around the same dashboard in `../dashboard/index.html`.

It adds:

- a persistent Photo Memory admin webview
- a side ChatGPT browser
- local daily challenge image-folder scanning
- image import into `content/daily-challenges/images/YYYY/mon/day.png`
- ChatGPT prompt sending for image generation and question JSON
- timed queues for creating multiple daily challenges while the app is open
- local challenge JSON files in `content/daily-challenges/challenges/YYYY/mon/day.json`

Install and run:

```bash
npm install
npm start
```

The generator uses the ChatGPT webview, not an API. The app sends prompts into the browser, tries to capture the latest generated image/question answer, and also watches downloads so generated images can be saved into the correct date folder.

For ChatGPT login, sign in inside the ChatGPT pane. The pane uses a persistent Chromium session, like the working multi-session Electron app. Opening a half-finished Google OAuth URL in Chrome can split the flow and cause `client_id_not_found_in_session`; the Chrome button is only a separate browser fallback.
