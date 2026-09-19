
(() => {
  const STORAGE_KEY = "blunderTracker.v1";
  const LAST_ACTION_KEY = "blunderTracker.lastAction.v1";

  const $ = (id) => document.getElementById(id);

  const els = {
    todayLabel: $("todayLabel"),
    tCount: $("tCount"),
    aCount: $("aCount"),
    tPlus: $("tPlus"),
    aPlus: $("aPlus"),
    tMinus: $("tMinus"),
    aMinus: $("aMinus"),
    undoBtn: $("undoBtn"),
    totalToday: $("totalToday"),
    rangeSelect: $("rangeSelect"),
    canvas: $("trendChart"),
    emptyChart: $("emptyChart"),
    historyList: $("historyList"),
    exportBtn: $("exportBtn"),
    installBtn: $("installBtn")
  };

  function localDateKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function loadData() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getLastAction() {
    try {
      return JSON.parse(sessionStorage.getItem(LAST_ACTION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function setLastAction(action) {
    if (action) sessionStorage.setItem(LAST_ACTION_KEY, JSON.stringify(action));
    else sessionStorage.removeItem(LAST_ACTION_KEY);
  }

  let data = loadData();
  let todayKey = localDateKey();

  function ensureToday() {
    const current = localDateKey();
    if (current !== todayKey) {
      todayKey = current;
      setLastAction(null);
    }
    if (!data[todayKey]) {
      data[todayKey] = { T: 0, A: 0 };
      saveData(data);
    }
  }

  function change(type, delta) {
    ensureToday();
    const before = data[todayKey][type] || 0;
    const after = Math.max(0, before + delta);
    if (after === before) return;

    data[todayKey][type] = after;
    saveData(data);
    setLastAction({ date: todayKey, type, before, after });
    render();
    if (navigator.vibrate) navigator.vibrate(15);
  }

  function undoLast() {
    const action = getLastAction();
    if (!action || !data[action.date]) return;
    data[action.date][action.type] = action.before;
    saveData(data);
    setLastAction(null);
    render();
  }

  function formatFullDate(key) {
    return parseDateKey(key).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function formatShortDate(key) {
    return parseDateKey(key).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short"
    });
  }

  function getSortedKeys() {
    return Object.keys(data).sort();
  }

  function getRangeKeys() {
    const keys = getSortedKeys();
    const value = els.rangeSelect.value;
    if (value === "all") return keys;
    return keys.slice(-Number(value));
  }

  function drawChart() {
    const canvas = els.canvas;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 700;
    const cssHeight = 260;

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const keys = getRangeKeys();
    const rows = keys.map(k => ({ date: k, T: data[k].T || 0, A: data[k].A || 0 }));

    const styles = getComputedStyle(document.documentElement);
    const border = styles.getPropertyValue("--border").trim();
    const muted = styles.getPropertyValue("--muted").trim();
    const tColor = styles.getPropertyValue("--t").trim();
    const aColor = styles.getPropertyValue("--a").trim();

    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (rows.length < 2) {
      els.emptyChart.classList.remove("hidden");
      canvas.classList.add("hidden");
      return;
    }

    els.emptyChart.classList.add("hidden");
    canvas.classList.remove("hidden");

    const pad = { left: 34, right: 12, top: 18, bottom: 34 };
    const w = cssWidth - pad.left - pad.right;
    const h = cssHeight - pad.top - pad.bottom;

    const maxVal = Math.max(1, ...rows.flatMap(r => [r.T, r.A]));
    const yMax = Math.max(4, Math.ceil(maxVal / 2) * 2);

    ctx.lineWidth = 1;
    ctx.strokeStyle = border;
    ctx.fillStyle = muted;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
      const value = Math.round((yMax * i) / 4);
      const y = pad.top + h - (h * i / 4);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + w, y);
      ctx.stroke();
      ctx.fillText(String(value), pad.left - 7, y);
    }

    const xFor = (i) => pad.left + (rows.length === 1 ? w / 2 : (w * i / (rows.length - 1)));
    const yFor = (value) => pad.top + h - (value / yMax) * h;

    function lineFor(key, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      rows.forEach((r, i) => {
        const x = xFor(i);
        const y = yFor(r[key]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = color;
      rows.forEach((r, i) => {
        const x = xFor(i);
        const y = yFor(r[key]);
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    lineFor("T", tColor);
    lineFor("A", aColor);

    const maxLabels = cssWidth < 460 ? 4 : 7;
    const step = Math.max(1, Math.ceil(rows.length / maxLabels));
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    rows.forEach((r, i) => {
      if (i % step !== 0 && i !== rows.length - 1) return;
      ctx.fillText(formatShortDate(r.date), xFor(i), pad.top + h + 10);
    });
  }

  function renderHistory() {
    const keys = getSortedKeys().slice(-10).reverse();
    els.historyList.innerHTML = "";

    keys.forEach((key) => {
      const row = document.createElement("div");
      row.className = "history-row";

      const date = document.createElement("div");
      date.className = "history-date";

      const strong = document.createElement("strong");
      strong.textContent = key === todayKey ? "Today" : formatShortDate(key);

      const sub = document.createElement("span");
      sub.textContent = parseDateKey(key).toLocaleDateString(undefined, { weekday: "short" });

      date.append(strong, sub);

      const t = document.createElement("div");
      t.className = "pill t";
      t.textContent = `T ${data[key].T || 0}`;

      const a = document.createElement("div");
      a.className = "pill a";
      a.textContent = `A ${data[key].A || 0}`;

      row.append(date, t, a);
      els.historyList.appendChild(row);
    });
  }

  function render() {
    ensureToday();
    const today = data[todayKey];

    els.todayLabel.textContent = formatFullDate(todayKey);
    els.tCount.textContent = today.T || 0;
    els.aCount.textContent = today.A || 0;
    els.totalToday.textContent = (today.T || 0) + (today.A || 0);
    els.undoBtn.disabled = !getLastAction();

    renderHistory();
    requestAnimationFrame(drawChart);
  }

  function exportCsv() {
    const keys = getSortedKeys();
    const rows = [["Date", "T", "A", "Total"]];
    keys.forEach(k => {
      const t = data[k].T || 0;
      const a = data[k].A || 0;
      rows.push([k, t, a, t + a]);
    });

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `blunder-tracker-${todayKey}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  els.tPlus.addEventListener("click", () => change("T", 1));
  els.aPlus.addEventListener("click", () => change("A", 1));
  els.tMinus.addEventListener("click", () => change("T", -1));
  els.aMinus.addEventListener("click", () => change("A", -1));
  els.undoBtn.addEventListener("click", undoLast);
  els.rangeSelect.addEventListener("change", drawChart);
  els.exportBtn.addEventListener("click", exportCsv);
  window.addEventListener("resize", () => requestAnimationFrame(drawChart));

  let deferredInstallPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBtn.classList.remove("hidden");
  });

  els.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installBtn.classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }

  setInterval(() => {
    if (localDateKey() !== todayKey) {
      todayKey = localDateKey();
      render();
    }
  }, 60_000);

  render();
})();
