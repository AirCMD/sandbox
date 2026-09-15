/* ============================================
   Крафт — редактор текстів (діалоги, коментарі,
   статуси, чат). Збереження в localStorage.
   ============================================ */

const ContentCraft = {
  KEY: "viterecz_craft_v1",
  data: null,
  defaults: null,
  section: "dialogs",

  deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  },

  buildDefaults() {
    return {
      specialDialogs: this.deepClone(typeof SPECIAL_DIALOGS !== "undefined" ? SPECIAL_DIALOGS : {}),
      statusByChar: this.deepClone(typeof STATUS_BY_CHAR !== "undefined" ? STATUS_BY_CHAR : {}),
      statusCommonF: this.deepClone(typeof STATUS_COMMON_F !== "undefined" ? STATUS_COMMON_F : []),
      statusCommonM: this.deepClone(typeof STATUS_COMMON_M !== "undefined" ? STATUS_COMMON_M : []),
      thoughts: this.deepClone(typeof THOUGHTS !== "undefined" ? THOUGHTS : {}),
      commentReactions: this.deepClone(typeof COMMENT_REACTIONS !== "undefined" ? COMMENT_REACTIONS : []),
      commentGeneric: this.deepClone(typeof COMMENT_GENERIC !== "undefined" ? COMMENT_GENERIC : []),
      commentByRel: this.deepClone(typeof COMMENT_BY_REL !== "undefined" ? COMMENT_BY_REL : {}),
      chatCraft: this.deepClone(typeof CHAT_CRAFT !== "undefined" ? CHAT_CRAFT : {})
    };
  },

  init() {
    this.defaults = this.buildDefaults();
    let saved = null;
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (_) {}
    this.data = saved ? this.merge(this.defaults, saved) : this.deepClone(this.defaults);
    this.apply();
  },

  merge(base, over) {
    const out = this.deepClone(base);
    if (!over || typeof over !== "object") return out;
    Object.keys(over).forEach(k => {
      if (over[k] !== undefined) out[k] = over[k];
    });
    return out;
  },

  /** Підставляє крафт у глобальні структури, які читають боти */
  apply() {
    const d = this.data;
    if (!d) return;

    if (typeof SPECIAL_DIALOGS !== "undefined") {
      Object.keys(SPECIAL_DIALOGS).forEach(k => delete SPECIAL_DIALOGS[k]);
      Object.assign(SPECIAL_DIALOGS, this.deepClone(d.specialDialogs || {}));
    }
    if (typeof STATUS_BY_CHAR !== "undefined") {
      Object.keys(STATUS_BY_CHAR).forEach(k => delete STATUS_BY_CHAR[k]);
      Object.assign(STATUS_BY_CHAR, this.deepClone(d.statusByChar || {}));
    }
    if (typeof STATUS_COMMON_F !== "undefined") {
      STATUS_COMMON_F.length = 0;
      (d.statusCommonF || []).forEach(x => STATUS_COMMON_F.push(x));
    }
    if (typeof STATUS_COMMON_M !== "undefined") {
      STATUS_COMMON_M.length = 0;
      (d.statusCommonM || []).forEach(x => STATUS_COMMON_M.push(x));
    }
    if (typeof THOUGHTS !== "undefined") {
      Object.keys(THOUGHTS).forEach(k => delete THOUGHTS[k]);
      Object.assign(THOUGHTS, this.deepClone(d.thoughts || {}));
    }
    if (typeof COMMENT_REACTIONS !== "undefined") {
      COMMENT_REACTIONS.length = 0;
      (d.commentReactions || []).forEach(x => COMMENT_REACTIONS.push(x));
    }
    if (typeof COMMENT_GENERIC !== "undefined") {
      COMMENT_GENERIC.length = 0;
      (d.commentGeneric || []).forEach(x => COMMENT_GENERIC.push(x));
    }
    if (typeof COMMENT_BY_REL !== "undefined") {
      Object.keys(COMMENT_BY_REL).forEach(k => delete COMMENT_BY_REL[k]);
      Object.assign(COMMENT_BY_REL, this.deepClone(d.commentByRel || {}));
    }
    if (typeof CHAT_CRAFT !== "undefined") {
      Object.keys(CHAT_CRAFT).forEach(k => delete CHAT_CRAFT[k]);
      Object.assign(CHAT_CRAFT, this.deepClone(d.chatCraft || {}));
    }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {
      alert("Не вдалося зберегти: " + e.message);
      return false;
    }
    this.apply();
    return true;
  },

  reset() {
    this.data = this.deepClone(this.defaults);
    localStorage.removeItem(this.KEY);
    this.apply();
  },

  exportText() {
    return JSON.stringify(this.data, null, 2);
  },

  importText(str) {
    const parsed = JSON.parse(str);
    this.data = this.merge(this.defaults, parsed);
    this.save();
  },

  linesToArr(text) {
    return (text || "")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
  },

  arrToLines(arr) {
    return (arr || []).join("\n");
  }
};

