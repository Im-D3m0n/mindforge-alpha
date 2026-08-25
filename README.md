# MindForge

A working web app version of the MindForge concept — plain HTML/CSS/JS, no build step, no dependencies. Every feature from the original mock is functional:

| Feature | What you can do |
|---|---|
| 📅 Smart Planner | Add tasks with a date, time, and priority; tick them off; delete them |
| 🎯 Goal Manager | Set goals with a target date; nudge progress up/down with a live progress bar |
| 📚 Study Resource Library | Save notes/videos/articles/links by subject; filter by subject |
| 🏆 Habit Tracker | Check off habits day by day; see a running streak count |
| 📈 Progress Dashboard | Rolled-up view of task completion, goal progress, habit streaks, and library size |
| 👨‍👩‍👧 Parent Portal | Read-only summary view — no editing controls |

## Files

- `index.html` — page structure and all six views
- `style.css` — all styling
- `app.js` — app state and all interactivity

## Run it locally

Just open `index.html` in a browser — no server or install step needed.

## ⚠️ About data persistence

Right now all data lives in memory (a JS object) and resets on page refresh — it comes pre-loaded with a few sample tasks/goals/habits so it's not empty on first load. This keeps the app dependency-free and simple to read.

If you want data to actually save between visits once it's live on GitHub Pages, the easiest upgrade is `localStorage`:

```js
// near the top of app.js, after `const state = {...}`
const saved = localStorage.getItem("mindforge-state");
if (saved) Object.assign(state, JSON.parse(saved));

// call this at the end of every render function (or after every state change)
function save() {
  localStorage.setItem("mindforge-state", JSON.stringify(state));
}
```

Happy to wire this in for you if you'd like — just ask.

## Push to GitHub

```bash
git init
git add .
git commit -m "MindForge app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Publish with GitHub Pages

1. Push the repo to GitHub (steps above).
2. On GitHub: **Settings → Pages**.
3. Under **Source**, pick the `main` branch, `/ (root)` folder, then **Save**.
4. Live at `https://<your-username>.github.io/<your-repo>/` after a minute or two.

## Customizing

- Colors and spacing: CSS variables at the top of `style.css` (`--purple`, `--card-bg`, `--radius`, etc.)
- Sample starter data: the `state` object near the top of `app.js`
- Add a new nav section: copy a `<section class="view">` block in `index.html`, add a matching `<button class="nav-item">` in the sidebar, and add render/event-listener logic in `app.js`
