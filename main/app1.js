(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const USERS_KEY = "codelib.users";
  const SESSION_KEY = "codelib.session";
  const SESSION_KEY_TEMP = "codelib.session.temp";
  const PREFS_KEY = "codelib.prefs";
  const SOLVES_KEY = "codelib.solves";
  const ACTIVITY_KEY = "codelib.activity";
  const LEARNING_KEY = "codelib.learning";
  const EXERCISES_KEY = "codelib.exercises";

  const safeJsonParse = (raw, fallback) => {
    try {
      if (raw == null) return fallback;
      const val = JSON.parse(raw);
      return val ?? fallback;
    } catch {
      return fallback;
    }
  };

  const normalizeEmail = (s) => String(s || "").trim().toLowerCase();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const dayKeyFromDate = (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return todayKey();
    return dt.toISOString().slice(0, 10);
  };
  const addDays = (ymd, delta) => {
    const dt = new Date(ymd + "T00:00:00");
    dt.setDate(dt.getDate() + delta);
    return dt.toISOString().slice(0, 10);
  };

  const getSession = () => {
    const persisted = safeJsonParse(localStorage.getItem(SESSION_KEY), null);
    if (persisted?.email) return persisted;
    const temp = safeJsonParse(sessionStorage.getItem(SESSION_KEY_TEMP), null);
    if (temp?.email) return temp;
    return null;
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY_TEMP);
  };

  const getUsers = () => {
    const list = safeJsonParse(localStorage.getItem(USERS_KEY), []);
    return Array.isArray(list) ? list : [];
  };

  const getScoped = (storageKey, email, fallback) => {
    const raw = safeJsonParse(localStorage.getItem(storageKey), {});
    if (!raw || typeof raw !== "object") return fallback;
    const v = raw[email];
    return v == null ? fallback : v;
  };

  const setScoped = (storageKey, email, value) => {
    const raw = safeJsonParse(localStorage.getItem(storageKey), {});
    const base = raw && typeof raw === "object" ? raw : {};
    base[email] = value;
    localStorage.setItem(storageKey, JSON.stringify(base));
  };

  const getToast = () => {
    const toastEl = $("#demoToast");
    if (!toastEl || !window.bootstrap?.Toast) return null;
    return window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1600 });
  };

  // Event delegation cho toast – chỉ đăng ký một lần
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('[data-toast="demo"]');
    if (trigger) {
      e.preventDefault();
      getToast()?.show();
    }
  });

  const session = getSession();
  if (!session) {
    window.location.replace("../Login and register/html/login.html");
    return;
  }

  const email = normalizeEmail(session.email);
  const users = getUsers();
  const me = users.find((u) => normalizeEmail(u.email) === email) || null;

  const name = String(me?.fullname || session.username || "Bạn học");
  const displayNameEl = $("#displayName");
  if (displayNameEl) displayNameEl.textContent = name;

  const roleEl = $("#roleText");
  if (roleEl) roleEl.textContent = "EXPERT MENTOR";

  const avatarText = (name.trim()[0] || "A").toUpperCase();
  const avatarEl = $("#avatarText");
  if (avatarEl) avatarEl.textContent = avatarText;

  const defaultPrefs = {
    lang: "Tuỳ chọn ngôn ngữ",
    goal: 500,
  };

  const getPrefs = () => {
    const p = getScoped(PREFS_KEY, email, defaultPrefs);
    return { ...defaultPrefs, ...(p && typeof p === "object" ? p : {}) };
  };
  const setPrefs = (next) => setScoped(PREFS_KEY, email, next);

  const getSolves = () => {
    const list = getScoped(SOLVES_KEY, email, []);
    return Array.isArray(list) ? list : [];
  };
  const setSolves = (list) => setScoped(SOLVES_KEY, email, list);

  const defaultLearning = {
    topics: [
      { id: "arrays", name: "Mảng", done: false, doneAt: null },
      { id: "strings", name: "Chuỗi", done: false, doneAt: null },
      { id: "linked-list", name: "Linked List", done: false, doneAt: null },
      { id: "stack-queue", name: "Stack & Queue", done: false, doneAt: null },
      { id: "tree", name: "Cây", done: false, doneAt: null },
      { id: "graph", name: "Đồ thị", done: false, doneAt: null },
      { id: "dp", name: "DP", done: false, doneAt: null },
    ],
    updatedAt: null,
  };

  const getLearning = () => {
    const raw = getScoped(LEARNING_KEY, email, defaultLearning);
    const obj = raw && typeof raw === "object" ? raw : defaultLearning;
    const topics = Array.isArray(obj.topics) ? obj.topics : defaultLearning.topics;
    return { ...defaultLearning, ...obj, topics };
  };
  const setLearning = (next) => setScoped(LEARNING_KEY, email, next);

  const defaultExercises = {
    attempts: 0,
    solvedAC: 0,
    updatedAt: null,
  };
  const getExercises = () => {
    const raw = getScoped(EXERCISES_KEY, email, defaultExercises);
    return { ...defaultExercises, ...(raw && typeof raw === "object" ? raw : {}) };
  };
  const setExercises = (next) => setScoped(EXERCISES_KEY, email, next);

  const getActivity = () => {
    const m = getScoped(ACTIVITY_KEY, email, {});
    return m && typeof m === "object" ? m : {};
  };
  const setActivity = (m) => setScoped(ACTIVITY_KEY, email, m);

  const bumpActivity = (ymd, inc = 1) => {
    const key = dayKeyFromDate(ymd);
    const map = getActivity();
    const cur = Number(map[key] || 0);
    map[key] = clamp(cur + inc, 0, 3);
    setActivity(map);
  };

  const computeStreaks = (activityMap) => {
    const today = todayKey();
    const has = (k) => Number(activityMap[k] || 0) > 0;
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const k = addDays(today, -i);
      if (!has(k)) break;
      streak++;
    }

    const keys = Object.keys(activityMap).filter((k) => has(k)).sort();
    let best = 0;
    let run = 0;
    let prev = "";
    for (const k of keys) {
      if (!prev) {
        run = 1;
      } else {
        const expected = addDays(prev, 1);
        run = expected === k ? run + 1 : 1;
      }
      best = Math.max(best, run);
      prev = k;
    }
    return { streak, bestStreak: best };
  };

  const computeAccuracy = (solves) => {
    const total = solves.length;
    if (total === 0) return 0;
    const ac = solves.filter((s) => s.status === "AC").length;
    return Math.round((ac / total) * 1000) / 10;
  };

  const difficultyPoints = (d) => (d === "Hard" ? 35 : d === "Medium" ? 20 : 10);

  const computeScore = (solves, streak) => {
    const base = 900;
    const solvedPts = solves
      .filter((s) => s.status === "AC")
      .reduce((acc, s) => acc + difficultyPoints(s.difficulty), 0);
    const attemptPts = Math.floor(solves.length * 2);
    const streakPts = streak * 6;
    return base + solvedPts + attemptPts + streakPts;
  };

  const rankFromScore = (score) => {
    const pct = clamp(60 - Math.floor((score - 900) / 120), 3, 45);
    return `Hạng: Top ${pct}% tháng này`;
  };

  // Helper an toàn khi gán text/style
  const safeSetText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  const safeSetStyle = (id, prop, value) => {
    const el = $(id);
    if (el) el.style[prop] = value;
  };

  const render = () => {
    const prefs = getPrefs();
    const solves = getSolves().slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const activity = getActivity();
    const { streak, bestStreak } = computeStreaks(activity);
    const accuracy = computeAccuracy(solves);
    const score = computeScore(solves, streak);
    const learning = getLearning();

    safeSetText("#langText", prefs.lang || defaultPrefs.lang);
    safeSetText("#targetCount", String(prefs.goal || defaultPrefs.goal));

    const solvedCount = solves.filter((s) => s.status === "AC").length;
    safeSetText("#solvedCount", String(solvedCount));
    safeSetText("#scoreText", score.toLocaleString("vi-VN"));
    safeSetText("#rankText", rankFromScore(score));

    const goal = Number(prefs.goal || defaultPrefs.goal);
    const pct = goal > 0 ? clamp(Math.round((solvedCount / goal) * 100), 0, 100) : 0;
    safeSetStyle("#solvedProgress", "width", pct + "%");
    const progressEl = $("#solvedProgress");
    if (progressEl) progressEl.setAttribute("aria-valuenow", String(pct));

    safeSetText("#streakText", `${streak} Ngày lửa`);
    safeSetText("#bestStreakText", `${bestStreak} Ngày`);
    safeSetText("#accuracyText", String(accuracy));

    // Tiến trình học
    const topics = Array.isArray(learning.topics) ? learning.topics : [];
    const doneCount = topics.filter((t) => !!t?.done).length;
    const totalCount = topics.length || 0;
    const learnPct = totalCount > 0 ? clamp(Math.round((doneCount / totalCount) * 100), 0, 100) : 0;
    safeSetText("#learnPct", String(learnPct));
    safeSetStyle("#learnProgress", "width", learnPct + "%");
    safeSetText("#learnMeta", totalCount > 0 ? `${doneCount}/${totalCount} chủ đề` : "—");

    // Danh sách bài gần đây
    const recentList = $("#recentList");
    if (recentList) {
      recentList.innerHTML = "";
      const top = solves.slice(0, 6);
      if (top.length === 0) {
        const empty = document.createElement("div");
        empty.className = "text-secondary small";
        empty.textContent = "Chưa có bài nào. Bấm “Thêm bài” để bắt đầu ghi lại tiến độ.";
        recentList.appendChild(empty);
      } else {
        top.forEach((s) => {
          const a = document.createElement("a");
          a.href = "#";
          a.className = "codelib-recent-item";
          a.setAttribute("data-toast", "demo");
          const badge =
            s.status === "AC"
              ? `<span class="codelib-badge good"><i class="fa-solid fa-check"></i>AC</span>`
              : `<span class="codelib-badge bad"><i class="fa-solid fa-xmark"></i>WA</span>`;
          a.innerHTML = `
            <div class="d-flex flex-column">
              <div class="d-flex align-items-center gap-2">
                <span class="text-secondary"><i class="fa-regular fa-circle-play"></i></span>
                <span class="fw-semibold">${escapeHtml(s.title)}</span>
              </div>
              <div class="d-flex align-items-center gap-2 mt-1">
                <span class="text-secondary small">${escapeHtml(s.lang)} • ${escapeHtml(s.difficulty)} • ${escapeHtml(s.date)}</span>
              </div>
            </div>
            ${badge}
          `;
          recentList.appendChild(a);
        });
      }
    }

    // Heatmap: ✓ nếu có hoạt động, - nếu không
    const heatmap = $("#heatmap");
    if (heatmap) {
      heatmap.innerHTML = "";
      const dots = window.matchMedia("(max-width: 575.98px)").matches ? 72 : 108;
      const end = todayKey();
      const start = addDays(end, -(dots - 1));
      for (let i = 0; i < dots; i++) {
        const k = addDays(start, i);
        const val = Number(activity[k] || 0);
        let levelClass = "";
        let text = "-";
        let bgClass = "no-activity";
        if (val >= 1) {
          text = "✓";
          bgClass = "";
          if (val >= 3) levelClass = "lv3";
          else if (val >= 2) levelClass = "lv2";
          else levelClass = "lv1";
        }
        const div = document.createElement("div");
        div.className = `codelib-dot ${bgClass} ${levelClass}`.replace(/\s+/g, " ").trim();
        div.textContent = text;
        div.title = `${k}: ${val}/3`;
        heatmap.appendChild(div);
      }
    }
  };

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  // Khởi tạo modal
  const solveModalEl = $("#solveModal");
  const langModalEl = $("#langModal");
  const solveModal = solveModalEl && window.bootstrap?.Modal ? new window.bootstrap.Modal(solveModalEl) : null;
  const langModal = langModalEl && window.bootstrap?.Modal ? new window.bootstrap.Modal(langModalEl) : null;

  const setSolveFormToday = () => {
    const form = $("#solveForm");
    if (form) form.date.value = todayKey();
  };

  $("#openAddSolveBtn")?.addEventListener("click", () => {
    setSolveFormToday();
    solveModal?.show();
  });

  $("#solveForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = String(form.title?.value ?? "").trim();
    const lang = String(form.lang?.value ?? "").trim();
    const difficulty = String(form.difficulty?.value ?? "Medium").trim();
    const status = String(form.status?.value ?? "AC").trim();
    const date = dayKeyFromDate(form.date?.value ?? todayKey());

    if (!title) return;
    const list = getSolves();
    list.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(16).slice(2),
      title,
      lang,
      difficulty,
      status: status === "WA" ? "WA" : "AC",
      date,
      createdAt: Date.now(),
    });
    setSolves(list);

    const ex = getExercises();
    const isAc = status !== "WA";
    setExercises({
      ...ex,
      attempts: Number(ex.attempts || 0) + 1,
      solvedAC: Number(ex.solvedAC || 0) + (isAc ? 1 : 0),
      updatedAt: Date.now(),
    });

    // Luôn tăng 1 để hiển thị đúng trên heatmap
    bumpActivity(date, 1);
    solveModal?.hide();
    form.reset();
    render();
  });

  const renderLangChoices = () => {
    const holder = $("#langChoices");
    if (!holder) return;
    holder.innerHTML = "";
    const options = ["Tuỳ chọn ngôn ngữ", "C++", "Python", "Java", "Pascal"];
    const prefs = getPrefs();
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-outline-light d-flex align-items-center justify-content-between";
      btn.innerHTML = `<span>${escapeHtml(opt)}</span>${prefs.lang === opt ? '<i class="fa-solid fa-check"></i>' : ""}`;
      btn.addEventListener("click", () => {
        setPrefs({ ...prefs, lang: opt });
        langModal?.hide();
        render();
      });
      holder.appendChild(btn);
    });
  };

  $("#openLangBtn")?.addEventListener("click", () => {
    renderLangChoices();
    langModal?.show();
  });

  $("#openAllBtn")?.addEventListener("click", () => {
    getToast()?.show();
  });

  $("#completeTopicBtn")?.addEventListener("click", () => {
    const learning = getLearning();
    const topics = Array.isArray(learning.topics) ? learning.topics.slice() : [];
    const idx = topics.findIndex((t) => t && !t.done);
    if (idx === -1) {
      getToast()?.show();
      return;
    }
    topics[idx] = { ...topics[idx], done: true, doneAt: Date.now() };
    setLearning({ ...learning, topics, updatedAt: Date.now() });
    bumpActivity(todayKey(), 1);
    render();
  });

  bumpActivity(todayKey(), 1);
  render();

  $("#logoutBtn")?.addEventListener("click", () => {
    clearSession();
    window.location.href = "../Login and register/html/login.html";
  });
})();