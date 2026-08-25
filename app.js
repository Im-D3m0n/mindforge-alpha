/* ---------------------------------------------------------
   MindForge — in-memory app state
   (No backend / localStorage: everything lives here in JS.
   See README for how to add persistence once this is deployed.)
--------------------------------------------------------- */

let uidCounter = 1;
const uid = () => "id" + uidCounter++;

const todayISO = () => new Date().toISOString().slice(0, 10);

function addDays(dateStr, delta) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

const state = {
  tasks: [
    { id: uid(), title: "Finish Math worksheet", date: todayISO(), time: "16:00", priority: "high", done: false },
    { id: uid(), title: "Read Chapter 4 — Science", date: addDays(todayISO(), 1), time: "19:00", priority: "medium", done: false },
    { id: uid(), title: "Pack bag for CCA", date: todayISO(), time: "07:00", priority: "low", done: true },
  ],
  goals: [
    { id: uid(), title: "Score 80+ in Math mid-year", target: addDays(todayISO(), 30), progress: 45 },
    { id: uid(), title: "Read 5 books this term", target: addDays(todayISO(), 60), progress: 20 },
  ],
  resources: [
    { id: uid(), title: "Algebra basics — video series", subject: "Math", type: "Video", note: "Rewatch factorisation part" },
    { id: uid(), title: "Photosynthesis notes", subject: "Science", type: "Notes", note: "" },
    { id: uid(), title: "Essay structure guide", subject: "English", type: "Article", note: "" },
  ],
  habits: [
    { id: uid(), title: "Read for 20 min", history: {} },
    { id: uid(), title: "Revise flashcards", history: {} },
    { id: uid(), title: "Sleep before 10:30pm", history: {} },
  ],
};

// seed a bit of habit history so the demo isn't empty
(function seedHabits() {
  state.habits[0].history[addDays(todayISO(), -1)] = true;
  state.habits[0].history[addDays(todayISO(), -2)] = true;
  state.habits[1].history[addDays(todayISO(), -1)] = true;
  state.habits[2].history[addDays(todayISO(), -3)] = true;
})();

/* ---------------------------------------------------------
   Navigation
--------------------------------------------------------- */

function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  renderAll();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

document.querySelectorAll("[data-goto]").forEach((el) => {
  el.addEventListener("click", () => showView(el.dataset.goto));
});

/* ---------------------------------------------------------
   Render: everything
--------------------------------------------------------- */

function renderAll() {
  renderOverview();
  renderTasks();
  renderGoals();
  renderResources();
  renderHabits();
  renderDashboard();
  renderParent();
}

/* ---------- Overview ---------- */

function renderOverview() {
  const dueToday = state.tasks.filter((t) => t.date === todayISO() && !t.done).length;
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const avgGoal = state.goals.length
    ? Math.round(state.goals.reduce((s, g) => s + g.progress, 0) / state.goals.length)
    : 0;
  const bestStreak = state.habits.length ? Math.max(...state.habits.map(streakFor)) : 0;

  el("ov-due-today").textContent = dueToday;
  el("ov-open-tasks").textContent = openTasks;
  el("ov-goal-avg").textContent = avgGoal + "%";
  el("ov-best-streak").textContent = bestStreak + "d";
}

/* ---------- Planner ---------- */

const taskForm = document.getElementById("task-form");
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = el("task-title").value.trim();
  if (!title) return;
  state.tasks.push({
    id: uid(),
    title,
    date: el("task-date").value || todayISO(),
    time: el("task-time").value || "",
    priority: el("task-priority").value,
    done: false,
  });
  taskForm.reset();
  renderTasks();
  renderOverview();
  renderDashboard();
});

function renderTasks() {
  const list = el("task-list");
  const sorted = [...state.tasks].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (sorted.length === 0) {
    list.innerHTML = '<div class="empty-state">No tasks yet — add your first one above.</div>';
    return;
  }
  list.innerHTML = sorted
    .map(
      (t) => `
    <div class="item-row ${t.done ? "done" : ""}">
      <button class="item-check ${t.done ? "checked" : ""}" data-toggle-task="${t.id}" aria-label="Mark task complete"></button>
      <div class="item-body">
        <div class="item-title">${escapeHtml(t.title)}</div>
        <div class="item-sub">${formatDate(t.date)}${t.time ? " · " + t.time : ""}</div>
      </div>
      <span class="badge ${t.priority}">${t.priority}</span>
      <button class="btn-icon" data-del-task="${t.id}" aria-label="Delete task">✕</button>
    </div>`
    )
    .join("");
}

