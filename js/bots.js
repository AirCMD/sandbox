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
    // Лайки галереї: { itemId: Set of userIds }
    this.galleryLikes = {};
    this.galleryComments = {};
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
    this.initGalleryLikes();
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
      const act = this.pickActivity(c);
      this.state[c.id] = {
        mood: c.defaultMood,
        status: act.status,
        activityUntil: act.until,
        activityKind: act.kind,
        thought: this.pickThought(c.defaultMood, c.gender),
        online: this.shouldBeOnline(c, act),
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

  /**
   * Тривалість активностей у РЕАЛЬНИХ хвилинах (1:1).
   * Кіно / кінотеатр — мінімум ~1.5–2.5 години, робота — зміни, сон — довго.
   */
  activityDurationMin(status) {
    const table = {
      "в кінотеатрі": [100, 160],
      "в кафе з друзями": [60, 150],
      "на побаченні": [90, 180],
      "на побаченні (у фантазіях)": [25, 50],
      "граю в ігри": [45, 120],
      "на стрімі": [90, 210],
      "дивлюсь стрім": [50, 140],
      "дивлюсь кіно": [100, 155],
      "дивлюсь кіно про мультивсесвіт": [100, 155],
      "дивлюсь аніме": [24, 50],
      "сплю": [240, 480],
      "приймаю душ": [15, 30],
      "у ванній": [20, 40],
      "бігаю": [30, 60],
      "на тренуванні": [50, 100],
      "на тренуванні з кіньми": [60, 120],
      "пишу код": [50, 150],
      "дебажу програму": [40, 100],
      "працюю": [120, 240],
      "працюю в аніме-магазині": [180, 300],
      "працюю в магазині іграшок": [180, 300],
      "на роботі в Техсмітнику": [180, 300],
      "на поштовому відділенні": [150, 270],
      "на барахолці": [50, 120],
      "в дорозі": [40, 100],
      "медитую": [20, 45],
      "співаю": [25, 55],
      "не турбувати": [40, 100],
      "не турбувати (код)": [50, 120],
      "відпочиваю": [30, 90],
      "їм їжу": [20, 45]
    };
    const range = table[status] || [25, 60];
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  /** Реальні хвилини → мс (без прискорення: кіно реально 1.5–2.5 год) */
  gameMinutesToMs(min) {
    return min * 60 * 1000;
  }

  isBusyStatus(status) {
    return /кінотеатр|кафе з друзями|побаченн|сплю|душ|ванн|стрімі|тренуванн|в дорозі|не турбувати/i.test(status || "");
  }

  pickActivity(char) {
    const now = Date.now();
    if (char.isOwl && this.isDay() && Math.random() > 0.35) {
      const status = ["сплю", "не турбувати", "відпочиваю"][Math.floor(Math.random() * 3)];
      const mins = this.activityDurationMin(status);
      return { status, kind: "rest", until: now + this.gameMinutesToMs(mins), gameMinutes: mins };
    }
    const personal = STATUS_BY_CHAR[char.id] || [];
    const common = char.gender === "m" ? STATUS_COMMON_M : STATUS_COMMON_F;
    const pool = Math.random() < 0.75 && personal.length ? personal : [...personal, ...common];
    const status = pool[Math.floor(Math.random() * pool.length)];
    const mins = this.activityDurationMin(status);
    return {
      status,
      kind: this.isBusyStatus(status) ? "busy" : "idle",
      until: now + this.gameMinutesToMs(mins),
      gameMinutes: mins
    };
  }

  /** Застарілий API — лише рядок статусу */
  pickStatus(char) {
    return this.pickActivity(char).status;
  }

  activityRemainingLabel(id) {
    const st = this.state[id];
    if (!st?.activityUntil) return "";
    const leftMs = st.activityUntil - Date.now();
    if (leftMs <= 0) return "";
    const minLeft = leftMs / (60 * 1000);
    if (minLeft >= 60) {
      const h = Math.floor(minLeft / 60);
      const m = Math.round(minLeft % 60);
      return `ще ~${h} год${m ? " " + m + " хв" : ""}`;
    }
    return `ще ~${Math.max(1, Math.round(minLeft))} хв`;
  }

  pickThought(mood, gender = "f") {
    const list = THOUGHTS[mood] || THOUGHTS["спокійний"];
    let t = list[Math.floor(Math.random() * list.length)];
    if (gender === "f") {
      t = t.replace(/нього\/неї/g, "нього")
           .replace(/першим\/першою/g, "першою");
    } else {
      t = t.replace(/нього\/неї/g, "неї")
           .replace(/першим\/першою/g, "першим");
    }
    return t;
  }

  shouldBeOnline(char, act) {
    const status = act?.status || this.state[char.id]?.status;
    // Під час сну / душу / кіно — частіше «не в мережі»
    if (/^сплю$|приймаю душ|у ванній/i.test(status || "")) return Math.random() > 0.85;
    if (/в кінотеатрі|на побаченні$|в дорозі/i.test(status || "")) return Math.random() > 0.55;
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
    const used = new Set();
    const order = [...CHARACTERS].sort(() => Math.random() - 0.5);
    for (const c of order) {
      if (c.id === post.author || Math.random() > 0.42) continue;
      const rel = this.relations[c.id]?.[post.author] || "neutral";
      if (rel === "blocked") continue;
      const text = this.makeComment(rel, this.state[c.id]?.mood || "спокійний", post.text, c.id, used, post.author);
      if (!text) continue;
      used.add(this.normPhrase(text));
      comments.push({ author: c.id, text });
      if (comments.length >= 4) break;
    }
    return comments;
  }

  normPhrase(t) {
    return (t || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  }

  /**
   * Узгодження роду. pairs: [жіноча, чоловіча]
   * gender: "f" | "m"
   */
  genderize(text, gender) {
    if (!text) return text;
    const isF = gender === "f";
    // [female, male] — обидва порядки слеша підтримуються
    const pairs = [
      ["написала", "написав"], ["написала", "написав"],
      ["подумала", "подумав"], ["згадала", "згадав"],
      ["хотіла", "хотів"], ["готова", "готовий"],
      ["заряджена", "заряджений"], ["важлива", "важливий"],
      ["згодна", "згоден"], ["думала", "думав"],
      ["скучила", "скучив"], ["чула", "чув"],
      ["вільна", "вільний"], ["склала", "склав"],
      ["змогла", "зміг"], ["бачила", "бачив"],
      ["не бачила", "не бачив"], ["усміхнулась", "усміхнувся"],
      ["поговорила", "поговорив"], ["зберегла", "зберіг"],
      ["прочитала", "прочитав"], ["побачила", "побачив"],
      ["відзначила", "відзначив"], ["показала", "показав"],
      ["поділилась", "поділився"], ["зрозуміла", "зрозумів"],
      ["рада", "рад"], ["зайнята", "зайнятий"],
      ["першою", "першим"], ["готова", "готовий"]
    ];
    let out = text;
    // слеш-форми: а/б у будь-якому порядку
    for (const [f, m] of pairs) {
      const pick = isF ? f : m;
      const re1 = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\/" + m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const re2 = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\/" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      out = out.replace(re1, pick).replace(re2, pick);
    }
    // «не X/не Y»
    out = out.replace(/не\s+([а-яіїєґ'А-ЯІЇЄҐ]+)\s*\/\s*не\s+([а-яіїєґ'А-ЯІЇЄҐ]+)/gi, (_, a, b) => {
      // якщо a закінчується на ла/лась — жіноче
      const fem = /ла$|лась$|лася$/i.test(a) ? a : b;
      const mas = /ла$|лась$|лася$/i.test(a) ? b : a;
      return "не " + (isF ? fem : mas);
    });
    // окремі фікси
    if (isF) {
      out = out
        .replace(/\bЗгоден\b/g, "Згодна").replace(/\bзгоден\b/g, "згодна")
        .replace(/\bДумав\b/g, "Думала").replace(/\bдумав\b/g, "думала")
        .replace(/\bЗгадав\b/g, "Згадала").replace(/\bГотовий\b/g, "Готова")
        .replace(/\bЗаряджений\b/g, "Заряджена")
        .replace(/\bРад\b(?=\s)/g, "Рада").replace(/\bрад\b(?=\s)/g, "рада");
    } else {
      out = out
        .replace(/\bЗгодна\b/g, "Згоден").replace(/\bзгодна\b/g, "згоден")
        .replace(/\bДумала\b/g, "Думав").replace(/\bдумала\b/g, "думав")
        .replace(/\bЗгадала\b/g, "Згадав").replace(/\bГотова\b/g, "Готовий")
        .replace(/\bЗаряджена\b/g, "Заряджений")
        .replace(/Привіт, рідненька/g, "Привіт")
        .replace(/\bСкучила\b/g, "Скучив")
        .replace(/\bЗгадувала тебе\b/g, "Згадував тебе")
        .replace(/\bЖарт чула\?/g, "Жарт чув?")
        .replace(/коли будеш вільна/g, "коли будеш вільний")
        .replace(/Ти мені важлива/g, "Ти мені важливий")
        .replace(/\bРада\b(?=\s)/g, "Рад").replace(/\bрада\b(?=\s)/g, "рад");
    }
    // прибрати залишкові слеші виду слово/слово
    out = out.replace(/([А-Яа-яІіЇїЄєҐґ']+)\/([А-Яа-яІіЇїЄєҐґ']+)/g, (_, a, b) => {
      // евристика: жіночі закінчення
      const aF = /ла$|лась$|лася$|на$|та$|ая$/i.test(a);
      const bF = /ла$|лась$|лася$|на$|та$|ая$/i.test(b);
      if (aF && !bF) return isF ? a : b;
      if (bF && !aF) return isF ? b : a;
      return isF ? a : b;
    });
    return out;
  }

  /**
   * Коментар: рід мовця (я …) + рід автора допису (ти …)
   * Маркер {a:...} — форма про автора допису; решта — про мовця.
   */
  makeComment(rel, mood, postText, speakerId, usedSet = null, authorId = null) {
    const speaker = this.getCharacter(speakerId);
    const author = this.getCharacter(authorId);
    const gSelf = speaker?.gender || "f";
    const gAuth = author?.gender || "f";
    const pt = (postText || "").toLowerCase();

    const finish = (raw) => {
      if (!raw) return null;
      // спочатку форми про автора {a:написала/написав}
      let t = raw.replace(/\{a:([^}]+)\}/g, (_, form) => this.genderize(form, gAuth));
      t = this.genderize(t, gSelf);
      return t;
    };

    const pick = (arr) => {
      const free = arr.filter(t => {
        const n = this.normPhrase(finish(t));
        if (!n || n.length < 2) return false;
        if (usedSet && usedSet.has(n)) return false;
        if (usedSet && n.length <= 6) {
          for (const u of usedSet) if (u.length <= 6 && (u === n || u.includes(n) || n.includes(u))) return false;
        }
        return true;
      });
      if (!free.length) return null;
      return free[Math.floor(Math.random() * free.length)];
    };

    let pool = [];

    if (/кіно|фільм|сеанс/.test(pt)) {
      pool = ["Теж хочу в кіно на вихідних", "Що саме дивились?", "О, і як враження після титрів?", "Я б склала/склав компанію"];
    } else if (/код|програм|дебаж|баг/.test(pt)) {
      pool = ["Поважаю терпіння з багами", "У мене теж був такий вечір у редакторі", "Головне — не спалити дедлайн", "Якщо що, можу глянути свіжим оком"];
    } else if (/тамагочі|стікер|блокнот|канцеляр/.test(pt)) {
      pool = ["Покажи фото колекції, якщо можна", "Я б таке теж хотіла/хотів", "Канцелярія — слабка сторона", "Звучить затишно"];
    } else if (/біг|спорт|тренув|кінь|коні/.test(pt)) {
      pool = ["Повага до дисципліни", "Я б так не змогла/не зміг щодня", "Погода сьогодні якраз для цього", "Тримай темп"];
    } else if (/аніме|дакімакур|стрім|ігр/.test(pt)) {
      pool = ["Що за тайтл?", "Класика нічного сеансу", "Скинь назву, цікаво", "Знайоме відчуття"];
    } else if (/сумн|поган|важк|самот|втоми/.test(pt)) {
      pool = ["Чую тебе. Якщо треба — напиши в особисті", "Тримайся, це мине", "Не треба тримати все в собі", "Можна просто помовчати разом"];
    } else if (/плітк|чутк|біс|дратує|відмов/.test(pt)) {
      pool = ["Ого, напруга…", "Краще б без публічного розносу", "Некомфортно це читати, чесно", "Може, варто охолонути?"];
    }

    if (!pool.length) {
      if (rel === "annoyed") {
        pool = ["Серйозно?", "Краще б не бачила/не бачив цього", "Мені вже досить таких постів", "Не мій формат"];
      } else if (rel === "crush") {
        pool = ["Завжди цікаво читати твої думки", "Усміхнулась/усміхнувся, читаючи", "Напиши ще, якщо буде бажання", "Ти вмієш підмічати дрібниці"];
      } else if (rel === "close") {
        pool = [
          "Розкажи трохи більше, цікаво",
          "Я б з тобою про це поговорила/поговорив",
          "Звучить по-твоєму",
          "Зберегла/зберіг у голові",
          speaker?.id === "jini" ? "О, є деталі? Я вся увага" : "Підтримую"
        ];
      } else if (mood === "сумний") {
        pool = ["Розумію настрій", "Сьогодні важкуватий день і в мене", "Дякую, що ділишся", "Нехай хоч трохи відпустить"];
      } else if (mood === "веселий") {
        pool = ["Це підняло настрій", "Ха, добре написано", "Усмішка неконтрольована", "Зайшло"];
      } else if (mood === "злий" || mood === "роздратований") {
        pool = ["Ну… ок", "Не в настрої розганяти", "Прочитала/прочитав, далі"];
      } else {
        pool = [
          "Цікавий погляд",
          "Має сенс",
          "Не подумала/не подумав з такого боку",
          // рід автора допису (ти), не мовця
          "Дякую, що {a:написала/написав}",
          "Гарно {a:написала/написав}",
          "Під цим можу підписатись",
          "Збережу на потім",
          "Трохи резонує",
          "Спокійно і по суті — імпонує"
        ];
      }
    }

    if (speaker?.id === "cornel" && Math.random() > 0.5) {
      pool = pool.concat(["Чув іншу версію цієї історії…", "Цікаво, хто ще це бачив"]);
    }
    if (speaker?.id === "giki" && Math.random() > 0.55) {
      pool = pool.concat(["Логічно складено", "Можна було б ще глибше копнути"]);
    }
    if (speaker?.id === "derek" && Math.random() > 0.6) {
      pool = pool.concat(["Як завжди, всі все знають…", "Мене вже мало що дивує"]);
    }

    const chosen = pick(pool);
    if (!chosen) {
      const fallback = [
        `Про ${speaker?.interests?.[0] || "це"} я б ще поговорила/поговорив`,
        "Залишу без короткого «ок» — просто побачила/побачив і відзначила/відзначив",
        "Мовчки ставлю вподобайку в голові"
      ];
      return finish(pick(fallback));
    }
    return finish(chosen);
  }

  getCharacter(id) { return CHARACTERS.find(c => c.id === id); }
  getState(id) { return this.state[id]; }

  /** Відмінювання настрою для відображення */
  moodLabel(mood, gender) {
    if (!mood) return "";
    if (gender === "f") {
      const map = {
        закоханий: "закохана", щасливий: "щаслива", веселий: "весела",
        спокійний: "спокійна", сумний: "сумна", натхненний: "натхненна",
        творчий: "творча", злий: "зла", роздратований: "роздратована",
        тривожний: "тривожна", панічний: "у паніці", закритий: "закрита",
        байдужий: "байдужа", соціальний: "соціальна", енергійний: "енергійна",
        нейтральний: "нейтральна"
      };
      return map[mood] || mood;
    }
    const mapM = {
      апатія: "в апатії", панічний: "у паніці"
    };
    return mapM[mood] || mood;
  }

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

  initGalleryLikes() {
    if (typeof GALLERY === "undefined") return;
    GALLERY.forEach(item => {
      const set = new Set();
      CHARACTERS.forEach(c => {
        if (c.id !== item.author && Math.random() > 0.5) set.add(c.id);
      });
      this.galleryLikes[item.id] = set;
      const used = new Set();
      const comments = [];
      const order = [...CHARACTERS].sort(() => Math.random() - 0.5);
      for (const c of order) {
        if (c.id === item.author || Math.random() > 0.55) continue;
        const text = this.makeGalleryComment(item, c.id, used);
        if (!text) continue;
        used.add(this.normPhrase(text));
        comments.push({ author: c.id, text, ts: Date.now() - Math.random() * 1e7 });
        if (comments.length >= 3) break;
      }
      this.galleryComments[item.id] = comments;
    });
  }

  getGalleryComments(itemId) {
    return this.galleryComments[itemId] || [];
  }

  addGalleryComment(itemId, authorId, text) {
    if (!this.galleryComments[itemId]) this.galleryComments[itemId] = [];
    this.galleryComments[itemId].push({ author: authorId, text, ts: Date.now() });
    setTimeout(() => {
      const item = (typeof GALLERY !== "undefined" ? GALLERY : []).find(g => g.id == itemId);
      if (!item) return;
      const bots = CHARACTERS.filter(c => c.id !== authorId && this.state[c.id]?.online);
      if (!bots.length || Math.random() > 0.65) return;
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const used = new Set(this.galleryComments[itemId].map(c => this.normPhrase(c.text)));
      const reply = this.makeGalleryComment(item, bot.id, used, text);
      if (reply) {
        this.galleryComments[itemId].push({ author: bot.id, text: reply, ts: Date.now() });
        if (typeof UI !== "undefined") {
          try {
            const modal = document.getElementById("gallery-modal");
            if (modal && !modal.hidden) UI.openGalleryModal(item);
          } catch (_) {}
        }
      }
    }, 1500 + Math.random() * 2500);
  }

  getGalleryCommentOptions(item) {
    const blob = ((item.tags || []).join(" ") + " " + (item.desc || "")).toLowerCase();
    const base = [];
    const add = (arr) => arr.forEach(x => { if (!base.includes(x)) base.push(x); });
    if (/стікер|блокнот|канцеляр/.test(blob)) add(["Які стікери любиш найбільше?", "Розворот дуже затишний", "Де брала/брав блокноти?"]);
    if (/код|програм|скрін/.test(blob)) add(["Скільки годин пішло?", "Виглядає серйозно. Мова яка?", "Нічний код — класика"]);
    if (/кінь|подорож|пейзаж|схід|пробіж/.test(blob)) add(["Де це знято?", "Заздрю такому ранку", "Природа тут ідеальна"]);
    if (/аніме|колекц|дакімакур/.test(blob)) add(["З якої серії?", "Колекція росте", "Гарний кадр для полиці"]);
    if (/іграш|рукоділ|шила/.test(blob)) add(["Сама зшила? Красиво", "Можна купити таку?", "Дуже мило виглядає"]);
    if (/стрім|ігр|сетап|навуш/.test(blob)) add(["Який мікрофон?", "Сетап вогонь", "Коли наступний стрім?"]);
    if (/дощ|вікно|настрій|самот/.test(blob)) add(["Настрій відчувається", "Тиша після дощу особлива", "Гарний кадр, навіть якщо сумно"]);
    if (/барахол|короб|продаж/.test(blob)) add(["Що цікавого в партії?", "Ціна нормальна була?", "Люблю такі знахідки"]);
    if (/снек|журнал|пакет/.test(blob)) add(["Смішний колаж", "Скільки вже пакетів?", "Це вже мистецтво"]);
    add(["Дякую, що показала/показав", "Зберегла/зберіг у голові", "Дуже атмосферно", "Під цим можу підписатись"]);
    const gender = (typeof UI !== "undefined" && UI.playerId) ? (this.getCharacter(UI.playerId)?.gender || "f") : "f";
    return base.slice(0, 5).map(x => this.genderize(x, gender));
  }

  makeGalleryComment(item, speakerId, usedSet = null, replyTo = "") {
    const gender = this.getCharacter(speakerId)?.gender || "f";
    const tags = ((item.tags || []).join(" ") + " " + (item.desc || "") + " " + (replyTo || "")).toLowerCase();
    let pool = [];
    if (/стікер|блокнот/.test(tags)) pool = ["Стікери — слабкість", "Розворот ідеальний", "Канцелярія завжди заходить"];
    else if (/код|програм/.test(tags)) pool = ["Пізно, але продуктивно", "Очі після такого печуть, знаю", "Гарна структура"];
    else if (/кінь|подорож|схід|пробіж/.test(tags)) pool = ["Заздрю повітрю на фото", "Ранок як з листівки", "Треба теж вийти з дому"];
    else if (/аніме|колекц/.test(tags)) pool = ["Полиця мрії", "Знайомий вайб", "Колекція солідна"];
    else if (/іграш|рукоділ/.test(tags)) pool = ["Дуже тепло вийшло", "Руки золоті", "Хочу таку на полицю"];
    else if (/стрім|сетап|ігр/.test(tags)) pool = ["Сетап зібраний зі смаком", "Готовий/готова до ефіру", "Гарне світло"];
    else if (/дощ|вікно|сум/.test(tags)) pool = ["Атмосфера сильна", "Розумію цей настрій", "Тихо і чесно"];
    else if (/барахол|короб/.test(tags)) pool = ["Бізнес не спить", "Цікаво, що всередині", "Знахідки — окремий кайф"];
    else if (/снек|пакет/.test(tags)) pool = ["Хаха, серйозна колекція", "Це вже музей", "Смішно і мило"];
    else pool = ["Гарний кадр", "Зайшло", "Дякую, що поділилась/поділився", "Атмосферно"];
    if (replyTo) {
      pool = ["Згоден/згодна з цим", "Теж так думаю", "Доречне питання", "Можу в особисті детальніше"].concat(pool);
    }
    const free = pool.filter(x => {
      const n = this.normPhrase(this.genderize(x, gender));
      return n && !(usedSet && usedSet.has(n));
    });
    if (!free.length) return null;
    return this.genderize(free[Math.floor(Math.random() * free.length)], gender);
  }

  getGalleryLikeCount(itemId) {
    return (this.galleryLikes[itemId] || new Set()).size;
  }

  hasGalleryLike(itemId, userId) {
    return (this.galleryLikes[itemId] || new Set()).has(userId);
  }

  toggleGalleryLike(itemId, userId) {
    if (!this.galleryLikes[itemId]) this.galleryLikes[itemId] = new Set();
    const set = this.galleryLikes[itemId];
    if (set.has(userId)) {
      set.delete(userId);
      return false;
    }
    set.add(userId);
    if (userId === (typeof UI !== "undefined" ? UI.playerId : null)) {
      this.track("likes");
    }
    return true;
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
    const used = new Set((post.comments || []).map(c => this.normPhrase(c.text)));
    const online = CHARACTERS.filter(c =>
      c.id !== post.author && this.state[c.id]?.online && this.getRelation(c.id, post.author) !== "blocked"
    ).sort(() => Math.random() - 0.5);

    online.forEach((c, i) => {
      // не всі одразу — розкидано
      setTimeout(() => {
        if (Math.random() > 0.55) post.likes.add(c.id);
        if (Math.random() > 0.45) {
          const text = this.makeComment(
            this.getRelation(c.id, post.author),
            this.state[c.id].mood,
            post.text,
            c.id,
            used,
            post.author
          );
          if (text) {
            used.add(this.normPhrase(text));
            post.comments.push({ author: c.id, text });
            if (typeof UI !== "undefined" && UI.playerId) {
              try {
                UI.renderFeed(document.getElementById("search-posts")?.value || "");
                const active = document.querySelector(".view.active");
                if (active?.id === "view-profile" && post.author === UI.playerId) UI.renderProfileTab("posts");
                if (active?.id === "view-bot-profile") {
                  const hid = document.querySelector("#bot-profile-header .aero-avatar, #bot-profile-header [data-id]");
                  // reopen soft refresh via feed only
                }
              } catch (_) {}
            }
          }
        }
      }, 800 + i * (1200 + Math.random() * 2000));
    });
  }

  /* ---- Месенджер ---- */
  getQuickReplies(fromId, toId) {
    const speaker = this.getCharacter(fromId);
    const gender = speaker?.gender || "f";
    const target = this.getCharacter(toId);
    const rel = this.getRelation(fromId, toId);
    const special = SPECIAL_DIALOGS[`${fromId}_${toId}`];

    // Живі заготовки для гравця (не клони «як справи» у відповідь собі)
    let list = [
      "Привіт!",
      "Що в тебе нового?",
      "Давно не писали…",
      "Можна питання?",
      "Просто хотіла/хотів написати"
    ];
    if (rel === "close" || rel === "crush") {
      list = [
        "Привіт 💕",
        "Як ти насправді?",
        "Згадувала/згадував тебе",
        "Є хвилинка?",
        "Хочу поділитись чимось"
      ];
    }
    if (special) list = [...special.slice(0, 2), ...list];
    if (target?.interests?.length) {
      const interest = target.interests[Math.floor(Math.random() * target.interests.length)];
      list.push(`До речі про «${interest}»…`);
    }
    list.push("Пішли кудись як буде час");
    list.push("Ок, я просто тут");
    return [...new Set(list.map(t => this.genderize(t, gender)))].slice(0, 6);
  }

  botMayReply(fromId, toId, userMessage = "") {
    const st = this.state[toId];
    if (!st?.online) return { type: "offline" };

    const rel = this.getRelation(toId, fromId);
    if (rel === "blocked") return null;

    const mood = st.mood;
    const gender = this.getCharacter(toId)?.gender || "f";
    const busy = this.isBusyStatus(st.status) && st.activityUntil > Date.now();

    if (["закритий", "апатія", "злий"].includes(mood) && Math.random() < 0.55) return { type: "ignore" };
    if (rel === "annoyed" && Math.random() < 0.7) return { type: "ignore" };

    // Зайнятий (кіно, кафе…) — рідко відповідає, коротко
    if (busy && Math.random() < 0.55) return { type: "ignore" };
    if (busy && Math.random() < 0.35) return { type: "read_only" };

    if (!busy && Math.random() < 0.12) return { type: "read_only" };
    if (!busy && Math.random() < 0.08) return { type: "typing_then_cancel" };

    const delay = busy
      ? 4000 + Math.random() * 8000
      : 1500 + Math.random() * 5000;

    let text = this.craftReply(toId, fromId, userMessage, { busy, rel, mood, gender });
    return { type: "reply", text, delay };
  }

  /** Людська відповідь за змістом повідомлення, без ехо-питань */
  craftReply(toId, fromId, userMessage, ctx) {
    const msg = (userMessage || "").toLowerCase().trim();
    const st = this.state[toId];
    const status = st?.status || "";
    const left = this.activityRemainingLabel(toId);
    const name = this.getCharacter(fromId)?.name?.split(" ")[0] || "";
    const gender = ctx.gender || "f";
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Зайнятість
    if (ctx.busy) {
      if (/кіно/i.test(status)) {
        return pick([
          `Зараз у кіно, напишу як вийду${left ? " (" + left + ")" : ""} 🎬`,
          "Тсс, сеанс іде. Потім відповім!",
          "О, привіт. Я ще в залі, на зв'язку пізніше."
        ]);
      }
      if (/кафе/i.test(status)) {
        return pick([
          "Сиджу з друзями в кафе, напишу трохи згодом ☕",
          "Зараз компанія, не можу нормально відповісти. Пізніше!",
          `У кафе${left ? ", " + left : ""}. Не зникну.`
        ]);
      }
      if (/побаченн/i.test(status)) {
        return pick(["Зараз трохи зайнятий/зайнята, напиши пізніше", "Не зручно балакати. Потім!"]);
      }
      if (/сплю|душ|ванн/i.test(status)) {
        return pick(["Зараз не можу", "Напишу як звільнюсь"]);
      }
      return pick([
        `Зараз «${status}», відповім пізніше`,
        "Трішки зайнятий/зайнята. Не ігнорую навмисно."
      ]);
    }

    // Вітання
    if (/^(привіт|привітик|хай|хел+о|здоров|вітаю|йо)\b/.test(msg) || msg.length < 12 && /привіт|хай/.test(msg)) {
      return pick([
        `Привіт${name ? ", " + name : ""} 😊`,
        "О, привіт! Як ти?",
        "Привітики. Що новенького?",
        "Хей. Рада/рад бачити тебе онлайн."
      ]);
    }

    // «Як справи?» — НЕ повторювати те саме питання
    if (/як справи|як ти\b|як життя|що робиш|що робиш\?|як воно|шо робиш/.test(msg)) {
      const byStatus = [
        status ? `Та нормально. Зараз ${status}.` : "Нормально, потихеньку.",
        status ? `Ага, я ${status}. А ти?` : "По-різному. У тебе як?",
        "Більш-менш. День звичайний.",
        mood === "сумний" || mood === "сумна" ? "Якщо чесно — не дуже. Але терпимо." : "Добре, дякую що питаєш.",
        mood === "веселий" || mood === "весела" ? "Супер! Настрій топ." : "Спокійно. Без сюрпризів."
      ];
      return pick(byStatus);
    }

    // Запрошення / плани
    if (/пішли|давай|кіно|кафе|зустрі|побачен|кооп|погра/.test(msg)) {
      if (ctx.rel === "annoyed") return pick(["Ні.", "Не хочу.", "Без мене."]);
      if (/кіно/.test(msg)) return pick(["Можу кіно, якщо час зійдеться 🎬", "О, кіно — так. Коли?", "Давай, тільки не жахастик 😅"]);
      if (/кафе/.test(msg)) return pick(["Кафе завжди добре.", "Є ідея місця?", "Можу після роботи."]);
      if (/погра|кооп|ігр/.test(msg)) return pick(["Можу в кооп вечором.", "Давай, скинь що за гра.", "Я за, якщо не вночі дуже."]);
      return pick(["Можна спробувати.", "Напиши коли ти вільна/вільний.", "Звучить непогано."]);
    }

    // Емоційна підтримка
    if (/сумн|поган|важк|самот|не можу|втоми/.test(msg)) {
      return pick([
        "Чую тебе. Якщо треба виговоритись — я тут.",
        "Ох… тримайся. Можеш написати детальніше.",
        "Шкода, що так. Не тримай у собі."
      ]);
    }

    // Комплімент / тепло
    if (/подобаєш|краси|люблю|сумую|справжн/.test(msg)) {
      if (ctx.rel === "crush" || ctx.rel === "close") {
        return pick(["Ого… дякую. Мені приємно 💗", "Ти теж багато значтиш для мене.", "Щоки горять, серйозно."]);
      }
      return pick(["Ой, несподівано 😳", "Дякую… це мило.", "Не знаю що сказати, але дякую."]);
    }

    // Питання про інтереси персонажа
    const me = this.getCharacter(toId);
    if (me?.interests?.some(i => msg.includes(i.toLowerCase()))) {
      return pick([
        "О, ти про це згадав/згадала — люблю цю тему.",
        "Так! Можу довго про це говорити 😄",
        "Угадала/угадав мій інтерес."
      ]);
    }

    // Питання «чому / навіщо»
    if (/чому|навіщо|зачім|з якої/.test(msg)) {
      return pick([
        "Чесно? Просто так склалось.",
        "Довго пояснювати, але коротко — так треба було.",
        status ? `Зараз ${status}, тому трохи не до розмов.` : "Не завжди маю готову відповідь.",
        "Можу розказати пізніше, якщо серйозно цікавить."
      ]);
    }

    // Так / ні / згоден
    if (/^(так|ні|неа|ага|угу|добре|окей|ок)\b/.test(msg)) {
      return pick(["Ок.", "Добре.", "Зрозуміла/зрозумів.", "Тоді так і зробимо.", "Гаразд."]);
    }

    // Питання про роботу / статус
    if (/робот|магазин|змін|кол[еє]г/.test(msg)) {
      const job = me?.job || "свої справи";
      return pick([
        `Працюю як ${job}. Буває по-різному.`,
        "Робота є робота. Після зміни відпускає.",
        "Сьогодні зміна нормальна, без сюрпризів."
      ]);
    }

    // Питання про інших персонажів на ім'я
    for (const other of CHARACTERS) {
      const first = other.name.split(" ")[0].toLowerCase();
      if (other.id === toId) continue;
      if (msg.includes(first) || msg.includes(other.id)) {
        const r = this.getRelation(toId, other.id);
        if (r === "crush") return pick([`Про ${first}… складно коротко.`, `${first} багато значить, але не все просто.`, "Краще не розводити плітки."]);
        if (r === "annoyed") return pick([`${first}? Краще не починай.`, "Не хочу про це.", "Тема закрита."]);
        if (r === "close" || r === "friend") return pick([`${first} — нормальна людина, спілкуємось.`, `З ${first} ок. А що саме цікавить?`, "Можу передати привіт, якщо треба."]);
        return pick([`Знаю ${first}, але не дуже близько.`, "Чула/чув щось, але без деталей.", "Не моя історія розповідати."]);
      }
    }

    // Питання про інтереси з ключових слів
    if (/тамагоч|стікер|блокнот|медитац|мультивсесвіт/.test(msg) && toId === "yani") {
      return pick(["О, моя тема ✨", "Можу годинами про стікери і блокноти.", "Тамагочі зараз у доброму настрої, до речі."]);
    }
    if (/плітк|чутк|снек|пакет/.test(msg) && toId === "jini") {
      return pick(["Плітки не безкоштовні 😏", "Є одна історія… але тихо.", "Пакети від снеків — окрема естетика."]);
    }
    if (/пісн|іграшк|дерека|derek/.test(msg) && toId === "sayuri") {
      return pick(["Пісні пишу, коли не сплю від думок.", "Іграшки допомагають, коли сумно.", "Про Дерека… боляче і все ще сподіваюсь."]);
    }
    if (/кінь|подорож|тренув/.test(msg) && toId === "kate") {
      return pick(["Коні — краще за більшість людей.", "Завжди в дорозі, майже.", "Можу скинути маршрут, якщо цікаво."]);
    }
    if (/код|програм|баг|ніч/.test(msg) && toId === "giki") {
      return pick(["Код зараз стабільніший за сон.", "Баги люблять ніч. Я теж, на жаль.", "Можу глянути, якщо скинув/скинула фрагмент."]);
    }
    if (/стрім|ігр|фастфуд/.test(msg) && toId === "akira") {
      return pick(["Стрім майже щодня, якщо голос тримає.", "Ігри + їжа = робочий процес.", "Залітай на ефір, якщо не спиш."]);
    }
    if (/барахол|продаж|бізнес|грош/.test(msg) && toId === "cornel") {
      return pick(["Це не схеми, це маржа 😏", "На барахолці інший світ.", "Можу дістати рідкісне — за питанням."]);
    }
    if (/кейт|kate|біс|натяк/.test(msg) && toId === "derek") {
      return pick(["Кейт хоч не душить повідомленнями.", "Не всі розуміють прості «ні».", "Краще не чіпай цю тему."]);
    }
    if (/біг|спорт|пробіж|кейт/.test(msg) && toId === "kent") {
      return pick(["Сьогодні вже відбігав свою норму.", "Спорт тримає голову на місці.", "З Кейт є про що говорити без драми."]);
    }
    if (/аніме|дакімакур|лол/.test(msg) && toId === "jura") {
      return pick(["Нова фігура майже приїхала.", "Аніме краще за світло дня.", "Не всі це розуміють — і добре."]);
    }

        // Спецдіалоги — лише іноді і якщо не ехо
    const special = SPECIAL_DIALOGS[`${toId}_${fromId}`];
    if (special && Math.random() > 0.55) {
      const s = pick(special);
      if (!this.isEchoReply(s, msg)) return this.genderize(s, gender);
    }

    // Нейтральні живі відповіді (не питання-клони)
    const neutral = [
      "Ага, зрозуміла/зрозумів.",
      "Цікаво. Розказуй далі.",
      "Хм, не подумала/не подумав про це.",
      "Ок, я з тобою.",
      "Можна і так.",
      status ? `До речі, я зараз ${status}.` : "Просто онлайн, нічого особливого.",
      "Ха, добрий момент.",
      "Добре. Напиши ще, якщо що."
    ];
    let text = pick(neutral);
    // Анти-ехо: якщо раптом схоже на питання користувача — заміна
    if (this.isEchoReply(text, msg)) {
      text = pick(["Ага.", "Зрозуміла/зрозумів тебе.", "Ок 👍", "Я тут."]);
    }
    return this.genderize(text, gender);
  }

  isEchoReply(reply, userMsg) {
    const r = (reply || "").toLowerCase().replace(/[?!…]+/g, "").trim();
    const u = (userMsg || "").toLowerCase().replace(/[?!…]+/g, "").trim();
    if (!r || !u) return false;
    if (r === u) return true;
    // Однакові короткі питання типу «як справи»
    const q = /^(як справи|як ти|що робиш|привіт)$/;
    if (q.test(r) && q.test(u)) return true;
    if (u.length > 4 && r.includes(u)) return true;
    return false;
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
      const now = Date.now();
      let playerMoodChanged = false;
      CHARACTERS.forEach(c => {
        const st = this.state[c.id];
        const isPlayer = typeof UI !== "undefined" && c.id === UI.playerId;
        const busy = st.activityUntil && st.activityUntil > now;

        if (busy) {
          // Статус під час кіно/роботи лишається, але НАСТРІЙ може змінитись
          // (для гравця — частіше, щоб тема UI оновлювалась)
          const moodChance = isPlayer ? 0.35 : 0.12;
          if (Math.random() < moodChance) {
            const newMood = MOODS[Math.floor(Math.random() * MOODS.length)];
            if (st.mood !== newMood) {
              st.mood = newMood;
              st.thought = this.pickThought(newMood, c.gender);
              if (isPlayer) playerMoodChanged = true;
            }
          } else if (Math.random() > 0.9) {
            st.thought = this.pickThought(st.mood, c.gender);
          }
        } else {
          if (Math.random() > 0.2) {
            const act = this.pickActivity(c);
            st.status = act.status;
            st.activityUntil = act.until;
            st.activityKind = act.kind;
            st.online = this.shouldBeOnline(c, act);
          }
          if (Math.random() > 0.7) {
            const newMood = MOODS[Math.floor(Math.random() * MOODS.length)];
            if (st.mood !== newMood) {
              st.mood = newMood;
              st.thought = this.pickThought(newMood, c.gender);
              if (isPlayer) playerMoodChanged = true;
            }
          }
          if (Math.random() > 0.9) st.online = this.shouldBeOnline(c);
        }
      });
      if (Math.random() > 0.78) this.maybeGossip();
      if (Math.random() > 0.9 && this.state["sayuri"]?.online) this.maybeSayuriDerekDrama();
      if (Math.random() > 0.94) this.botsStartGame();

      // Тема сторінки залежить від настрою Яні
      if (playerMoodChanged && typeof UI !== "undefined") {
        try {
          UI.applyTheme();
          UI.renderMePanel();
        } catch (_) {}
      }

      setTimeout(tick, 35000 + Math.random() * 25000);
    };
    setTimeout(tick, 8000);
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
