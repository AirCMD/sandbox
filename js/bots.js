/* ============================================
   Логіка ботів — ігри, діалоги, досягнення
   Мінімальне навантаження пам'яті
   ============================================ */

class BotEngine {
  constructor() {
    this.state = {};
    this.relations = JSON.parse(JSON.stringify(INITIAL_RELATIONS));
    this.posts = [];
    this.messages = {};
    this.blocked = {};
    this.meetings = [];
    this.activeGames = [];
    this.gossipLog = [];
    // Статистика гравця для досягнень
    this.stats = {
      likes: 0,
      messages: 0,
      meetings: 0,
      meetings_accepted: 0,
      games: 0,
      games_won: 0,
      posts: 0,
      friends_added: 0,
      talk_owl: 0,
      see_drama: 0,
      talk_jini: 0,
      talk_crush: 0,
      profiles: 0,
      gallery: 0,
      unique_games: new Set(),
      unlocked: new Set(),
      profileVisited: new Set()
    };
    this.loadStats();
    this.init();
  }

  loadStats() {
    try {
      const raw = localStorage.getItem("viterecz_stats");
      if (!raw) return;
      const s = JSON.parse(raw);
      Object.assign(this.stats, s);
      this.stats.unique_games = new Set(s.unique_games || []);
      this.stats.unlocked = new Set(s.unlocked || []);
      this.stats.profileVisited = new Set(s.profileVisited || []);
    } catch (_) {}
  }

  saveStats() {
    try {
      const s = {
        ...this.stats,
        unique_games: [...this.stats.unique_games],
        unlocked: [...this.stats.unlocked],
        profileVisited: [...this.stats.profileVisited]
      };
      localStorage.setItem("viterecz_stats", JSON.stringify(s));
    } catch (_) {}
  }

  track(key, amount = 1, meta) {
    if (key === "unique_games" && meta) {
      this.stats.unique_games.add(meta);
    } else if (key === "profileVisited" && meta) {
      this.stats.profileVisited.add(meta);
      this.stats.profiles = this.stats.profileVisited.size;
    } else if (typeof this.stats[key] === "number") {
      this.stats[key] += amount;
    }
    this.checkAchievements();
    this.saveStats();
  }

  checkAchievements() {
    const newly = [];
    ACHIEVEMENTS.forEach(a => {
      if (this.stats.unlocked.has(a.id)) return;
      let val = 0;
      if (a.condition === "unique_games") val = this.stats.unique_games.size;
      else if (a.condition === "profiles") val = this.stats.profileVisited.size;
      else val = this.stats[a.condition] || 0;
      if (val >= a.target) {
        this.stats.unlocked.add(a.id);
        newly.push(a);
      }
    });
    if (newly.length && typeof UI !== "undefined" && UI.showAchievementToast) {
      newly.forEach(a => UI.showAchievementToast(a));
    }
    return newly;
  }

  getUnlockedAchievements() {
    return ACHIEVEMENTS.filter(a => this.stats.unlocked.has(a.id));
  }

  getAchievementProgress() {
    return ACHIEVEMENTS.map(a => {
      let val = 0;
      if (a.condition === "unique_games") val = this.stats.unique_games.size;
      else if (a.condition === "profiles") val = this.stats.profileVisited.size;
      else val = this.stats[a.condition] || 0;
      return { ...a, current: Math.min(val, a.target), unlocked: this.stats.unlocked.has(a.id) };
    });
  }