document.getElementById("task-list").addEventListener("click", (e) => {
  const t = e.target.dataset.toggleTask;
  const d = e.target.dataset.delTask;
  if (t) {
    const task = state.tasks.find((x) => x.id === t);
    task.done = !task.done;
    renderTasks();
    renderOverview();
    renderDashboard();
  }
  if (d) {
    state.tasks = state.tasks.filter((x) => x.id !== d);
    renderTasks();
    renderOverview();
    renderDashboard();
  }
});

/* ---------- Goals ---------- */

const goalForm = document.getElementById("goal-form");
goalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = el("goal-title").value.trim();
  if (!title) return;
  state.goals.push({
    id: uid(),
    title,
    target: el("goal-target").value || addDays(todayISO(), 30),
    progress: 0,
  });
  goalForm.reset();
  renderGoals();
  renderOverview();
  renderDashboard();
});

function renderGoals() {
  const list = el("goal-list");
  if (state.goals.length === 0) {
    list.innerHTML = '<div class="empty-state">No goals yet — set your first one above.</div>';
    return;
  }
  list.innerHTML = state.goals
    .map(
      (g) => `
    <div class="goal-card">
      <div class="goal-top">
        <div>
          <div class="item-title">${escapeHtml(g.title)}</div>
          <div class="item-sub">Target: ${formatDate(g.target)}</div>
        </div>
        <button class="btn-icon" data-del-goal="${g.id}" aria-label="Delete goal">✕</button>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${g.progress}%"></div></div>
      <div class="goal-controls">
        <button class="btn-ghost" style="padding:4px 10px" data-goal-adj="${g.id}:-10">−10</button>
        <span class="pct">${g.progress}%</span>
        <button class="btn-ghost" style="padding:4px 10px" data-goal-adj="${g.id}:10">+10</button>
      </div>
    </div>`
    )
    .join("");
}

document.getElementById("goal-list").addEventListener("click", (e) => {
  const adj = e.target.dataset.goalAdj;
  const del = e.target.dataset.delGoal;
  if (adj) {
    const [id, delta] = adj.split(":");
    const goal = state.goals.find((g) => g.id === id);
    goal.progress = Math.max(0, Math.min(100, goal.progress + Number(delta)));
    renderGoals();
    renderOverview();
    renderDashboard();
  }
  if (del) {
    state.goals = state.goals.filter((g) => g.id !== del);
    renderGoals();
    renderOverview();
    renderDashboard();
  }
});

/* ---------- Library ---------- */

let libraryFilter = "All";

const resourceForm = document.getElementById("resource-form");
resourceForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = el("resource-title").value.trim();
  if (!title) return;
  state.resources.push({
    id: uid(),
    title,
    subject: el("resource-subject").value.trim() || "General",
    type: el("resource-type").value,
    note: el("resource-note").value.trim(),
  });
  resourceForm.reset();
  renderResources();
  renderDashboard();
});

function renderResources() {
  const subjects = ["All", ...new Set(state.resources.map((r) => r.subject))];
  const filterRow = el("resource-filters");
  filterRow.innerHTML = subjects
    .map((s) => `<button class="chip ${s === libraryFilter ? "active" : ""}" data-filter="${escapeHtml(s)}">${escapeHtml(s)}</button>`)
    .join("");

  const list = el("resource-list");
  const shown = state.resources.filter((r) => libraryFilter === "All" || r.subject === libraryFilter);
  if (shown.length === 0) {
    list.innerHTML = '<div class="empty-state">No resources here yet — add one above.</div>';
    return;
  }
  list.innerHTML = shown
    .map(
      (r) => `
    <div class="item-row">
      <div class="item-body">
        <div class="item-title">${escapeHtml(r.title)}</div>
        <div class="item-sub">${escapeHtml(r.subject)}${r.note ? " · " + escapeHtml(r.note) : ""}</div>
      </div>
      <span class="resource-type">${escapeHtml(r.type)}</span>
      <button class="btn-icon" data-del-resource="${r.id}" aria-label="Delete resource">✕</button>
    </div>`
    )
    .join("");
}

el("resource-filters").addEventListener("click", (e) => {
  const f = e.target.dataset.filter;
  if (f) {
    libraryFilter = f;
    renderResources();
  }
});

el("resource-list").addEventListener("click", (e) => {
  const del = e.target.dataset.delResource;
  if (del) {
    state.resources = state.resources.filter((r) => r.id !== del);
    renderResources();
    renderDashboard();
  }
});

/* ---------- Habits ---------- */

const habitForm = document.getElementById("habit-form");
habitForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = el("habit-title").value.trim();
  if (!title) return;
  state.habits.push({ id: uid(), title, history: {} });
  habitForm.reset();
  renderHabits();
  renderDashboard();
});

