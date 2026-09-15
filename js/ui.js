/* ============================================
   UI — рендер, месенджер, теми, пошук
   Мінімальні DOM-операції
   ============================================ */

const UI = {
  playerId: null,
  currentChatId: null,
  viewingProfileId: null, // чий профіль відкритий (тема)

  showCharacterSelect() {
    const modal = document.getElementById("character-select");
    const grid = document.getElementById("character-grid");
    grid.innerHTML = "";
    CHARACTERS.forEach(c => {
      const card = document.createElement("div");
      card.className = "char-card";
      card.innerHTML = `
        ${this.avatarHTML(c, "lg", "", `background:linear-gradient(145deg,${c.color}88,${c.color})`)}
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


  /** Аватар: картинка з URL або емодзі */
  avatarHTML(char, sizeClass = "", extraClass = "", styleExtra = "") {
    if (!char) return `<div class="avatar ${sizeClass} ${extraClass}">?</div>`;
    const cls = `avatar aero-avatar ${sizeClass} ${extraClass}`.trim();
    const bg = styleExtra || `background:linear-gradient(160deg,${char.color || "#88a"}aa,${char.color || "#88a"})`;
    const url = (char.avatar || "").trim();
    if (url && /^https?:\/\//i.test(url)) {
      const fb = this.escape(char.emoji || "?");
      return `<div class="${cls} has-img" style="${bg}" data-fallback="${fb}"><img class="avatar-img" src="${this.escape(url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove();if(this.parentNode)this.parentNode.textContent=this.parentNode.dataset.fallback||'?'"/></div>`;
    }
    return `<div class="${cls}" style="${bg}">${char.emoji || "?"}</div>`;
  },

  applyTheme(themeForId = null) {
    const id = themeForId || this.playerId;
    if (!id) return;
    const char = engine.getCharacter(id);
    const mood = engine.getState(id)?.mood || "спокійний";
    const theme = MOOD_THEMES[mood] || MOOD_THEMES["спокійний"];
    const keep = [...document.body.classList].filter(c => !c.startsWith("theme-"));
    document.body.className = [...keep, theme.class].join(" ");
    document.documentElement.style.setProperty("--theme-name", theme.name);
    if (typeof ThemeSFX !== "undefined") ThemeSFX.playTheme(theme.class);
    const label = document.getElementById("theme-label");
    if (label) {
      const whose = (themeForId && themeForId !== this.playerId)
        ? ((char?.name || "").split(" ")[0] + ": ")
        : "";
      label.textContent = theme.emoji + " " + whose + "тема " + theme.name + " · " + engine.moodLabel(mood, char?.gender);
    }
  },

  renderMePanel() {
    if (!this.playerId) return;
    const c = engine.getCharacter(this.playerId);
    const s = engine.getState(this.playerId);
    const online = s.online ? '<div class="status-online">онлайн</div>' : '<div class="status-online" style="color:#ffb0b0">офлайн</div>';
    document.getElementById("me-panel").innerHTML = `
      ${this.avatarHTML(c, "lg me-avatar", s.online ? "online" : "", `background:linear-gradient(160deg,${c.color}cc,${c.color})`)}
      ${online}
      <div class="mood">${engine.moodLabel(s.mood, c.gender)}</div>
    `;
    const st = document.getElementById("current-status");
    if (st) {
      const left = engine.activityRemainingLabel(this.playerId);
      st.textContent = s.status + (left ? " (" + left + ")" : "") + (s.thought ? " · " + s.thought : "");
    }
    // Не перебивати тему чужого профілю
    if (!this.viewingProfileId) this.applyTheme(this.playerId);
  },

  friendsExpanded: false,

  renderOnlineFriends() {
    const ul = document.getElementById("online-friends");
    const preview = document.getElementById("friends-preview");
    const toggle = document.getElementById("friends-toggle");
    if (!ul) return;

    const friends = (engine.getState(this.playerId)?.friends || [])
      .map(id => engine.getCharacter(id))
      .filter(Boolean);
    const onlineFirst = [...friends].sort((a, b) => {
      const ao = engine.getState(a.id)?.online ? 1 : 0;
      const bo = engine.getState(b.id)?.online ? 1 : 0;
      return bo - ao;
    });

    // 2 аватарки-прев'ю вертикально
    if (preview) {
      const two = onlineFirst.slice(0, 2);
      preview.innerHTML = two.map(c => {
        const on = engine.getState(c.id)?.online;
        return `<div class="friend-preview-item" data-id="${c.id}">
          ${this.avatarHTML(c, "sm", on ? "online" : "")}
          <span class="friend-preview-name">${c.name.split(" ")[0]}</span>
        </div>`;
      }).join("") || `<span style="font-size:0.75rem;opacity:0.8">Немає друзів</span>`;
      preview.querySelectorAll("[data-id]").forEach(el => {
        el.onclick = () => this.openBotProfile(el.dataset.id);
      });
    }

    ul.innerHTML = "";
    ul.classList.toggle("collapsed", !this.friendsExpanded);
    onlineFirst.forEach(c => {
      const st = engine.getState(c.id);
      const li = document.createElement("li");
      li.innerHTML = `${this.avatarHTML(c, "sm", st.online ? "online" : "")}<span>${c.name.split(" ")[0]}${st.online ? "" : " · офлайн"}</span>`;
      li.onclick = () => this.openBotProfile(c.id);
      ul.appendChild(li);
    });

    const mini = document.getElementById("friends-mini");
    if (mini) mini.classList.toggle("expanded", !!this.friendsExpanded);

    if (toggle && !toggle._bound) {
      toggle._bound = true;
      toggle.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.friendsExpanded = !this.friendsExpanded;
        // одразу клас, без очікування повного ре-рендеру
        ul.classList.toggle("collapsed", !this.friendsExpanded);
        if (mini) mini.classList.toggle("expanded", this.friendsExpanded);
        toggle.setAttribute("aria-expanded", this.friendsExpanded ? "true" : "false");
        toggle.textContent = this.friendsExpanded ? "Друзі (згорнути)" : "Друзі (показати всіх)";
        this.renderOnlineFriends();
        // не крутимо сайдбар угору/вниз — інакше кнопки наїжджають на аватар
      };
    }
    if (toggle) {
      toggle.textContent = this.friendsExpanded ? "Друзі (згорнути)" : "Друзі (показати всіх)";
      toggle.setAttribute("aria-expanded", this.friendsExpanded ? "true" : "false");
    }
  },


  postCardHtml(post, { compact = false } = {}) {
    const author = engine.getCharacter(post.author);
    if (!author) return "";
    const liked = post.likes.has(this.playerId);
    const likesCount = post.likes.size;
    const likeNames = [...post.likes].map(id => engine.getCharacter(id)?.name?.split(" ")[0]).filter(Boolean).join(", ");
    const comments = (post.comments || []).map(cm => {
      const ca = engine.getCharacter(cm.author);
      return `<div class="comment">
        ${this.avatarHTML(ca, "sm")}
        <div class="text"><span class="author" data-id="${cm.author}">${ca?.name || ""}</span> ${this.formatText(cm.text)}</div>
      </div>`;
    }).join("");
    return `
      <div class="post-header">
        ${this.avatarHTML(author, "", engine.getState(post.author)?.online ? "online" : "", `background:linear-gradient(145deg,${author.color}88,${author.color})`)}
        <div class="meta">
          <div class="author" data-id="${post.author}">${author.name}</div>
          <div class="time">${post.weirdTime || ""}</div>
        </div>
      </div>
      <div class="post-body">${this.formatText(post.text)}</div>
      <div class="post-actions">
        <button class="like-btn ${liked ? "liked" : ""}" data-id="${post.id}">${liked ? "❤️" : "🤍"} ${likesCount}</button>
        <span class="likes-count">${likesCount ? "від " + likeNames.split(", ").slice(0, 3).join(", ") + (likesCount > 3 ? "…" : "") : "поки без вподобайок"}</span>
      </div>
      <div class="comments">${comments || '<p class="no-comments">Коментарів ще немає</p>'}</div>
    `;
  },

  renderFeed(filterQuery) {
    const container = document.getElementById("feed-container");
    container.innerHTML = "";
    let posts = [...engine.posts].sort((a, b) => b.ts - a.ts);
    if (filterQuery) posts = engine.searchPosts(filterQuery);

    posts.forEach(post => {
      if (!engine.getCharacter(post.author)) return;
      const card = document.createElement("article");
      card.className = "post-card glass";
      card.dataset.postId = post.id;
      card.innerHTML = this.postCardHtml(post);
      container.appendChild(card);
    });

    container.onclick = (e) => {
      const likeBtn = e.target.closest(".like-btn");
      if (likeBtn) {
        engine.toggleLike(likeBtn.dataset.id, this.playerId);
        this.renderFeed(document.getElementById("search-posts")?.value);
        // якщо відкритий профіль — теж оновити
        const active = document.querySelector(".view.active");
        if (active?.id === "view-profile") this.renderProfileTab("posts");
        if (active?.id === "view-bot-profile") {
          const id = document.querySelector("#bot-profile-header .author, #bot-profile-header [data-id]")?.dataset?.id;
        }
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
      <div class="profile-info" style="width:100%">
        <h1 class="display-name">${c.name}</h1>
        <div class="status-online">${s.online ? "онлайн" : "офлайн"}</div>
        <p class="info-line"><b>Зараз:</b> ${s.status}${engine.activityRemainingLabel(this.playerId) ? " (" + engine.activityRemainingLabel(this.playerId) + ")" : ""}</p>
        <p class="info-line"><b>Настрій:</b> ${engine.moodLabel(s.mood, c.gender)}</p>
        <p class="info-line"><b>Думки:</b> ${s.thought}</p>
        <p class="info-line"><b>Стосунки:</b> ${engine.relationshipLabel(this.playerId)}</p>
        <p class="info-line"><b>Дописів:</b> ${engine.posts.filter(p => p.author === this.playerId).length}
           · <b>Друзів:</b> ${s.friends.length}</p>
      </div>
    `;
    this.renderProfileTab("posts");
  },

  renderProfileTab(tab) {
    const content = document.getElementById("profile-content");
    const view = document.getElementById("view-profile");
    const scrollParent = view || content;
    const savedScroll = scrollParent ? scrollParent.scrollTop : 0;
    const c = engine.getCharacter(this.playerId);
    const s = engine.getState(this.playerId);

    if (tab === "posts") {
      const myPosts = engine.posts.filter(p => p.author === this.playerId).sort((a,b) => b.ts - a.ts);
      content.innerHTML = myPosts.length
        ? myPosts.map(p => `<article class="post-card glass" style="margin-bottom:10px" data-post-id="${p.id}">${this.postCardHtml(p)}</article>`).join("")
          + `<button class="btn" id="btn-new-post" style="margin-top:8px">Опублікувати щось</button>`
        : `<p style="color:var(--text-muted);padding:16px">Поки немає дописів.</p>
           <button class="btn" id="btn-new-post">Опублікувати щось</button>`;
      const btn = document.getElementById("btn-new-post");
      if (btn) btn.onclick = () => {
        const texts = [s.thought, `Сьогодні я ${s.status}`, "Просто момент.", "Думаю про " + c.interests[0]];
        engine.addPost(this.playerId, texts[Math.floor(Math.random() * texts.length)]);
        this.renderProfileTab("posts");
        this.renderFeed();
      };
      content.onclick = (e) => {
        const likeBtn = e.target.closest(".like-btn");
        if (likeBtn) {
          engine.toggleLike(likeBtn.dataset.id, this.playerId);
          this.renderProfileTab("posts");
          this.renderFeed(document.getElementById("search-posts")?.value);
          return;
        }
        const authorEl = e.target.closest(".author, .mention");
        if (authorEl?.dataset.id) this.openBotProfile(authorEl.dataset.id);
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
            ${this.avatarHTML(f, "", engine.getState(fid).online ? "online" : "")}
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
    // не стрибати вгору після «Опублікувати»
    requestAnimationFrame(() => {
      if (scrollParent) scrollParent.scrollTop = savedScroll;
    });
  },

  refreshBotProfileStatus(id) {
    const box = document.getElementById("bot-live-status");
    if (!box || !id) return;
    const c = engine.getCharacter(id);
    const s = engine.getState(id);
    if (!c || !s) return;
    const set = (field, val) => {
      const el = box.querySelector(`[data-field="${field}"]`);
      if (el) el.textContent = val;
    };
    set("status", s.status + (engine.activityRemainingLabel(id) ? " (" + engine.activityRemainingLabel(id) + ")" : ""));
    set("mood", engine.moodLabel(s.mood, c.gender));
    set("thought", s.thought);
    set("rel", engine.relationshipLabel(id));
  },

  openBotProfile(id) {
    if (id === this.playerId) { this.switchView("profile"); return; }
    engine.track("profileVisited", 1, id);
    const c = engine.getCharacter(id);
    const s = engine.getState(id);
    const rel = engine.getRelation(this.playerId, id);
    document.getElementById("bot-profile-header").innerHTML = `
      <div class="bot-profile-row">
        <div class="profile-info">
          <h2 class="display-name">${c.name}</h2>
          <div class="status-online">${s.online ? "онлайн" : "офлайн"}</div>
          <div class="bio">${c.bio}</div>
          <div class="bot-live-status" id="bot-live-status">
            <p class="info-line"><b>Зараз:</b> <span data-field="status">${s.status}${engine.activityRemainingLabel(id) ? " (" + engine.activityRemainingLabel(id) + ")" : ""}</span></p>
            <p class="info-line"><b>Настрій:</b> <span data-field="mood">${engine.moodLabel(s.mood, c.gender)}</span></p>
            <p class="info-line"><b>Думки:</b> <span data-field="thought">${s.thought}</span></p>
            <p class="info-line"><b>Стосунки:</b> <span data-field="rel">${engine.relationshipLabel(id)}</span></p>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" id="btn-message">Написати</button>
            <button class="btn" id="btn-toggle-friend">${["friend","close","crush"].includes(rel) ? "Видалити з друзів" : "Додати в друзі"}</button>
            <button class="btn" id="btn-meetup-profile">Запросити зустрітися</button>
            <button class="btn-danger" id="btn-block-bot">Заблокувати</button>
          </div>
        </div>
        <div data-id="${id}">${this.avatarHTML(c, "md", s.online ? "online" : "", `background:linear-gradient(145deg,${c.color}88,${c.color})`)}</div>
      </div>
    `;
    const botPosts = engine.posts.filter(p => p.author === id).sort((a,b) => b.ts - a.ts);
    const contentEl = document.getElementById("bot-profile-content");
    contentEl.innerHTML = `
      <h3 style="margin:16px 0 10px">Публікації</h3>
      ${botPosts.map(p => `<article class="post-card glass" style="margin-bottom:10px" data-post-id="${p.id}">${this.postCardHtml(p)}</article>`).join("") || "<p style='color:var(--text-muted)'>Немає дописів</p>"}
    `;
    contentEl.onclick = (e) => {
      const likeBtn = e.target.closest(".like-btn");
      if (likeBtn) {
        engine.toggleLike(likeBtn.dataset.id, this.playerId);
        this.openBotProfile(id);
        this.renderFeed(document.getElementById("search-posts")?.value);
        return;
      }
      const authorEl = e.target.closest(".author, .mention");
      if (authorEl?.dataset.id) this.openBotProfile(authorEl.dataset.id);
    };
    this.viewingProfileId = id;
    this.switchView("bot-profile");
    this.applyTheme(id);

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
      const count = engine.getGalleryLikeCount(item.id);
      const liked = engine.hasGalleryLike(item.id, this.playerId);
      el.innerHTML = item.emoji + '<span class="likes">' + (liked ? "❤️" : "♥") + " " + count + "</span>";
      el.onclick = () => this.openGalleryModal(item);
      grid.appendChild(el);
    });
  },

  openGalleryModal(item) {
    engine.track("gallery");
    const author = engine.getCharacter(item.author);
    const liked = engine.hasGalleryLike(item.id, this.playerId);
    const count = engine.getGalleryLikeCount(item.id);
    const likers = [...(engine.galleryLikes[item.id] || [])]
      .map(id => engine.getCharacter(id)?.name?.split(" ")[0])
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
    const comments = engine.getGalleryComments(item.id);
    const options = engine.getGalleryCommentOptions(item);
    const commentsHtml = comments.map(cm => {
      const ca = engine.getCharacter(cm.author);
      return `<div class="comment">${this.avatarHTML(ca, "sm")}
        <div class="text"><span class="author" data-id="${cm.author}">${ca?.name || ""}</span> ${this.formatText(cm.text)}</div></div>`;
    }).join("") || '<p class="no-comments">Коментарів ще немає</p>';

    document.getElementById("modal-body").innerHTML = `
      <div style="font-size:4rem;text-align:center;margin-bottom:12px">${item.emoji}</div>
      <p><strong class="author" data-id="${item.author}" style="cursor:pointer">${author.name}</strong></p>
      <p style="margin:8px 0">${item.desc}</p>
      <p style="font-size:0.85rem;color:var(--text-muted)">Теги: ${item.tags.join(", ")}</p>
      <p style="font-size:0.85rem;margin-top:6px" id="gallery-like-info">
        ${count ? "❤️ " + count + (likers ? " · " + likers : "") : "Поки без вподобайок"}
      </p>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" id="btn-gallery-like">${liked ? "❤️ Подобається" : "🤍 Подобається"}</button>
        <button class="btn-danger" id="btn-gallery-report">Скарга</button>
      </div>
      <div class="gallery-comments" style="margin-top:16px">
        <h3 style="font-size:0.95rem;margin-bottom:8px">Коментарі</h3>
        <div id="gallery-comments-list">${commentsHtml}</div>
        <p style="font-size:0.8rem;margin:10px 0 6px;opacity:0.9">Твій коментар (обери):</p>
        <div class="quick-replies" id="gallery-comment-options">
          ${options.map((o, i) => `<button type="button" data-opt="${i}">${this.escape(o)}</button>`).join("")}
        </div>
      </div>
    `;
    document.getElementById("gallery-modal").hidden = false;

    document.getElementById("btn-gallery-like").onclick = () => {
      engine.toggleGalleryLike(item.id, this.playerId);
      this.openGalleryModal(item);
      this.renderGallery();
    };
    document.getElementById("btn-gallery-report").onclick = () => {
      alert("Скаргу надіслано. Модератори (тобто ніхто) подивляться… колись.");
    };
    document.getElementById("gallery-comment-options").onclick = (e) => {
      const btn = e.target.closest("button[data-opt]");
      if (!btn) return;
      const text = options[+btn.dataset.opt];
      if (!text) return;
      engine.addGalleryComment(item.id, this.playerId, text);
      this.openGalleryModal(item);
    };
    document.getElementById("modal-body").onclick = (e) => {
      const a = e.target.closest(".author");
      if (a?.dataset.id) {
        document.getElementById("gallery-modal").hidden = true;
        this.openBotProfile(a.dataset.id);
      }
    };
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
        ${this.avatarHTML(c, "", st.online ? "online" : "")}
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
      <div class="chat-user-link" data-id="${toId}" style="display:flex;align-items:center;gap:10px;cursor:pointer">
        ${this.avatarHTML(c, "sm", s.online ? "online" : "")}
        <div><strong>${c.name}</strong><br><span style="font-size:0.8rem;opacity:0.9">${s.online ? (s.status + (engine.activityRemainingLabel(toId) ? " · " + engine.activityRemainingLabel(toId) : "")) : "не в мережі"}</span></div>
      </div>
    `;
    this.renderChatMessages();
    this.renderQuickReplies();
    this.switchView("chat");

    const link = document.querySelector("#chat-user-info .chat-user-link");
    if (link) link.onclick = () => this.openBotProfile(toId);

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

    const decision = engine.botMayReply(this.playerId, this.currentChatId, text);
    const box = document.getElementById("chat-messages");
    const name = engine.getCharacter(this.currentChatId)?.name?.split(" ")[0] || "";

    // Офлайн — без набору і без відповіді
    if (!decision || decision.type === "offline") {
      const note = document.createElement("div");
      note.className = "msg system";
      note.textContent = name + " зараз не в мережі. Повідомлення чекатиме.";
      box.appendChild(note);
      box.scrollTop = box.scrollHeight;
      return;
    }
    if (decision.type === "ignore") return;

    const typing = document.createElement("div");
    typing.className = "typing";
    typing.id = "typing-indicator";
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
      // Якщо за час набору вийшов з мережі — відповіді немає
      if (!engine.getState(this.currentChatId)?.online) {
        typing.remove();
        return;
      }
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
      b.classList.toggle("active", b.dataset.view === name || (name === "chat" && b.dataset.view === "messages"));
    });
    document.body.classList.toggle("chat-open", name === "chat");
    if (name === "feed") this.renderFeed();
    if (name === "profile") this.renderProfile();
    // Чужий профіль фарбує тема друга; усі інші екрани — тема Яні
    if (name !== "bot-profile") {
      this.viewingProfileId = null;
      this.applyTheme(this.playerId);
    }
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