/* ---- UI редактора ---- */
const CraftUI = {
  currentKey: null,

  open() {
    if (!ContentCraft.data) ContentCraft.init();
    this.renderShell();
    this.showSection(ContentCraft.section || "dialogs");
  },

  renderShell() {
    const root = document.getElementById("craft-root");
    if (!root) return;
    root.innerHTML = `
      <div class="craft-toolbar glass">
        <button type="button" class="btn" data-craft-sec="dialogs">Діалоги</button>
        <button type="button" class="btn" data-craft-sec="comments">Коментарі</button>
        <button type="button" class="btn" data-craft-sec="reactions">Ключі реакцій</button>
        <button type="button" class="btn" data-craft-sec="statuses">Статуси</button>
        <button type="button" class="btn" data-craft-sec="thoughts">Думки</button>
        <button type="button" class="btn" data-craft-sec="chat">Чат</button>
        <button type="button" class="btn" data-craft-sec="import">Імпорт/експорт</button>
      </div>
      <p class="craft-hint glass">Один рядок = одна репліка. Збережи — боти одразу читають нові тексти. Галерею можна пізніше замінити з емодзі на картинки.</p>
      <div id="craft-body" class="craft-body"></div>
      <div class="craft-actions glass">
        <button type="button" class="btn" id="craft-save">💾 Зберегти</button>
        <button type="button" class="btn-danger" id="craft-reset">Скинути до заводських</button>
        <span id="craft-msg" style="font-size:0.85rem;margin-left:8px"></span>
      </div>
    `;
    root.querySelectorAll("[data-craft-sec]").forEach(btn => {
      btn.onclick = () => this.showSection(btn.dataset.craftSec);
    });
    document.getElementById("craft-save").onclick = () => {
      this.collectFromForm();
      if (ContentCraft.save()) {
        const m = document.getElementById("craft-msg");
        if (m) m.textContent = "Збережено ✓";
        setTimeout(() => { if (m) m.textContent = ""; }, 2000);
      }
    };
    document.getElementById("craft-reset").onclick = () => {
      if (!confirm("Скинути всі крафтові тексти до заводських?")) return;
      ContentCraft.reset();
      this.showSection(ContentCraft.section);
      const m = document.getElementById("craft-msg");
      if (m) m.textContent = "Скинуто";
    };
  },

  showSection(sec) {
    ContentCraft.section = sec;
    const body = document.getElementById("craft-body");
    if (!body) return;
    document.querySelectorAll("[data-craft-sec]").forEach(b => {
      b.classList.toggle("active", b.dataset.craftSec === sec);
    });
    if (sec === "dialogs") this.renderDialogs(body);
    else if (sec === "comments") this.renderComments(body);
    else if (sec === "reactions") this.renderReactions(body);
    else if (sec === "statuses") this.renderStatuses(body);
    else if (sec === "thoughts") this.renderThoughts(body);
    else if (sec === "chat") this.renderChat(body);
    else if (sec === "import") this.renderImport(body);
  },

  charName(id) {
    const c = typeof CHARACTERS !== "undefined" ? CHARACTERS.find(x => x.id === id) : null;
    return c ? c.name : id;
  },

  renderDialogs(body) {
    const dialogs = ContentCraft.data.specialDialogs || {};
    const keys = Object.keys(dialogs).sort();
    if (!this.currentKey || !dialogs[this.currentKey]) this.currentKey = keys[0] || null;

    const options = keys.map(k => {
      const [a, b] = k.split("_");
      return `<option value="${k}" ${k === this.currentKey ? "selected" : ""}>${this.charName(a)} → ${this.charName(b)} (${k})</option>`;
    }).join("");

    body.innerHTML = `
      <div class="craft-panel glass">
        <label>Пара персонажів</label>
        <select id="craft-dialog-key" class="craft-select">${options || "<option>—</option>"}</select>
        <label style="margin-top:10px">Репліки (по одному рядку)</label>
        <textarea id="craft-dialog-text" class="craft-ta" rows="12">${ContentCraft.arrToLines(dialogs[this.currentKey] || [])}</textarea>
        <p class="craft-note">Нова пара: вкажи ключ <code>id1_id2</code> (наприклад <code>yani_giki</code>) і натисни «Додати пару».</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <input type="text" id="craft-new-pair" class="craft-input" placeholder="yani_giki">
          <button type="button" class="btn" id="craft-add-pair">Додати пару</button>
        </div>
      </div>
    `;
    const sel = document.getElementById("craft-dialog-key");
    sel.onchange = () => {
      this.collectDialogsSoft();
      this.currentKey = sel.value;
      document.getElementById("craft-dialog-text").value =
        ContentCraft.arrToLines(ContentCraft.data.specialDialogs[this.currentKey] || []);
    };
    document.getElementById("craft-add-pair").onclick = () => {
      const k = (document.getElementById("craft-new-pair").value || "").trim().toLowerCase();
      if (!/^[a-z]+_[a-z]+$/.test(k)) {
        alert("Формат: id1_id2 латиницею, наприклад yani_jini");
        return;
      }
      if (!ContentCraft.data.specialDialogs[k]) ContentCraft.data.specialDialogs[k] = [];
      this.currentKey = k;
      this.renderDialogs(body);
    };
  },

  collectDialogsSoft() {
    const key = document.getElementById("craft-dialog-key")?.value;
    const ta = document.getElementById("craft-dialog-text");
    if (key && ta) ContentCraft.data.specialDialogs[key] = ContentCraft.linesToArr(ta.value);
  },

  renderComments(body) {
    const gen = ContentCraft.data.commentGeneric || [];
    const byRel = ContentCraft.data.commentByRel || {};
    body.innerHTML = `
      <div class="craft-panel glass">
        <label>Загальні коментарі під постами</label>
        <p class="craft-note">Можна {a:написала/написав} — рід автора допису. Свої форми: написала/написав.</p>
        <textarea id="craft-comment-generic" class="craft-ta" rows="8">${ContentCraft.arrToLines(gen)}</textarea>
      </div>
      <div class="craft-panel glass">
        <label>Якщо відносини «close»</label>
        <textarea id="craft-comment-close" class="craft-ta" rows="5">${ContentCraft.arrToLines(byRel.close || [])}</textarea>
      </div>
      <div class="craft-panel glass">
        <label>Якщо «crush»</label>
        <textarea id="craft-comment-crush" class="craft-ta" rows="4">${ContentCraft.arrToLines(byRel.crush || [])}</textarea>
      </div>
      <div class="craft-panel glass">
        <label>Якщо «annoyed»</label>
        <textarea id="craft-comment-annoyed" class="craft-ta" rows="4">${ContentCraft.arrToLines(byRel.annoyed || [])}</textarea>
      </div>
    `;
  },

  renderReactions(body) {
    const list = ContentCraft.data.commentReactions || [];
    body.innerHTML = `
      <div class="craft-panel glass">
        <p class="craft-note">Ключі — слова з поста через <code>|</code>. Якщо в дописі є збіг — бот бере фрази з блоку.</p>
        <div id="craft-react-list"></div>
        <button type="button" class="btn" id="craft-add-react" style="margin-top:8px">+ Новий ключ</button>
      </div>
    `;
    const box = document.getElementById("craft-react-list");
    const draw = () => {
      box.innerHTML = list.map((item, i) => `
        <div class="craft-react-item" data-i="${i}">
          <label>Ключі (через |)</label>
          <input type="text" class="craft-input react-keys" value="${(item.keys || "").replace(/"/g, "&quot;")}">
          <label>Фрази (по рядку)</label>
          <textarea class="craft-ta react-lines" rows="4">${ContentCraft.arrToLines(item.lines || [])}</textarea>
          <button type="button" class="btn-danger react-del" data-i="${i}">Видалити</button>
        </div>
      `).join("") || "<p>Порожньо — додай ключ.</p>";
      box.querySelectorAll(".react-del").forEach(btn => {
        btn.onclick = () => {
          list.splice(+btn.dataset.i, 1);
          draw();
        };
      });
    };
    draw();
    document.getElementById("craft-add-react").onclick = () => {
      list.push({ keys: "нове|слово", lines: ["Нова реакція"] });
      draw();
    };
  },

  renderStatuses(body) {
    const by = ContentCraft.data.statusByChar || {};
    const ids = typeof CHARACTERS !== "undefined" ? CHARACTERS.map(c => c.id) : Object.keys(by);
    if (!this._statusId || !by[this._statusId]) this._statusId = ids[0];
    const opts = ids.map(id =>
      `<option value="${id}" ${id === this._statusId ? "selected" : ""}>${this.charName(id)}</option>`
    ).join("");
    body.innerHTML = `
      <div class="craft-panel glass">
        <label>Спільні статуси (дівчата)</label>
        <textarea id="craft-st-f" class="craft-ta" rows="4">${ContentCraft.arrToLines(ContentCraft.data.statusCommonF)}</textarea>
        <label>Спільні статуси (хлопці)</label>
        <textarea id="craft-st-m" class="craft-ta" rows="4">${ContentCraft.arrToLines(ContentCraft.data.statusCommonM)}</textarea>
      </div>
      <div class="craft-panel glass">
        <label>Статуси персонажа</label>
        <select id="craft-st-char" class="craft-select">${opts}</select>
        <textarea id="craft-st-char-text" class="craft-ta" rows="8">${ContentCraft.arrToLines(by[this._statusId] || [])}</textarea>
      </div>
    `;
    document.getElementById("craft-st-char").onchange = (e) => {
      const prev = this._statusId;
      const ta = document.getElementById("craft-st-char-text");
      if (prev && ta) ContentCraft.data.statusByChar[prev] = ContentCraft.linesToArr(ta.value);
      this._statusId = e.target.value;
      ta.value = ContentCraft.arrToLines(ContentCraft.data.statusByChar[this._statusId] || []);
    };
  },

  renderThoughts(body) {
    const th = ContentCraft.data.thoughts || {};
    const moods = Object.keys(th);
    if (!this._moodKey || !th[this._moodKey]) this._moodKey = moods[0];
    const opts = moods.map(m =>
      `<option value="${m}" ${m === this._moodKey ? "selected" : ""}>${m}</option>`
    ).join("");
    body.innerHTML = `
      <div class="craft-panel glass">
        <label>Настрій</label>
        <select id="craft-mood" class="craft-select">${opts}</select>
        <label>Думки (по рядку)</label>
        <textarea id="craft-mood-text" class="craft-ta" rows="10">${ContentCraft.arrToLines(th[this._moodKey] || [])}</textarea>
      </div>
    `;
    document.getElementById("craft-mood").onchange = (e) => {
      const prev = this._moodKey;
      const ta = document.getElementById("craft-mood-text");
      if (prev && ta) ContentCraft.data.thoughts[prev] = ContentCraft.linesToArr(ta.value);
      this._moodKey = e.target.value;
      ta.value = ContentCraft.arrToLines(ContentCraft.data.thoughts[this._moodKey] || []);
    };
  },

  renderChat(body) {
    const ch = ContentCraft.data.chatCraft || {};
    body.innerHTML = `
      <div class="craft-panel glass">
        <label>Вітання</label>
        <textarea id="craft-chat-greet" class="craft-ta" rows="5">${ContentCraft.arrToLines(ch.greetings || [])}</textarea>
        <label>«Як справи?» — відповіді (можна {status})</label>
        <textarea id="craft-chat-how" class="craft-ta" rows="5">${ContentCraft.arrToLines(ch.howAreYou || [])}</textarea>
        <label>Зайнятий / зайнята</label>
        <textarea id="craft-chat-busy" class="craft-ta" rows="4">${ContentCraft.arrToLines(ch.busy || [])}</textarea>
        <label>Так / ні / ок</label>
        <textarea id="craft-chat-yes" class="craft-ta" rows="4">${ContentCraft.arrToLines(ch.yesNo || [])}</textarea>
        <label>Підтримка (сум, важко…)</label>
        <textarea id="craft-chat-sup" class="craft-ta" rows="4">${ContentCraft.arrToLines(ch.support || [])}</textarea>
      </div>
    `;
  },

  renderImport(body) {
    body.innerHTML = `
      <div class="craft-panel glass">
        <label>Експорт JSON</label>
        <textarea id="craft-export" class="craft-ta" rows="10" readonly></textarea>
        <button type="button" class="btn" id="craft-do-export">Оновити експорт</button>
        <label style="margin-top:12px">Імпорт JSON</label>
        <textarea id="craft-import" class="craft-ta" rows="8" placeholder="Встав JSON сюди"></textarea>
        <button type="button" class="btn" id="craft-do-import">Імпортувати</button>
      </div>
    `;
    document.getElementById("craft-do-export").onclick = () => {
      this.collectFromForm();
      document.getElementById("craft-export").value = ContentCraft.exportText();
    };
    document.getElementById("craft-do-import").onclick = () => {
      try {
        ContentCraft.importText(document.getElementById("craft-import").value);
        alert("Імпортовано і збережено");
        this.showSection("dialogs");
      } catch (e) {
        alert("Помилка JSON: " + e.message);
      }
    };
    document.getElementById("craft-do-export").click();
  },

  collectFromForm() {
    const sec = ContentCraft.section;
    if (sec === "dialogs") this.collectDialogsSoft();
    if (sec === "comments") {
      ContentCraft.data.commentGeneric = ContentCraft.linesToArr(document.getElementById("craft-comment-generic")?.value);
      ContentCraft.data.commentByRel = ContentCraft.data.commentByRel || {};
      ContentCraft.data.commentByRel.close = ContentCraft.linesToArr(document.getElementById("craft-comment-close")?.value);
      ContentCraft.data.commentByRel.crush = ContentCraft.linesToArr(document.getElementById("craft-comment-crush")?.value);
      ContentCraft.data.commentByRel.annoyed = ContentCraft.linesToArr(document.getElementById("craft-comment-annoyed")?.value);
    }
    if (sec === "reactions") {
      const items = [];
      document.querySelectorAll(".craft-react-item").forEach(el => {
        items.push({
          keys: el.querySelector(".react-keys")?.value?.trim() || "",
          lines: ContentCraft.linesToArr(el.querySelector(".react-lines")?.value)
        });
      });
      ContentCraft.data.commentReactions = items.filter(x => x.keys && x.lines.length);
    }
    if (sec === "statuses") {
      ContentCraft.data.statusCommonF = ContentCraft.linesToArr(document.getElementById("craft-st-f")?.value);
      ContentCraft.data.statusCommonM = ContentCraft.linesToArr(document.getElementById("craft-st-m")?.value);
      const id = document.getElementById("craft-st-char")?.value;
      if (id) ContentCraft.data.statusByChar[id] = ContentCraft.linesToArr(document.getElementById("craft-st-char-text")?.value);
    }
    if (sec === "thoughts") {
      const m = document.getElementById("craft-mood")?.value;
      if (m) ContentCraft.data.thoughts[m] = ContentCraft.linesToArr(document.getElementById("craft-mood-text")?.value);
    }
    if (sec === "chat") {
      ContentCraft.data.chatCraft = {
        greetings: ContentCraft.linesToArr(document.getElementById("craft-chat-greet")?.value),
        howAreYou: ContentCraft.linesToArr(document.getElementById("craft-chat-how")?.value),
        busy: ContentCraft.linesToArr(document.getElementById("craft-chat-busy")?.value),
        yesNo: ContentCraft.linesToArr(document.getElementById("craft-chat-yes")?.value),
        support: ContentCraft.linesToArr(document.getElementById("craft-chat-sup")?.value)
      };
    }
  }
};
