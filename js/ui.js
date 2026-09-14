/* ============================================
   UI — рендер, месенджер, теми, пошук
   Мінімальні DOM-операції
   ============================================ */

const UI = {
  playerId: null,
  currentChatId: null,

  showCharacterSelect() {
    const modal = document.getElementById("character-select");
    const grid = document.getElementById("character-grid");
    grid.innerHTML = "";
    CHARACTERS.forEach(c => {
      const card = document.createElement("div");
      card.className = "char-card";
      card.innerHTML = `
        <div class="avatar lg" style="background:linear-gradient(145deg,${c.color}88,${c.color})">${c.emoji}</div>
        <div class="name">${c.name}</div>
        <div class="gender">${c.gender === "m" ? "хлопець" : "дівчина"} · ${c.isOwl ? "сова" : "жайворонок"}</div>
      `;
      card.onclick = () => {
        this.playerId = c.id;
        localStorage.setItem("viterecz_player", c.id);
        modal.hidden = true;
        engine.state[c.id].online = true;
        this.applyTheme();
        this.refreshAll();
      };
      grid.appendChild(card);
    });
    modal.hidden = false;
  },

  applyTheme() {
    if (!this.playerId) return;
    const mood = engine.getState(this.playerId).mood;
    const theme = MOOD_THEMES[mood] || MOOD_THEMES["спокійний"];
    document.body.className = theme.class;
    const label = document.getElementById("theme-label");
    if (label) label.textContent = theme.emoji + " тема: " + theme.name;
  },

  renderMePanel() {
    if (!this.playerId) return;
    const c = engine.getCharacter(this.playerId);
    const s = engine.getState(this.playerId);
    document.getElementById("me-panel").innerHTML = `
      <div class="avatar lg online" style="background:linear-gradient(145deg,${c.color}88,${c.color})">${c.emoji}</div>
      <div>
        <div class="name">${c.name}</div>
        <div class="mood">${s.mood} · ${s.status}</div>
        <div class="status-pill" style="margin-top:4px">💭 ${s.thought}</div>
      </div>
    `;
    document.getElementById("current-status").textContent = s.status;
    this.applyTheme();
  },

  renderOnlineFriends() {
    const ul = document.getElementById("online-friends");
    ul.innerHTML = "";
    CHARACTERS.forEach(c => {
      if (c.id === this.playerId) return;
      const st = engine.getState(c.id);
      if (!st.online) return;
      const li = document.createElement("li");
      li.innerHTML = `<div class="avatar sm online">${c.emoji}</div><span>${c.name.split(" ")[0]}</span>`;
      li.onclick = () => this.openChat(c.id);
      ul.appendChild(li);
    });
  },

  renderFeed(filterQuery) {
    const container = document.getElementById("feed-container");
    container.innerHTML = "";
    let posts = [...engine.posts].sort((a, b) => b.ts - a.ts);
    if (filterQuery) posts = engine.searchPosts(filterQuery);

    posts.forEach(post => {
      const author = engine.getCharacter(post.author);
      if (!author) return;
      const card = document.createElement("article");
      card.className = "post-card glass";
      const liked = post.likes.has(this.playerId);
      const likesCount = post.likes.size;
      const likeNames = [...post.likes].map(id => engine.getCharacter(id)?.name?.split(" ")[0]).filter(Boolean).join(", ");

      card.innerHTML = `
        <div class="post-header">
          <div class="avatar ${engine.getState(post.author).online ? "online" : ""}" style="background:linear-gradient(145deg,${author.color}88,${author.color})">${author.emoji}</div>
          <div class="meta">
            <div class="author" data-id="${post.author}">${author.name}</div>
            <div class="time">${post.weirdTime}</div>
          </div>
        </div>
        <div class="post-body">${this.formatText(post.text)}</div>
        <div class="post-actions">
          <button class="like-btn ${liked ? "liked" : ""}" data-id="${post.id}">${liked ? "❤️" : "🤍"} ${likesCount}</button>
          <span style="font-size:0.8rem;color:var(--text-muted)">${likesCount ? "від " + likeNames.split(", ").slice(0, 3).join(", ") + (likesCount > 3 ? "…" : "") : ""}</span>
        </div>
        <div class="comments">
          ${post.comments.map(cm => {
            const ca = engine.getCharacter(cm.author);
            return `<div class="comment">
              <div class="avatar sm">${ca?.emoji || "?"}</div>
              <div class="text"><span class="author" data-id="${cm.author}">${ca?.name || ""}</span> ${this.formatText(cm.text)}</div>
            </div>`;
          }).join("")}
        </div>
      `;
      container.appendChild(card);
    });

    container.onclick = (e) => {
      const likeBtn = e.target.closest(".like-btn");
      if (likeBtn) {
        engine.toggleLike(likeBtn.dataset.id, this.playerId);
        this.renderFeed(document.getElementById("search-posts")?.value);
        return;
      }
      const authorEl = e.target.closest(".author, .mention");
      if (authorEl?.dataset.id) this.openBotProfile(authorEl.dataset.id);
    };
  },

  formatText(text) {
    return this.escape(text).replace(/@(\w+)/g, (m, id) => {
      const c = engine.getCharacter(id);
      if (c) return `<span class="mention" data-id="${id}">@${c.name.split(" ")[0]}</span>`;
      return m;
    });
  },

  escape(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  },

  renderProfile() {
    if (!this.playerId) return;
    const c = engine.getCharacter(this.playerId);
    const s = engine.getState(this.playerId);
    document.getElementById("profile-header").innerHTML = `
      <div class="avatar lg online" style="background:linear-gradient(145deg,${c.color}88,${c.color})">${c.emoji}</div>
      <div class="profile-info">
        <h2>${c.name}</h2>
        <div class="bio">${c.bio}</div>
        <div class="profile-stats">
          <span><strong>${engine.posts.filter(p => p.author === this.playerId).length}</strong> дописів</span>
          <span><strong>${s.friends.length}</strong> друзів</span>
          <span>${s.mood}</span>
        </div>
      </div>
    `;
    this.renderProfileTab("posts");
  },

  renderProfileTab(tab) {
    const content = document.getElementById("profile-content");
    const c = engine.getCharacter(this.playerId);
    const s = engine.getState(this.playerId);

    if (tab === "posts") {
      const myPosts = engine.posts.filter(p => p.author === this.playerId);
      content.innerHTML = myPosts.length
        ? myPosts.map(p => `<div class="post-card glass" style="margin-bottom:10px"><div class="post-body">${this.formatText(p.text)}</div><div class="time">${p.weirdTime}</div></div>`).join("")
        : `<p style="color:var(--text-muted);padding:16px">Поки немає дописів.</p>
           <button class="btn" id="btn-new-post">Опублікувати щось</button>`;
      const btn = document.getElementById("btn-new-post");
      if (btn) btn.onclick = () => {
        const texts = [s.thought, `Сьогодні я ${s.status}`, "Просто момент.", "Думаю про " + c.interests[0]];
        engine.addPost(this.playerId, texts[Math.floor(Math.random() * texts.length)]);
        this.renderProfileTab("posts");
        this.renderFeed();
      };
    } else if (tab === "thoughts") {
      content.innerHTML = `<div class="glass" style="padding:16px">
        <p><strong>Поточна думка:</strong></p>
        <p style="font-size:1.1rem;margin:10px 0">💭 ${s.thought}</p>
        <p style="color:var(--text-muted);font-size:0.85rem">Настрій і думки обирає персонаж.</p>
      </div>`;
    } else if (tab === "friends") {
      content.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">
        ${s.friends.map(fid => {
          const f = engine.getCharacter(fid);
          const rel = engine.getRelation(this.playerId, fid);
          return `<div class="glass" style="padding:10px;display:flex;align-items:center;gap:10px;cursor:pointer" data-id="${fid}">
            <div class="avatar ${engine.getState(fid).online ? "online" : ""}">${f.emoji}</div>
            <div><strong>${f.name}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${rel}</span></div>
          </div>`;
        }).join("") || "<p style='color:var(--text-muted)'>Поки порожньо</p>"}
      </div>`;
      content.onclick = (e) => {
        const el = e.target.closest("[data-id]");
        if (el) this.openBotProfile(el.dataset.id);
      };
    } else if (tab === "goals") {
      content.innerHTML = `<ul style="padding:12px;list-style:none">
        ${c.goals.map(g => `<li class="glass" style="padding:10px;margin-bottom:8px">🎯 ${g}</li>`).join("")}
      </ul>`;
    } else if (tab === "meetings") {
      const mine = engine.meetings.filter(m => m.from === this.playerId || m.to === this.playerId);
      content.innerHTML = mine.length
        ? mine.map(m => {
            const other = engine.getCharacter(m.from === this.playerId ? m.to : m.from);
            return `<div class="meeting-card glass">
              <strong>${other?.name}</strong> · ${m.place}
              <span class="status-${m.status}">${m.status === "accepted" ? "✅ прийнято" : m.status === "declined" ? "❌ відхилено" : "⏳ очікує"}</span>
            </div>`;
          }).join("")
        : `<p style="color:var(--text-muted);padding:16px">Зустрічей поки немає. Запрошуй у чаті.</p>`;
    } else if (tab === "achievements") {
      const list = engine.getAchievementProgress();
      const unlocked = list.filter(a => a.unlocked).length;
      content.innerHTML = `
        <p style="margin-bottom:12px;color:var(--text-muted)">Відкрито ${unlocked} / ${list.length}</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${list.map(a => `
            <div class="glass" style="padding:12px;opacity:${a.unlocked ? 1 : 0.55};display:flex;gap:12px;align-items:center">
              <span style="font-size:1.6rem">${a.unlocked ? a.emoji : "🔒"}</span>
              <div style="flex:1">
                <strong>${a.name}</strong>
                <div style="font-size:0.85rem;color:var(--text-muted)">${a.desc}</div>
                <div style="font-size:0.8rem;margin-top:4px">${a.current}/${a.target}</div>
              </div>
            </div>
          `).join("")}
        </div>`;
    }
  },

  openBotProfile(id) {
    if (id === this.playerId) { this.switchView("profile"); return; }
    engine.track("profileVisited", 1, id);
    const c = engine.getCharacter(id);
    const s = engine.getState(id);
    const rel = engine.getRelation(this.playerId, id);
    document.getElementById("bot-profile-header").innerHTML = `
      <div class="avatar lg ${s.online ? "online" : ""}" style="background:linear-gradient(145deg,${c.color}88,${c.color})">${c.emoji}</div>
      <div class="profile-info">
        <h2>${c.name}</h2>
        <div class="bio">${c.bio}</div>
        <div class="status-pill" style="margin-top:8px">${s.status} · ${s.mood}</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" id="btn-message">Написати</button>
          <button class="btn" id="btn-toggle-friend">${["friend","close","crush"].includes(rel) ? "Видалити з друзів" : "Додати в друзі"}</button>
          <button class="btn" id="btn-meetup-profile">Запросити зустрітися</button>
          <button class="btn-danger" id="btn-block-bot">Заблокувати</button>
        </div>
      </div>
    `;
    const botPosts = engine.posts.filter(p => p.author === id);
    document.getElementById("bot-profile-content").innerHTML = `
      <h3 style="margin:16px 0 10px">Публікації</h3>
      ${botPosts.map(p => `<div class="post-card glass" style="margin-bottom:10px"><div class="post-body">${this.formatText(p.text)}</div></div>`).join("") || "<p style='color:var(--text-muted)'>Немає дописів</p>"}
    `;
    this.switchView("bot-profile");

    document.getElementById("btn-message").onclick = () => this.openChat(id);
    document.getElementById("btn-toggle-friend").onclick = () => {
      const current = engine.relations[this.playerId][id];
      if (["friend", "close", "crush"].includes(current)) {
        engine.relations[this.playerId][id] = "neutral";
        engine.relations[id][this.playerId] = "neutral";
      } else {
        engine.relations[this.playerId][id] = "friend";
        if (Math.random() > 0.3) engine.relations[id][this.playerId] = "friend";
        engine.track("friends_added");
      }
      this.openBotProfile(id);
      this.renderOnlineFriends();
    };
    document.getElementById("btn-meetup-profile").onclick = () => {
      const m = engine.proposeMeeting(this.playerId, id);
      alert("Запрошення на зустріч у «" + m.place + "» надіслано.");
    };
    document.getElementById("btn-block-bot").onclick = () => {
      engine.blocked[this.playerId].add(id);
      alert(c.name + " заблоковано.");
      this.switchView("feed");
    };
  },

  renderGallery() {
    const grid = document.getElementById("gallery-grid");
    grid.innerHTML = "";
    GALLERY.forEach(item => {
      const el = document.createElement("div");
      el.className = "gallery-item";
      el.innerHTML = item.emoji + '<span class="likes">♥ ' + (3 + (item.id % 9)) + "</span>";
      el.onclick = () => this.openGalleryModal(item);
      grid.appendChild(el);
    });
  },

  openGalleryModal(item) {
    engine.track("gallery");
    const author = engine.getCharacter(item.author);
    document.getElementById("modal-body").innerHTML = `
      <div style="font-size:4rem;text-align:center;margin-bottom:12px">${item.emoji}</div>
      <p><strong>${author.name}</strong></p>
      <p style="margin:8px 0">${item.desc}</p>
      <p style="font-size:0.85rem;color:var(--text-muted)">Теги: ${item.tags.join(", ")}</p>
      <div style="margin-top:16px">
        <button class="btn">🤍 Подобається</button>
        <button class="btn-danger" style="margin-left:8px">Скарга</button>
      </div>
    `;
    document.getElementById("gallery-modal").hidden = false;
  },

  renderMessagesList(filterQuery) {
    const list = document.getElementById("msg-list");
    list.innerHTML = "";
    let people = CHARACTERS.filter(c => c.id !== this.playerId);
    if (filterQuery) people = engine.searchCharacters(filterQuery).filter(c => c.id !== this.playerId);

    people.forEach(c => {
      const st = engine.getState(c.id);
      const rel = engine.getRelation(this.playerId, c.id);
      if (rel === "blocked") return;
      const key = [this.playerId, c.id].sort().join("_");
      const msgs = engine.messages[key] || [];
      const last = msgs[msgs.length - 1];
      const el = document.createElement("div");
      el.className = "msg-item glass";
      el.innerHTML = `
        <div class="avatar ${st.online ? "online" : ""}">${c.emoji}</div>
        <div style="flex:1;min-width:0">
          <strong>${c.name}</strong>
          <div class="preview">${last ? last.text : "Немає повідомлень · " + rel}</div>
        </div>
      `;
      el.onclick = () => this.openChat(c.id);
      list.appendChild(el);
    });
  },

  openChat(toId) {
    this.currentChatId = toId;
    const c = engine.getCharacter(toId);
    const s = engine.getState(toId);
    document.getElementById("chat-user-info").innerHTML = `
      <div class="avatar sm ${s.online ? "online" : ""}">${c.emoji}</div>
      <div><strong>${c.name}</strong><br><span style="font-size:0.8rem;color:var(--text-muted)">${s.online ? s.status : "не в мережі"}</span></div>
    `;
    this.renderChatMessages();
    this.renderQuickReplies();
    this.switchView("chat");

    document.getElementById("chat-back").onclick = () => this.switchView("messages");
    document.getElementById("btn-block").onclick = () => {
      engine.blocked[this.playerId].add(toId);
      alert("Заблоковано.");
      this.switchView("messages");
    };
    document.getElementById("btn-meetup").onclick = () => {
      const m = engine.proposeMeeting(this.playerId, toId);
      const key = [this.playerId, toId].sort().join("_");
      if (!engine.messages[key]) engine.messages[key] = [];
      engine.messages[key].push({ from: this.playerId, text: "Запрошую зустрітися у «" + m.place + "» 📍", read: false, ts: Date.now() });
      this.renderChatMessages();
      setTimeout(() => {
        if (m.status === "accepted") {
          engine.messages[key].push({ from: toId, text: "Ок, давай у «" + m.place + "»! 😊", read: true, ts: Date.now() });
        } else if (m.status === "declined") {
          engine.messages[key].push({ from: toId, text: "Вибач, не можу...", read: true, ts: Date.now() });
        }
        this.renderChatMessages();
      }, 4000);
    };
  },

  renderChatMessages() {
    const key = [this.playerId, this.currentChatId].sort().join("_");
    if (!engine.messages[key]) engine.messages[key] = [];
    const box = document.getElementById("chat-messages");
    box.innerHTML = engine.messages[key].map(m => `
      <div class="msg ${m.from === this.playerId ? "mine" : "theirs"}">
        ${this.escape(m.text)}
        ${m.from === this.playerId ? `<div class="status">${m.read ? "прочитано" : "надіслано"}</div>` : ""}
      </div>
    `).join("");
    box.scrollTop = box.scrollHeight;
  },

  renderQuickReplies() {
    const container = document.getElementById("quick-replies");
    const replies = engine.getQuickReplies(this.playerId, this.currentChatId);
    container.innerHTML = replies.map(r => `<button>${r}</button>`).join("");
    container.onclick = (e) => {
      if (e.target.tagName === "BUTTON") this.sendMessage(e.target.textContent);
    };
  },

  sendMessage(text) {
    const key = [this.playerId, this.currentChatId].sort().join("_");
    if (!engine.messages[key]) engine.messages[key] = [];
    engine.messages[key].push({ from: this.playerId, text, read: false, ts: Date.now() });
    engine.onPlayerMessage(this.playerId, this.currentChatId);
    this.renderChatMessages();

    const decision = engine.botMayReply(this.playerId, this.currentChatId);
    if (!decision || decision.type === "ignore") return;

    const box = document.getElementById("chat-messages");
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.id = "typing-indicator";
    const name = engine.getCharacter(this.currentChatId).name.split(" ")[0];
    typing.innerHTML = `<span>${name} набирає повідомлення</span>
      <span class="typing-dots"><span></span><span></span><span></span></span>`;
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;

    if (decision.type === "read_only" || decision.type === "typing_then_cancel") {
      setTimeout(() => {
        typing.remove();
        const last = engine.messages[key].filter(m => m.from === this.playerId).pop();
        if (last) last.read = true;
        this.renderChatMessages();
      }, 2000 + Math.random() * 3000);
      return;
    }

    setTimeout(() => {
      typing.remove();
      engine.messages[key].push({ from: this.currentChatId, text: decision.text, read: true, ts: Date.now() });
      const last = engine.messages[key].filter(m => m.from === this.playerId).pop();
      if (last) last.read = true;
      this.renderChatMessages();
    }, decision.delay);
  },

  renderGames() {
    const list = document.getElementById("games-list");
    list.innerHTML = GAMES.map(g => `
      <div class="game-card glass">
        <div style="font-size:1.5rem">${g.emoji} <strong>${g.name}</strong></div>
        <p style="font-size:0.9rem;color:var(--text-muted);margin:6px 0">${g.desc}</p>
        <button class="btn start-game" data-game="${g.id}">Почати з кимось</button>
      </div>
    `).join("") + `<div id="active-games"></div>`;

    list.onclick = (e) => {
      const btn = e.target.closest(".start-game");
      if (btn) {
        const gameId = btn.dataset.game;
        const online = CHARACTERS.filter(c => c.id !== this.playerId && engine.getState(c.id).online);
        if (!online.length) { alert("Ніхто не онлайн зараз. Зачекай або обери інший час."); return; }
        const partners = online.sort(() => Math.random() - 0.5).slice(0, 1 + (Math.random() > 0.5 ? 1 : 0));
        const players = [this.playerId, ...partners.map(p => p.id)];
        const session = engine.startGame(gameId, players);
        this.showGameSession(session);
        return;
      }
      const act = e.target.closest("[data-action-idx]");
      if (act) {
        engine.playerGameAction(act.dataset.session, parseInt(act.dataset.actionIdx, 10));
        this.renderActiveGames();
      }
    };
    this.renderActiveGames();
  },

  renderActiveGames() {
    const box = document.getElementById("active-games");
    if (!box) return;
    const active = engine.activeGames.filter(g => g.status === "playing" || g.ts > Date.now() - 90000);
    box.innerHTML = active.map(s => {
      const scoreLine = s.players.map(p => {
        const n = engine.getCharacter(p)?.name?.split(" ")[0] || p;
        return `${n}: ${s.scores?.[p] || 0}`;
      }).join(" · ");
      const actionsHtml = (s.status === "playing" && s.players.includes(this.playerId))
        ? `<div class="quick-replies" style="margin-top:8px">${(s.actions || []).map((a, i) =>
            `<button data-session="${s.id}" data-action-idx="${i}">${a}</button>`).join("")}</div>`
        : "";
      return `<div class="game-card glass">
        <strong>${s.emoji} ${s.name}</strong>
        <div style="font-size:0.85rem;color:var(--text-muted);margin:4px 0">${scoreLine}</div>
        <div class="game-log">${s.log.slice(-8).map(l => `<div>${l}</div>`).join("")}</div>
        ${actionsHtml}
        <span style="font-size:0.8rem;color:var(--text-muted)">${s.status === "playing" ? "Раунд " + (s.round || 0) + "/" + s.maxRounds : s.status}</span>
      </div>`;
    }).join("");
  },

  showGameSession(session) {
    this.renderActiveGames();
    const iv = setInterval(() => {
      this.renderActiveGames();
      if (session.status === "finished") clearInterval(iv);
    }, 2200);
  },

  showAchievementToast(a) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast glass";
    el.innerHTML = `<span style="font-size:1.4rem">${a.emoji}</span> <div><strong>Досягнення!</strong><br>${a.name}</div>`;
    root.appendChild(el);
    setTimeout(() => el.classList.add("show"), 20);
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 400); }, 3200);
  },

  switchView(name) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const view = document.getElementById("view-" + name);
    if (view) view.classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.view === name);
    });
    if (name === "feed") this.renderFeed();
    if (name === "profile") this.renderProfile();
    if (name === "gallery") this.renderGallery();
    if (name === "games") this.renderGames();
    if (name === "messages") this.renderMessagesList();
  },

  refreshAll() {
    this.renderMePanel();
    this.renderOnlineFriends();
    this.renderFeed();
  }
};