function last7Days() {
  return [-6, -5, -4, -3, -2, -1, 0].map((d) => addDays(todayISO(), d));
}

function streakFor(habit) {
  let streak = 0;
  let cursor = todayISO();
  while (habit.history[cursor]) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function renderHabits() {
  const list = el("habit-list");
  if (state.habits.length === 0) {
    list.innerHTML = '<div class="empty-state">No habits yet — add one above.</div>';
    return;
  }
  const days = last7Days();
  list.innerHTML = state.habits
    .map((h) => {
      const dayBoxes = days
        .map((d) => {
          const filled = !!h.history[d];
          const isToday = d === todayISO();
          const label = new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "narrow" });
          return `<button class="day-box ${filled ? "filled" : ""} ${isToday ? "today" : ""}" data-habit-day="${h.id}:${d}" aria-label="${d}">${label}</button>`;
        })
        .join("");
      return `
      <div class="habit-row">
        <div class="habit-info">
          <div class="item-title">${escapeHtml(h.title)}</div>
          <div class="habit-streak">🔥 ${streakFor(h)}-day streak</div>
        </div>
        <div class="habit-days">${dayBoxes}</div>
        <button class="btn-icon" data-del-habit="${h.id}" aria-label="Delete habit">✕</button>
      </div>`;
    })
    .join("");
}

el("habit-list").addEventListener("click", (e) => {
  const day = e.target.dataset.habitDay;
  const del = e.target.dataset.delHabit;
  if (day) {
    const [id, date] = day.split(":");
    const habit = state.habits.find((h) => h.id === id);
    habit.history[date] = !habit.history[date];
    renderHabits();
    renderOverview();
    renderDashboard();
  }
  if (del) {
    state.habits = state.habits.filter((h) => h.id !== del);
    renderHabits();
    renderDashboard();
  }
});

/* ---------- Progress Dashboard ---------- */

function renderDashboard() {
  // task completion
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((t) => t.done).length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  el("dash-task-ring").textContent = taskPct + "%";
  el("dash-task-sub").textContent = `${doneTasks} of ${totalTasks} tasks complete`;

  // goals bar list
  el("dash-goals").innerHTML =
    state.goals
      .map(
        (g) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(truncate(g.title, 16))}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${g.progress}%"></div></div>
      <div class="bar-val">${g.progress}%</div>
    </div>`
      )
      .join("") || '<div class="empty-state">No goals yet.</div>';

  // habit streaks
  el("dash-habits").innerHTML =
    state.habits
      .map((h) => {
        const s = streakFor(h);
        const pct = Math.min(100, s * 15);
        return `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(truncate(h.title, 16))}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <div class="bar-val">${s}d</div>
      </div>`;
      })
      .join("") || '<div class="empty-state">No habits yet.</div>';

  // resources by subject
  const bySubject = {};
  state.resources.forEach((r) => (bySubject[r.subject] = (bySubject[r.subject] || 0) + 1));
  const maxCount = Math.max(1, ...Object.values(bySubject));
  el("dash-resources").innerHTML =
    Object.entries(bySubject)
      .map(
        ([subject, count]) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(subject)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(count / maxCount) * 100}%"></div></div>
      <div class="bar-val">${count}</div>
    </div>`
      )
      .join("") || '<div class="empty-state">No resources yet.</div>';
}

/* ---------- Parent Portal (read-only) ---------- */

function renderParent() {
  const totalTasks = state.tasks.length;
  const doneTasks = state.tasks.filter((t) => t.done).length;
  const avgGoal = state.goals.length
    ? Math.round(state.goals.reduce((s, g) => s + g.progress, 0) / state.goals.length)
    : 0;
  const bestStreak = state.habits.length ? Math.max(...state.habits.map(streakFor)) : 0;

  el("parent-tasks").textContent = `${doneTasks} / ${totalTasks} complete`;
  el("parent-goals").textContent = `${avgGoal}% average progress`;
  el("parent-streak").textContent = `${bestStreak}-day best streak`;
  el("parent-resources").textContent = `${state.resources.length} saved`;

  el("parent-goal-list").innerHTML = state.goals
    .map(
      (g) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(truncate(g.title, 18))}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${g.progress}%"></div></div>
      <div class="bar-val">${g.progress}%</div>
    </div>`
    )
    .join("") || '<div class="empty-state">No goals yet.</div>';
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/* set default date inputs to today, then first render */
el("task-date").value = todayISO();
el("goal-target").value = addDays(todayISO(), 30);
renderAll();