  init() {
    const now = Date.now();
    CHARACTERS.forEach(c => {
      this.state[c.id] = {
        mood: c.defaultMood,
        status: this.pickStatus(c),
        thought: this.pickThought(c.defaultMood),
        online: this.shouldBeOnline(c),
        lastActive: now - Math.random() * 3600000,
        friends: Object.entries(this.relations[c.id] || {})
          .filter(([, r]) => ["friend", "close", "crush"].includes(r))
          .map(([id]) => id)
      };
      this.blocked[c.id] = new Set();
    });

    SAMPLE_POSTS.forEach((p, i) => {
      this.posts.push({
        id: "p" + i,
        author: p.author,
        text: p.text,
        likes: new Set(p.likes || []),
        comments: this.generateInitialComments(p),
        weirdTime: this.generateWeirdTime(),
        ts: now - (SAMPLE_POSTS.length - i) * 7200000
      });
      if (p.text.includes("@sayuri") || (p.author === "derek" && p.text.includes("біс"))) {
        // drama exists in feed
      }
    });

    this.scheduleTicks();
  }

  pickStatus(char) {
    if (char.isOwl && this.isDay()) {
      return ["сплю", "не турбувати", "відпочиваю"][Math.floor(Math.random() * 3)];
    }
    const pool = STATUSES.filter(s => {
      if (char.gender === "m" && s.includes("втомлена")) return false;
      if (char.gender === "f" && s.includes("втомлений")) return false;
      return true;
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  pickThought(mood) {
    const list = THOUGHTS[mood] || THOUGHTS["спокійний"];
    return list[Math.floor(Math.random() * list.length)];
  }

  shouldBeOnline(char) {
    const hour = new Date().getHours();
    if (char.isOwl) return hour >= 22 || hour < 8 || Math.random() > 0.55;
    return hour >= 8 && hour < 23 ? Math.random() > 0.25 : Math.random() > 0.75;
  }

  isDay() {
    const h = new Date().getHours();
    return h >= 8 && h < 20;
  }

  generateWeirdTime() {
    const symbols = "◈◇◆○●◎◌◍◐◑◒◓◔◕◖◗◘◙◚◛";
    let s = "";
    for (let i = 0; i < 7; i++) s += symbols[Math.floor(Math.random() * symbols.length)];
    return s;
  }

  generateInitialComments(post) {
    const comments = [];
    CHARACTERS.forEach(c => {
      if (c.id === post.author || Math.random() > 0.5) return;
      const rel = this.relations[c.id]?.[post.author] || "neutral";
      if (rel === "blocked") return;
      comments.push({
        author: c.id,
        text: this.makeComment(rel, this.state[c.id]?.mood || "спокійний", post.text)
      });
    });
    return comments.slice(0, 4);
  }

  makeComment(rel, mood, postText) {
    if (rel === "annoyed") return ["Серйозно?", "Бісить вже", "Не читай це."][Math.floor(Math.random()*3)];
    if (rel === "crush") return ["Ти завжди так пишеш... ✨", "Подобається", "Згадав/згадала тебе"][Math.floor(Math.random()*3)];
    if (rel === "close") return ["Кіса, ти топ 💕", "Розкажи детальніше!", "Я з тобою"][Math.floor(Math.random()*3)];
    if (mood === "сумний") return ["Розумію...", "Тримайся", "Я поруч"];
    if (mood === "веселий") return ["Хаха 😂", "Це смішно!", "Підтримую!"];
    if (mood === "злий" || mood === "роздратований") return ["Ну ок", "Ага", "Цікаво..."];
    return ["Круто", "Згоден/згодна", "Гарно", "👍"][Math.floor(Math.random()*4)];
  }

  getCharacter(id) { return CHARACTERS.find(c => c.id === id); }
  getState(id) { return this.state[id]; }

  getRelation(from, to) {
    if (this.blocked[from]?.has(to) || this.blocked[to]?.has(from)) return "blocked";
    return this.relations[from]?.[to] || "neutral";
  }

  getThemeClass(mood) {
    return (MOOD_THEMES[mood] || MOOD_THEMES["спокійний"]).class;
  }

  toggleLike(postId, userId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
    if (post.likes.has(userId)) post.likes.delete(userId);
    else {
      post.likes.add(userId);
      if (userId === (typeof UI !== "undefined" ? UI.playerId : null)) {
        this.track("likes");
        if (post.author === "derek" && post.text.includes("біс")) this.track("see_drama");
      }
    }
  }

  addPost(authorId, text) {
    this.posts.unshift({
      id: "p" + Date.now(),
      author: authorId,
      text,
      likes: new Set(),
      comments: [],
      weirdTime: this.generateWeirdTime(),
      ts: Date.now()
    });
    if (typeof UI !== "undefined" && authorId === UI.playerId) this.track("posts");
    setTimeout(() => this.botsReactToPost(this.posts[0]), 1800 + Math.random() * 4000);
  }

  botsReactToPost(post) {
    CHARACTERS.forEach(c => {
      if (c.id === post.author || !this.state[c.id].online) return;
      if (Math.random() > 0.5) return;
      const rel = this.getRelation(c.id, post.author);
      if (rel === "blocked") return;
      if (Math.random() > 0.35) post.likes.add(c.id);
      if (Math.random() > 0.6) {
        post.comments.push({
          author: c.id,
          text: this.makeComment(rel, this.state[c.id].mood, post.text)
        });
      }
    });
  }

  /* ---- Месенджер ---- */
  getQuickReplies(fromId, toId) {
    const pairKey = [fromId, toId].sort().join("_");
    const special = SPECIAL_DIALOGS[`${fromId}_${toId}`] || SPECIAL_DIALOGS[pairKey];
    const rel = this.getRelation(fromId, toId);
    const mood = this.state[fromId]?.mood || "спокійний";
    const pool = QUICK_MESSAGES[rel] || QUICK_MESSAGES.neutral;
    let list = [...(pool[mood] || pool.default || ["Привіт"])];
    if (special && Math.random() > 0.4) {
      list = [...special.slice(0, 3), ...list].slice(0, 6);
    }
    // Додати репліки про інтереси
    const target = this.getCharacter(toId);
    if (target && Math.random() > 0.5) {
      const interest = target.interests[Math.floor(Math.random() * target.interests.length)];
      list.push(`Як там з «${interest}»?`);
    }
    return [...new Set(list)].slice(0, 6);
  }

  botMayReply(fromId, toId) {
    const rel = this.getRelation(toId, fromId);
    if (rel === "blocked") return null;
    const mood = this.state[toId]?.mood;
    if (["закритий", "апатія", "злий"].includes(mood) && Math.random() < 0.55) return { type: "ignore" };
    if (rel === "annoyed" && Math.random() < 0.7) return { type: "ignore" };
    if (Math.random() < 0.18) return { type: "read_only" };
    if (Math.random() < 0.12) return { type: "typing_then_cancel" };

    const delay = 1200 + Math.random() * 5500;
    // Спеціальна відповідь
    const special = SPECIAL_DIALOGS[`${toId}_${fromId}`];
    let text;
    if (special && Math.random() > 0.45) {
      text = special[Math.floor(Math.random() * special.length)];
    } else {
      const replies = this.getQuickReplies(toId, fromId);
      text = replies[Math.floor(Math.random() * replies.length)];
    }
    return { type: "reply", text, delay };
  }

  onPlayerMessage(fromId, toId) {
    this.track("messages");
    const target = this.getCharacter(toId);
    if (target?.isOwl) this.track("talk_owl");
    if (toId === "jini") this.track("talk_jini");
    const me = this.getCharacter(fromId);
    if (me && target && (me.likes || []).includes(toId)) this.track("talk_crush");
    if (fromId === "yani" && toId === "akira") this.track("talk_crush");
    if (fromId === "akira" && toId === "yani") this.track("talk_crush");
  }

  /* ---- Плітки ---- */
  maybeGossip() {
    const gossips = [
      { from: "jini", text: "Чула, що @sayuri знову писала @derek... а він її в ігнор 😅" },
      { from: "jini", text: "Хтось бачив, як @akira дивиться на сторінку @yani по 20 разів на день? 👀" },
      { from: "cornel", text: "Кажуть, @derek знову вибухнув у коментарях. Класика." },
      { from: "cornel", text: "Чутки: @kate ігнорує всіх, хто пише їй про почуття. Правда?" },
      { from: "jini", text: "@giki знову не спала всю ніч. Код > сон, я правильно розумію?" },
      { from: "derek", text: "Офіційна заява: @sayuri, відчепись. Ти мене бісиш. Крапка." },
      { from: "jini", text: "А хтось помітив, що @kent і @kate мають підозріло схожі інтереси? 🐴🏃" },
      { from: "cornel", text: "На барахолці знову рідкість. Хто перший — той і забрав. @akira тобі б зайшло." }
    ];
    if (Math.random() > 0.4) return;
    const g = gossips[Math.floor(Math.random() * gossips.length)];
    if (!this.state[g.from]?.online) return;
    this.addPost(g.from, g.text);
    this.gossipLog.push({ ...g, ts: Date.now() });
  }

  /* ---- Зустрічі ---- */
  proposeMeeting(fromId, toId) {
    const place = MEETUP_PLACES[Math.floor(Math.random() * MEETUP_PLACES.length)];
    const meeting = { from: fromId, to: toId, place, ts: Date.now(), status: "pending" };
    this.meetings.push(meeting);
    if (typeof UI !== "undefined" && fromId === UI.playerId) this.track("meetings");
    setTimeout(() => {
      const rel = this.getRelation(toId, fromId);
      const mood = this.state[toId]?.mood;
      if (rel === "annoyed" || ["закритий", "злий", "апатія"].includes(mood)) {
        meeting.status = "declined";
      } else if (Math.random() > 0.35) {
        meeting.status = "accepted";
        if (typeof UI !== "undefined" && fromId === UI.playerId) this.track("meetings_accepted");
      } else {
        meeting.status = "declined";
      }
    }, 3000 + Math.random() * 5000);
    return meeting;
  }

  /* ---- Ігри (розширені) ---- */
  startGame(gameId, players) {
    const game = GAMES.find(g => g.id === gameId);
    if (!game) return null;
    const scores = {};
    players.forEach(p => { scores[p] = 0; });
    const session = {
      id: "g" + Date.now(),
      gameId,
      name: game.name,
      emoji: game.emoji,
      actions: game.actions || ["хід"],
      winText: game.winText || "Перемога!",
      players: [...players],
      scores,
      status: "playing",
      log: [`${game.emoji} ${game.name} почалася! Гравці: ${players.map(p => this.getCharacter(p)?.name || p).join(", ")}`],
      ts: Date.now(),
      round: 0,
      maxRounds: 5 + Math.floor(Math.random() * 3)
    };
    this.activeGames.unshift(session);
    if (typeof UI !== "undefined" && players.includes(UI.playerId)) {
      this.track("games");
      this.track("unique_games", 1, gameId);
    }

    let step = 0;
    const interval = setInterval(() => {
      if (step >= session.maxRounds || session.status !== "playing") {
        clearInterval(interval);
        session.status = "finished";
        let winner = players[0];
        let best = -1;
        players.forEach(p => {
          if (session.scores[p] > best) { best = session.scores[p]; winner = p; }
        });
        // нічия випадково
        if (Math.random() > 0.85) {
          session.log.push(`Нічия! Усі молодці.`);
        } else {
          session.winner = winner;
          session.log.push(`${session.winText} Переможець: ${this.getCharacter(winner)?.name || winner} (${best} очок)!`);
          if (typeof UI !== "undefined" && winner === UI.playerId) this.track("games_won");
        }
        // Коментарі ботів після гри
        players.filter(p => p !== (typeof UI !== "undefined" ? UI.playerId : null)).forEach(p => {
          if (Math.random() > 0.4) {
            const phrases = ["Було класно!", "Ще раз якось!", "Ти добре граєш", "Майже переміг/перемогла...", "Ремatch?"];
            session.log.push(`${this.getCharacter(p)?.name}: ${phrases[Math.floor(Math.random() * phrases.length)]}`);
          }
        });
        return;
      }

      const p = session.players[step % session.players.length];
      const name = this.getCharacter(p)?.name || p;
      const action = session.actions[Math.floor(Math.random() * session.actions.length)];
      const points = 1 + Math.floor(Math.random() * 4);
      session.scores[p] += points;
      const flavor = [
        `${name}: ${action} (+${points})`,
        `${name} обирає «${action}» — вдало! +${points}`,
        `${name}: ${action}. Напруга росте... +${points}`
      ];
      session.log.push(flavor[Math.floor(Math.random() * flavor.length)]);
      session.round = step + 1;
      step++;
    }, 2200);
    return session;
  }

  playerGameAction(sessionId, actionIndex) {
    const session = this.activeGames.find(s => s.id === sessionId);
    if (!session || session.status !== "playing") return null;
    const playerId = typeof UI !== "undefined" ? UI.playerId : null;
    if (!playerId || !session.players.includes(playerId)) return null;
    const action = session.actions[actionIndex % session.actions.length];
    const points = 2 + Math.floor(Math.random() * 4);
    session.scores[playerId] += points;
    const name = this.getCharacter(playerId)?.name || "Ти";
    session.log.push(`${name}: ${action} (+${points}) ⭐`);
    return session;
  }

  scheduleTicks() {
    const tick = () => {
      CHARACTERS.forEach(c => {
        if (Math.random() > 0.72) {
          const newMood = MOODS[Math.floor(Math.random() * MOODS.length)];
          this.state[c.id].mood = newMood;
          this.state[c.id].thought = this.pickThought(newMood);
        }
        if (Math.random() > 0.8) this.state[c.id].status = this.pickStatus(c);
        if (Math.random() > 0.85) this.state[c.id].online = this.shouldBeOnline(c);
      });
      if (Math.random() > 0.7) this.maybeGossip();
      if (Math.random() > 0.85 && this.state["sayuri"]?.online) this.maybeSayuriDerekDrama();
      // Боти іноді самі починають ігри
      if (Math.random() > 0.92) this.botsStartGame();
      setTimeout(tick, 22000 + Math.random() * 18000);
    };
    setTimeout(tick, 12000);
  }

  botsStartGame() {
    const online = CHARACTERS.filter(c => this.state[c.id]?.online);
    if (online.length < 2) return;
    const game = GAMES[Math.floor(Math.random() * GAMES.length)];
    const players = online.sort(() => Math.random() - 0.5).slice(0, 2 + (Math.random() > 0.5 ? 1 : 0)).map(c => c.id);
    this.startGame(game.id, players);
  }

  maybeSayuriDerekDrama() {
    if (Math.random() > 0.5) {
      this.addPost("sayuri", "Дерек... чому ти такий? Я ж просто хочу бути поруч 💗 @derek");
    } else if (this.state["derek"]?.online && Math.random() > 0.4) {
      this.addPost("derek", "Ще раз: @sayuri, відчепись. Ти мене буквально бісиш. Це офіційна відмова.");
    }
  }

  maybeAutoPost(playerId) {
    if (Math.random() > 0.35) return;
    const s = this.state[playerId];
    const texts = [
      s.thought,
      `Сьогодні я ${s.status}`,
      "Просто ділюся моментом.",
      "Думаю про " + (this.getCharacter(playerId)?.interests[0] || "всяке")
    ];
    this.addPost(playerId, texts[Math.floor(Math.random() * texts.length)]);
  }

  searchCharacters(query) {
    if (!query || query.length < 1) return CHARACTERS;
    const q = query.toLowerCase();
    return CHARACTERS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.bio.toLowerCase().includes(q) ||
      c.interests.some(i => i.includes(q)) ||
      c.job.toLowerCase().includes(q)
    );
  }

  searchPosts(query) {
    if (!query || query.length < 2) return this.posts;
    const q = query.toLowerCase();
    return this.posts.filter(p => p.text.toLowerCase().includes(q));
  }
}

const engine = new BotEngine();
