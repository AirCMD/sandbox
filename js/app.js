/* ============================================
   Точка входу Вітерця
   ============================================ */


/* ---- Звуки тем (Web Audio, без файлів) + lite-бульбашки ---- */
const ThemeSFX = {
  ctx: null,
  lastTheme: null,
  enabled: localStorage.getItem("viterecz_sfx") !== "0",
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  /** М'який тон при зміні теми — коротко, тихо */
  playTheme(themeClass) {
    if (!this.enabled || themeClass === this.lastTheme) return;
    this.lastTheme = themeClass;
    const ctx = this.ensure();
    if (!ctx) return;
    const map = {
      "theme-pink": [523, 659],
      "theme-green": [392, 523],
      "theme-silver": [440, 554],
      "theme-blue": [349, 440],
      "theme-cyan": [587, 740],
      "theme-red": [220, 277],
      "theme-yellow": [466, 622],
      "theme-black": [180, 220],
      "theme-purple": [311, 392],
      "theme-orange": [494, 622]
    };
    const freqs = map[themeClass] || [440, 554];
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.04, t0 + 0.04 + i * 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55 + i * 0.08);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0 + i * 0.07);
      o.stop(t0 + 0.7 + i * 0.1);
    });
  },
  softClick() {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.03;
    o.connect(g);
    g.connect(ctx.destination);
    const t0 = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    o.start(t0);
    o.stop(t0 + 0.09);
  }
};

function initAeroPerf() {
  const box = document.getElementById("aero-bubbles");
  if (!box) return;
  // слабкий пристрій / мало ядер / save-data → lite
  const cores = navigator.hardwareConcurrency || 2;
  const save = navigator.connection && navigator.connection.saveData;
  const mem = navigator.deviceMemory || 4;
  if (cores <= 4 || mem <= 4 || save || window.matchMedia("(max-width: 900px)").matches) {
    box.classList.add("lite");
  }
  document.addEventListener("visibilitychange", () => {
    box.classList.toggle("paused", document.hidden);
  });
  // клік увімкне audio context (політика браузера)
  document.body.addEventListener("click", () => ThemeSFX.ensure(), { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  // Єдиний персонаж гравця — Яні Куронеко
  UI.playerId = "yani";
  localStorage.setItem("viterecz_player", "yani");
  engine.state.yani.online = true;
  const selectModal = document.getElementById("character-select");
  if (selectModal) selectModal.hidden = true;
  UI.applyTheme();
  UI.refreshAll();
  initAeroPerf();

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => UI.switchView(btn.dataset.view));
  });

  document.querySelectorAll(".profile-tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".profile-tabs .tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      UI.renderProfileTab(tab.dataset.tab);
    });
  });

  const searchPosts = document.getElementById("search-posts");
  if (searchPosts) {
    let t;
    searchPosts.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => UI.renderFeed(searchPosts.value.trim()), 200);
    });
  }

  const searchPeople = document.getElementById("search-people");
  if (searchPeople) {
    let t2;
    searchPeople.addEventListener("input", () => {
      clearTimeout(t2);
      t2 = setTimeout(() => UI.renderMessagesList(searchPeople.value.trim()), 200);
    });
  }

  document.getElementById("modal-close").onclick = () => {
    document.getElementById("gallery-modal").hidden = true;
  };
  document.getElementById("gallery-modal").onclick = (e) => {
    if (e.target.id === "gallery-modal") e.target.hidden = true;
  };

  setInterval(() => {
    if (UI.playerId) {
      UI.applyTheme();
      UI.renderMePanel();
      UI.renderOnlineFriends();
    }
  }, 12000);

  setInterval(() => {
    if (UI.playerId && Math.random() > 0.65) {
      engine.maybeAutoPost(UI.playerId);
      if (document.getElementById("view-feed").classList.contains("active")) {
        UI.renderFeed(document.getElementById("search-posts")?.value);
      }
    }
  }, 50000);
});
