/* ============================================
   Вітерець — дані
   10 персонажів (Яні Куронеко = гравець за замовч.)
   Легкий об'єм, без важких структур
   ============================================ */

const MOOD_THEMES = {
  закоханий:    { name: "рожева",      class: "theme-pink",    emoji: "💗" },
  щасливий:     { name: "зелена",      class: "theme-green",   emoji: "💚" },
  веселий:      { name: "зелена",      class: "theme-green",   emoji: "💚" },
  спокійний:    { name: "срібляста",   class: "theme-silver",  emoji: "🤍" },
  нейтральний:  { name: "срібляста",   class: "theme-silver",  emoji: "🤍" },
  сумний:       { name: "синя",        class: "theme-blue",    emoji: "💙" },
  натхненний:   { name: "блакитна",    class: "theme-cyan",    emoji: "🩵" },
  творчий:      { name: "блакитна",    class: "theme-cyan",    emoji: "🩵" },
  злий:         { name: "червона",     class: "theme-red",     emoji: "❤️‍🔥" },
  роздратований:{ name: "червона",     class: "theme-red",     emoji: "❤️‍🔥" },
  тривожний:    { name: "жовта",       class: "theme-yellow",  emoji: "💛" },
  панічний:     { name: "жовта",       class: "theme-yellow",  emoji: "💛" },
  закритий:     { name: "чорна",       class: "theme-black",   emoji: "🖤" },
  апатія:       { name: "пурпурна",    class: "theme-purple",  emoji: "💜" },
  байдужий:     { name: "пурпурна",    class: "theme-purple",  emoji: "💜" },
  соціальний:   { name: "помаранчева", class: "theme-orange",  emoji: "🧡" },
  енергійний:   { name: "зелена",      class: "theme-green",   emoji: "💚" }
};

/* Спільні побутові статуси (доступні майже всім) */
const STATUS_COMMON_F = [
  "у ванній", "приймаю душ", "їм їжу", "втомлена", "відпочиваю",
  "не турбувати", "хочу спілкування", "сумно", "нудно", "дивлюсь кіно", "слухаю пісні"
];
const STATUS_COMMON_M = [
  "у ванній", "приймаю душ", "їм їжу", "втомлений", "відпочиваю",
  "не турбувати", "хочу спілкування", "сумно", "нудно", "дивлюсь кіно", "слухаю пісні"
];

/* Індивідуальні статуси — лише свій персонаж */
const STATUS_BY_CHAR = {
  yani: [
    "медитую", "збираю стікери", "працюю в аніме-магазині", "граю в тамагочі",
    "слухаю релакс-музику", "дивлюсь кіно про мультивсесвіт", "обираю блокнот",
    "в кафе з друзями", "в кінотеатрі"
  ],
  jini: [
    "працюю в магазині іграшок", "збираю пакети від снеків", "пліткую 😏",
    "в кафе з друзями", "в кінотеатрі", "жартую з колегами", "граю в ігри"
  ],
  sayuri: [
    "співаю", "шию іграшку", "пишу пісню", "мрію", "на побаченні (у фантазіях)",
    "займаюсь творчістю", "сумую за кимось"
  ],
  kate: [
    "на тренуванні з кіньми", "в дорозі", "фотографую пейзаж", "бігаю",
    "планую поїздку", "в кафе з друзями", "на свіжому повітрі", "працюю (фріланс)"
  ],
  giki: [
    "пишу код", "малюю", "граю в ігри", "сиджу вночі в інтернеті",
    "дебажу програму", "слухаю музику в навушниках", "не турбувати (код)"
  ],
  akira: [
    "на стрімі", "граю в ігри", "дивлюсь стрім", "на роботі в Техсмітнику",
    "їм фастфуд", "тестую нову гру", "відпочиваю після стріму"
  ],
  cornel: [
    "на барахолці", "на поштовому відділенні", "продаю річ", "рахую прибуток",
    "шукаю вигідну угоду", "пліткую", "працюю"
  ],
  derek: [
    "слухаю музику", "не турбувати", "злюсь", "думаю про все",
    "один вдома", "пишу емоційний пост", "ігнорую всіх"
  ],
  kent: [
    "бігаю", "на тренуванні", "розтяжка після пробіжки", "планую маршрут",
    "ранок — спорт", "відновлююсь після навантаження", "на свіжому повітрі"
  ],
  jura: [
    "дивлюсь аніме", "сиджу вночі в інтернеті", "оглядаю колекцію",
    "на форумі", "не турбувати", "розпаковую дакімакуру", "граю в ігри"
  ]
};

const MOODS = Object.keys(MOOD_THEMES);

const THOUGHTS = {
  закоханий: ["Думаю про нього/неї знову...", "Серце б'ється швидше", "Хочу написати першим/першою"],
  щасливий: ["Світ сьогодні добрий", "Хочу обійняти всіх", "Настрій на висоті"],
  веселий: ["Хаха, це було смішно", "Хочу пожартувати", "Весело ж!"],
  спокійний: ["Тиша — розкіш", "Просто дихаю", "Все ок"],
  нейтральний: ["Звичайний день", "Нічого особливого", "Як завжди"],
  сумний: ["Трохи порожньо всередині", "Хотілося б підтримки", "Сумно..."],
  натхненний: ["Ідея!", "Треба творити прямо зараз", "Натхнення б'є ключем"],
  творчий: ["Малюю в голові", "Новий задум", "Хочу створити щось"],
  злий: ["Бісить усе", "Краще не чіпати мене", "Злюсь"],
  роздратований: ["Чому всі такі...", "Немає настрою", "Відчепіться"],
  тривожний: ["А раптом...", "Не можу заспокоїтися", "Серце стискається"],
  панічний: ["Все погано", "Не можу дихати нормально", "Допоможіть..."],
  закритий: ["Не хочу нікого бачити", "Залиште мене", "Мовчу"],
  апатія: ["Все одно", "Навіщо...", "Порожнеча"],
  байдужий: ["Ну... ок", "Як буде", "Не важливо"],
  соціальний: ["Хочу кудись піти!", "Збираю друзів", "Кіно? Кафе?"],
  енергійний: ["Давайте щось робити!", "Повний заряд", "Не можу всидіти"]
};

const CHARACTERS = [
  {
    id: "yani",
    name: "Яні Куронеко",
    gender: "f",
    emoji: "🐱",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEgkPXEo9bsccA1-IIT-KUyEuAKqHDr_TqUk-nmd4oksI3rhDnHSdk6f5W33CTttxhY2F1iowhoRqtd-PumQD7mnkhODarmDRto8UmhRwQuGaEAgSmC26uPA7euxu72oZ0wYTV6ALPHLEULM94dQodtfoq9TC7kXm8Zen1OY2zuAUvcdWQxnXvrgNyQw9WE", // URL: "https://..."
    color: "#e8a0bf",
    bio: "Релакс-музика, медитація, кіно про мультивсесвіт, мітика, тамагочі й канцелярія. Працює в аніме-магазині.",
    interests: ["релакс-музика", "медитація", "мультивсесвіт", "мітика", "тамагочі", "блокноти", "мультиручки", "стікери"],
    personality: "легка, але не вітряна; тепла, спокійна, трохи мрійлива",
    job: "продавчиня в аніме-магазині",
    isOwl: false,
    goals: ["зібрати всі наліпки", "знайти ідеальний блокнот", "подивитися ще одне кіно про паралельні світи"],
    defaultMood: "спокійний",
    likes: ["akira"],
    bestFriend: "jini"
  },
  {
    id: "jini",
    name: "Джині Мацумацу",
    gender: "f",
    emoji: "🐰",
    avatar: "", // URL: "https://..."
    color: "#f5c542",
    bio: "Менеджерка магазину електронних іграшок. Жартує, колекціонує пакети з-під снеків, знає всі плітки.",
    interests: ["жарти", "сніки", "плітки", "іграшки", "кіно", "ігри"],
    personality: "весела, трохи язиката, вірна подруга, любить попліткувати",
    job: "менеджерка магазину електронних іграшок",
    isOwl: false,
    goals: ["заповнити ще один журнал пакетами", "дізнатися нову плітку", "сходити з Яні в кіно"],
    defaultMood: "веселий",
    likes: [],
    bestFriend: "yani"
  },
  {
    id: "sayuri",
    name: "Саюрі Кіт",
    gender: "f",
    emoji: "🎤",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEhZ86sfJyXVUZ5W_dGDHW9nTmM-ns3Nz0hzKDddBIT0nzTySpqHaX74g5T0ZROux6y_z1ih8pJlum0gttajbGmMI27KSwq6yl70vWpWzvrYcx_HF68U9Jo1B7tKRvoRxGODaP2kPxgPG8fj1TWrxkv3jqQi25w7TAx9BGQ_No6seVQSxKrufXybZ_d4s7k", // URL: "https://..."
    color: "#c39bd3",
    bio: "Закохана в Дерека К'ю. Співає, створює іграшки. Часто сумує, але живе у фантазіях, що почуття взаємні.",
    interests: ["спів", "іграшки", "мрії", "романтика", "рукоділля"],
    personality: "мрійлива, вразлива, наполеглива в коханні, іноді нав'язлива",
    job: "робить іграшки на продаж",
    isOwl: false,
    goals: ["завоювати серце Дерека", "продати більше іграшок", "записати пісню"],
    defaultMood: "закоханий",
    likes: ["derek"],
    bestFriend: null
  },
  {
    id: "kate",
    name: "Кейт Чан",
    gender: "f",
    emoji: "🐴",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEjRpkjrxbFQPsjAFMo2CtJ_jek6IutY9NkWSl0mMRpqRv9TUSW8EEgYaBcbsL0ApzDYQRj7rRyWRUZPGScps8s_2LpvyuugRC3YmMHLStj5qSU0EtYZa2LCVvag4JP-c0jVxQJJZ3syKFux0lWNlkrhKFJv-hQZ9m3vvHuOOQW0PB5-z0WeEoUMC-d1Hfg", // URL: "https://..."
    color: "#58d68d",
    bio: "Соціально активна. Кінний спорт, постійні подорожі. Відкрита, але вибіркова у близьких стосунках.",
    interests: ["кінний спорт", "подорожі", "фото", "активний відпочинок"],
    personality: "енергійна, незалежна, трохи стримана з тими, хто їй байдужий",
    job: "подорожує / фріланс",
    isOwl: false,
    goals: ["поїхати в нову країну", "взяти участь у змаганнях", "знайти цікавих людей"],
    defaultMood: "соціальний",
    likes: [],
    bestFriend: null
  },
  {
    id: "giki",
    name: "Гікі Коморі",
    gender: "f",
    emoji: "🌙",
    avatar: "", // URL: "https://..."
    color: "#5dade2",
    bio: "Сидить вночі в інтернеті. Скромна, дуже розумна. Програми, відеоігри, малювання. Інколи глибоко сумує.",
    interests: ["програмування", "відеоігри", "малювання", "ніч", "тиша"],
    personality: "інтроверт, глибока, талановита, схильна до меланхолії",
    job: "розробниця (фріланс)",
    isOwl: true,
    goals: ["випустити свою програму", "домалювати комікс", "знайти тих, хто розуміє нічний режим"],
    defaultMood: "творчий",
    likes: [],
    bestFriend: null
  },
  {
    id: "akira",
    name: "Акіра Бакенеко",
    gender: "m",
    // emoji: "",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEg6TLuKwTa6G7t32SgZE9RiJp5vLqOOqtC7lBHiLXIjBZOZAx1Dku1fWM8x_bc1lXwA1pF32pojhJW02L1BxI3oJfuvwBhC6i9Di0zPVQhzLcGslTae08Qe-4bRNEtHajGweOmDs9Snij-8QDCseC7KCckbjuGosEilTW3y2LxVSfdQ0WRgCTtt8us3ahI", // URL: "https://...🎮"
    color: "#e74c3c",
    bio: "Продавець-консультант у «Техсмітнику». Відеоігри, фастфуд, стрімери. Має 5 улюблених стрімерів.",
    interests: ["відеоігри", "фастфуд", "стріми", "техніка", "меми"],
    personality: "дружній, геймерський, трохи замкнутий у почуттях, щирий",
    job: "продавець у магазині техніки «Техсмітник»",
    isOwl: true,
    goals: ["пройти топ ігор року", "набрати підписників на стрімі", "запросити Яні пограти"],
    defaultMood: "спокійний",
    likes: ["yani"],
    bestFriend: null
  },
  {
    id: "cornel",
    name: "Корнел Вус",
    gender: "m",
    emoji: "📦",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEiWYzjeUTFiYOn6la_I85bW21t8ce-aUt0RSS-D20N2sAi-R5__k0rkL51aECpvgUYS1nCg3bdFCbFawuVCtQW6HV4uRkxZJGxtbTzU_7lgq6iScgEnK-_ITRNmrevbnRptW-Rwo-G6HomYW4z_i0tOh3UA2MgZ_ADhKKtcczKJygPDAYwCmdj9ILDiBsQ", // URL: "https://..."
    color: "#af7ac5",
    bio: "Продає речі з барахолки. Мріє про бізнес. Хитрий, але хитрість часто виходить боком. Любить плітки.",
    interests: ["продажі", "барахолка", "плітки", "гроші", "схеми"],
    personality: "хитрий, амбітний, сварливий, любить інтриги",
    job: "працює на поштовому відділенні + барахолка",
    isOwl: false,
    goals: ["відкрити свій бізнес", "заробити великий куш", "бути в центрі подій"],
    defaultMood: "нейтральний",
    likes: [],
    bestFriend: null
  },
  {
    id: "derek",
    name: "Дерек К'ю",
    gender: "m",
    emoji: "😤",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEgsM4rOwDNDtCqV59OJ5ys0cO56LnF3H8mFm0sbR7DI6WYqtKoITHYS-1c-8uGtoY-Gf0IEwxKYqXv-ULsD5Dpbv96-vQqTMR1H7AtYpDHP76JP5NZgnz_AXaIXdgJQiLny8p3jaWbIZyVttS7jvfZn7uVK5JXQ7TUJDV6aE2kQY_bcUlwa4-KI9efOZYQ", // URL: "https://..."
    color: "#ec7063",
    bio: "Емоційно нестабільний. Вважає, що дівчата його не розуміють. Подобається Кейт, яка ставиться байдуже. Саюрі його бісить.",
    interests: ["музика", "самотність", "скарги", "нічні роздуми"],
    personality: "вибуховий, ображений на світ, ранимий, різкий",
    job: "нестабільна робота / фріланс",
    isOwl: true,
    goals: ["щоб Кейт звернула увагу", "щоб Саюрі відстала", "знайти того, хто «розуміє»"],
    defaultMood: "роздратований",
    likes: ["kate"],
    bestFriend: null
  },
  {
    id: "kent",
    name: "Кент Уайт",
    gender: "m",
    emoji: "🏃",
    avatar: "https://blogger.googleusercontent.com/img/a/AVvXsEgSYk5a8B6aEPqG-ZggBwwvEJrY4fF_5I2rXYWSsFJdIfx9q_kqID2YVDWIxFWc7KDHzRCQabJrr-zcbvS4u6ogVO1N1sjLO-3GgBw-zSht-LZTbRnF8-DLjOgQnOzDxNl96wbpkOZd30S_VEy2jUuUXZKM8SPngwUcA1PBqCg3vPRJWJmE95i3EIlC8Mc", // URL: "https://..."
    color: "#58d68d",
    bio: "Спорт, біг. Має багато спільного з Кейт Чан. Прямий, дисциплінований.",
    interests: ["біг", "спорт", "здоров'я", "ранкові тренування"],
    personality: "дисциплінований, чесний, трохи сухуватий, надійний",
    job: "тренер / спортсмен",
    isOwl: false,
    goals: ["пробігти напівмарафон", "надихнути інших на спорт", "зблизитися з Кейт"],
    defaultMood: "енергійний",
    likes: ["kate"],
    bestFriend: null
  },
  {
    id: "jura",
    name: "Джура Кун",
    gender: "m",
    emoji: "🎌",
    avatar: "", // URL: "https://..."
    color: "#bb8fce",
    bio: "Сидить вночі в інтернеті. Аніме, лолі-тематика, колекціонує дакімакури. Трохи дивний, але тихий.",
    interests: ["аніме", "дакімакури", "нічні форуми", "колекціонування"],
    personality: "замкнутий, отаку, трохи дивний, нешкідливий",
    job: "нічний фріланс",
    isOwl: true,
    goals: ["зібрати повну колекцію", "знайти людей зі схожими інтересами", "не виходити з дому зайвий раз"],
    defaultMood: "закритий",
    likes: [],
    bestFriend: null
  }
];

const INITIAL_RELATIONS = {
  yani:   { jini: "close", sayuri: "friend", kate: "friend", giki: "friend", akira: "crush", cornel: "neutral", derek: "neutral", kent: "friend", jura: "neutral" },
  jini:   { yani: "close", sayuri: "friend", kate: "friend", giki: "friend", akira: "friend", cornel: "rival", derek: "neutral", kent: "friend", jura: "neutral" },
  sayuri: { yani: "friend", jini: "friend", kate: "neutral", giki: "friend", akira: "neutral", cornel: "neutral", derek: "crush", kent: "neutral", jura: "neutral" },
  kate:   { yani: "friend", jini: "friend", sayuri: "neutral", giki: "friend", akira: "friend", cornel: "neutral", derek: "neutral", kent: "friend", jura: "neutral" },
  giki:   { yani: "friend", jini: "friend", sayuri: "friend", kate: "friend", akira: "friend", cornel: "neutral", derek: "neutral", kent: "neutral", jura: "friend" },
  akira:  { yani: "crush", jini: "friend", sayuri: "neutral", kate: "friend", giki: "friend", cornel: "neutral", derek: "friend", kent: "friend", jura: "friend" },
  cornel: { yani: "neutral", jini: "rival", sayuri: "neutral", kate: "neutral", giki: "neutral", akira: "neutral", derek: "friend", kent: "neutral", jura: "neutral" },
  derek:  { yani: "neutral", jini: "neutral", sayuri: "annoyed", kate: "crush", giki: "neutral", akira: "friend", cornel: "friend", kent: "rival", jura: "neutral" },
  kent:   { yani: "friend", jini: "friend", sayuri: "neutral", kate: "crush", giki: "neutral", akira: "friend", cornel: "neutral", derek: "rival", jura: "neutral" },
  jura:   { yani: "neutral", jini: "neutral", sayuri: "neutral", kate: "neutral", giki: "friend", akira: "friend", cornel: "neutral", derek: "neutral", kent: "neutral" }
};


const QUICK_MESSAGES = {
  close: {
    default: ["Привіт, рідненька 💕", "Як ти?", "Давай щось придумаємо", "Згадувала тебе", "Що нового?", "Скучила трохи"],
    сумний: ["Обіймаю тебе", "Я тут", "Не мовчи, добре?", "Хочеш поговорити?"],
    веселий: ["Хаха, розкажи!", "Смішнооо", "Я теж в настрої!", "Жарт чула?"],
    соціальний: ["Пішли в кіно!", "Кафе сьогодні?", "Збираю людей, ти з нами?"]
  },
  crush: {
    default: ["Привіт...", "Думав/думала про тебе", "Як твій день?", "Може, поговоримо?", "Ти сьогодні як?"],
    закоханий: ["Ти мені дуже подобаєшся", "Хочу тебе побачити", "Напиши, коли будеш вільна", "Серце трохи стукає, коли бачу тебе онлайн"],
    сумний: ["Сумно без тебе...", "Можна просто побути на зв'язку?", "Ти мені важливий/важлива"]
  },
  friend: {
    default: ["Привіт!", "Як справи?", "Що робиш?", "Давно не спілкувались", "Як настрій?"],
    соціальний: ["Пішли кудись!", "Кіно сьогодні?", "Збираю людей", "Є ідея для вечора"],
    творчий: ["Що створюєш зараз?", "Покажи, якщо можна", "Натхнення є?"],
    енергійний: ["Готовий/готова до всього!", "Давай щось активне", "Заряджений/а"]
  },
  annoyed: {
    default: ["Чого тобі?", "Знову ти...", "Відчепись", "Не зараз", "Серйозно?"],
    злий: ["Відстань.", "Не пиши мені.", "Бісиш."],
    роздратований: ["Не в настрої", "Пізніше", "Залиш у спокої"]
  },
  rival: {
    default: ["О, ти", "Цікаво", "Ну-ну", "Щось хотів/хотіла?", "Знову свої схеми?"],
    злий: ["Не чіпай", "Відвали", "Краще мовчи"]
  },
  neutral: {
    default: ["Привіт", "Ага", "Ок", "Як справи?", "Ну привіт"],
    спокійний: ["Тихо сьогодні", "Все спокійно", "Просто онлайн"]
  }
};

/* Спеціальні діалоги між конкретними парами */
const SPECIAL_DIALOGS = {
  "yani_jini": [
    "Джині, нова партія стікерів зайшла ✨",
    "Кіса, ти не повіриш яку плітку я чула...",
    "Пішли в кіно про мультивсесвіт?",
    "Твій тамагочі як? Мій майже еволюціонував",
    "Згадаймо той раз з пакетами від снеків 😂",
    "Після роботи — чай і ніяких людей, окрім тебе?",
    "Знайшла блокнот з мультиручками. Хочеш половину?"
  ],
  "jini_yani": [
    "Кіса, ти перша маєш це почути…",
    "На роботі сьогодні було смішно до сліз",
    "Твій тамагочі ще живий? Мій майже легенда",
    "Є плітка, але тільки тобі",
    "Кафе після зміни? Я пригощаю пакетиками 🍟"
  ],
  "yani_akira": [
    "Акіро, ти знову до ранку на стрімі?",
    "Є нова гра, думала про тебе...",
    "Може, якось разом пограємо в кооп?",
    "Твій улюблений стрімер знову щось накоїв?",
    "Фастфуд і ігри — класика, згодна?",
    "Не засиджуйся. Хоч чашку чаю між матчами"
  ],
  "akira_yani": [
    "Яні, ти онлайн? Я якраз після стріму",
    "Думав про тебе... може, кооп сьогодні?",
    "Нова гра зайшла, хочеш глянути разом?",
    "Фастфуд і ігри — класика, згоден?",
    "Глядачі сьогодні токсичні, а ти — ні. Дякую що просто є"
  ],
  "sayuri_derek": [
    "Дерек... можна хвилинку?",
    "Я написала пісню. Вона про тебе.",
    "Чому ти завжди такий холодний?",
    "Просто скажи, якщо я тобі не цікава...",
    "Я зробила нову іграшку. Може, хоч глянеш?"
  ],
  "derek_sayuri": [
    "Скільки можна?",
    "Я вже казав — ні.",
    "Не роби з мене драму.",
    "Кейт хоч розуміє натяки. На відміну від тебе.",
    "Припини писати під моїми постами, будь ласка."
  ],
  "derek_kate": [
    "Кейт, ти в місті?",
    "Може, хоч раз відповіси прямо?",
    "Я не прошу багато. Просто ясність.",
    "Ти ігноруєш чи зайняті коні?"
  ],
  "kate_derek": [
    "Дерек, я в дорозі. Не зараз.",
    "Не люблю двозначності — і від тебе теж.",
    "Мені ок як друзі. Якщо цього мало — вибач.",
    "Напиши щось конкретне, не натяки."
  ],
  "kate_kent": [
    "Кент, як пробіжка?",
    "Нова локація для тренувань — цікаво?",
    "Коні + гори. Ти б поїхав?",
    "Дисципліна — це сила, згоден.",
    "Ранок без спорту — як день без кави"
  ],
  "kent_kate": [
    "Кейт, 10 км зроблено. Ти як?",
    "Є маршрут біля стайні — перевіримо?",
    "Ти єдина, з ким не нудно про кілометри говорити",
    "Якщо поїдеш у гори — клич. Я з рюкзаком"
  ],
  "giki_jura": [
    "Ніч якась довга...",
    "Код майже готовий. А ти що колекціонуєш зараз?",
    "Аніме-рекомендація є?",
    "Тиша в чаті о 3 ночі — найкраща.",
    "Знайшла дивний баг. Хочеш посміятись?"
  ],
  "jura_giki": [
    "Гікі, не спиш знову?",
    "Нова дакімакура приїхала. Не смійся.",
    "Є тайтл на одну ніч — без спойлерів",
    "Код і аніме — різні всесвіти, але ми в обох"
  ],
  "jini_cornel": [
    "Корнел, знову схеми?",
    "Чула, ти щось продав. Правда, що з націнкою?",
    "Плітка за плітку — рівний обмін?",
    "Не втягуй Яні в свої історії, ок?"
  ],
  "cornel_jini": [
    "Джині, ти все чуєш першою — зручно",
    "Це не схема, це бізнес 😏",
    "Можу розказати, звідки товар. За відповідну послугу",
    "Ти б здивувалась, хто що продає"
  ],
  "yani_sayuri": [
    "Саюрі, як голос сьогодні?",
    "Нова іграшка? Покажеш?",
    "Якщо важко з Дереком — я поруч",
    "Може, краще вечір з нами, а не очікування"
  ],
  "sayuri_yani": [
    "Яні… дякую що не смієшся",
    "Співаю тихіше, ніж хотілось би",
    "Іноді здається, що я вигадала все сама",
    "Тамагочі простіший за людей"
  ],
  "akira_giki": [
    "Гікі, ти б змогла зробити оверлей для стріму?",
    "Є ідея моду для гри — цікаво?",
    "Тиша в войсі після рейду — кайф"
  ],
  "giki_akira": [
    "Можу глянути оверлей, якщо скинув макет",
    "Моди — обережно з античітом",
    "Стрім не мій світ, але код — так"
  ]
};



/* ---- Стосунки ---- */
const RELATIONSHIP_TYPES = {
  single: {
    id: "single",
    labelF: "Неодружена",
    labelM: "Неодружений",
    needsPartner: false,
    needsMutual: false
  },
  dating: {
    id: "dating",
    labelF: "У стосунках",
    labelM: "У стосунках",
    needsPartner: true,
    needsMutual: true,
    // може з будь-ким
    partnerPool: null
  },
  married: {
    id: "married",
    labelF: "Одружена",
    labelM: "Одружений",
    needsPartner: true,
    needsMutual: true,
    partnerPool: null
  },
  cohabiting: {
    id: "cohabiting",
    labelF: "У співмешканні",
    labelM: "У співмешканні",
    needsPartner: true,
    needsMutual: true,
    partnerPool: ["jura", "derek", "kent", "cornel", "jini", "kate"],
    // хто сам ніколи не обере цей статус
    neverChooser: ["giki", "yani", "akira", "sayuri"]
  },
  open: {
    id: "open",
    labelF: "У вільному дурдомі",
    labelM: "У вільному дурдомі",
    needsPartner: true,
    needsMutual: false,
    // хто може обрати такий статус
    chooserPool: ["derek", "jura"],
    partnerPool: null
  },
  complicated: {
    id: "complicated",
    labelF: "Складні стосунки",
    labelM: "Складні стосунки",
    needsPartner: true,
    needsMutual: false,
    partnerPool: null
  },
  separated: {
    id: "separated",
    labelF: "Живемо окремо",
    labelM: "Живемо окремо",
    needsPartner: true,
    needsMutual: true,
    chooserPool: ["derek", "kent", "akira", "kate"],
    partnerPool: null
  },
  hidden: {
    id: "hidden",
    labelF: "Стосунки приховано",
    labelM: "Стосунки приховано",
    needsPartner: false,
    needsMutual: false
  }
};

const RELATIONSHIP_CHANGE_POLICIES = ["day", "week", "month", "never"];

const SAMPLE_POSTS = [
  { author: "yani", text: "Новий блокнот і пачка стікерів. Щастя існує. ✨", likes: ["jini", "akira", "giki"] },
  { author: "jini", text: "Сьогодні дізналася ТАКУ плітку... але поки мовчу 😏 Хто здогадується?", likes: ["yani", "cornel"] },
  { author: "sayuri", text: "Написала нову пісню. Думаю про одного хлопця... 🎤💗", likes: ["yani", "jini"] },
  { author: "derek", text: "Офіційно: деякі люди мене просто бісять. Особливо ті, хто не розуміє натяків. @sayuri", likes: ["cornel"] },
  { author: "akira", text: "Нічний стрім + ролики. Хто не спить — залітайте.", likes: ["yani", "giki", "jura"] },
  { author: "kate", text: "Нова країна через тиждень. Коні + гори. Хто зі мною хоч у мріях?", likes: ["kent", "yani", "jini"] },
  { author: "giki", text: "3:42. Код майже готовий. Очі печуть, але воно того варте.", likes: ["akira", "jura"] },
  { author: "cornel", text: "Продав рідкісну фігурку за нормальні гроші. Бізнес — це мистецтво. Чув, що @derek знову свариться з кимось...", likes: ["derek"] },
  { author: "kent", text: "10 км зранку. Хто ще не встав — ви все пропустили. @kate ти як?", likes: ["kate"] },
  { author: "jura", text: "Нова дакімакура приїхала. Ніч буде хорошою. 🎌", likes: ["giki"] }
];

const GALLERY = [
  { id: 1, author: "yani", emoji: "📓", desc: "Розворот блокнота зі стікерами", tags: ["канцелярія", "стікери"] },
  { id: 2, author: "jini", emoji: "🍿", desc: "Сторінка журналу з пакетами від снеків", tags: ["колекція", "жарти"] },
  { id: 3, author: "sayuri", emoji: "🧸", desc: "Іграшка, яку зшила сама", tags: ["рукоділля", "іграшки"] },
  { id: 4, author: "giki", emoji: "🖥️", desc: "Скріншот нічного коду", tags: ["програмування", "ніч"] },
  { id: 5, author: "akira", emoji: "🎧", desc: "Сетап для стріму", tags: ["ігри", "стрім"] },
  { id: 6, author: "kate", emoji: "🏞️", desc: "Фото з подорожі біля коней", tags: ["подорожі", "коні"] },
  { id: 7, author: "derek", emoji: "🌧️", desc: "Вікно під дощем", tags: ["настрій", "самотність"] },
  { id: 8, author: "jura", emoji: "🎌", desc: "Частина колекції", tags: ["аніме", "колекція"] },
  { id: 9, author: "kent", emoji: "🌅", desc: "Схід після пробіжки", tags: ["спорт", "ранок"] },
  { id: 10, author: "cornel", emoji: "📦", desc: "Нова партія з барахолки", tags: ["продаж", "речі"] }
];

/* Розширені ігри */
const GAMES = [
  {
    id: "tamagotchi",
    name: "Тамагочі-батл",
    emoji: "🐣",
    desc: "Доглядаємо віртуальних тваринок. Годуй, грай, лікуй.",
    actions: ["нагодувати 🍎", "пограти 🎾", "полити 💊", "почистити ✨", "покласти спати 😴"],
    winText: "Тамагочі еволюціонував!"
  },
  {
    id: "quiz",
    name: "Вікторина про аніме",
    emoji: "❓",
    desc: "Питання про аніме, ігри та мітику. Хто більше знає?",
    actions: ["відповісти A", "відповісти B", "відповісти C", "пас", "підказати другу"],
    winText: "Знавець сезону!"
  },
  {
    id: "draw",
    name: "Малюємо по черзі",
    emoji: "🎨",
    desc: "Кожен додає деталь до спільного малюнка.",
    actions: ["додати небо", "додати персонажа", "додати деталь", "змінити колір", "підписати"],
    winText: "Шедевр готовий!"
  },
  {
    id: "race",
    name: "Віртуальний забіг",
    emoji: "🏃",
    desc: "Хто перший фінішує. Витривалість і удача.",
    actions: ["прискоритись", "зберегти сили", "обігнати", "підтримати друга", "фінішний ривок"],
    winText: "Фініш! Новий рекорд."
  },
  {
    id: "gossip",
    name: "Плітки-вечір",
    emoji: "👂",
    desc: "Обмінюємося чутками. Обережно — хтось може образитися.",
    actions: ["розказати плітку", "перепитати", "заперечити", "змінити тему", "розсміятися"],
    winText: "Найсоковитіша плітка вечора!"
  },
  {
    id: "co_op",
    name: "Кооп-рейд",
    emoji: "⚔️",
    desc: "Разом б'ємо боса в уявній грі.",
    actions: ["атака", "лікування", "баф", "ультимейт", "відступ"],
    winText: "Боса переможено!"
  },
  {
    id: "music",
    name: "Музичний батл",
    emoji: "🎵",
    desc: "Кидаємо треки й оцінюємо один одного.",
    actions: ["кинути релакс", "кинути енергійний", "кинути сумний", "оцінити 10/10", "не моє"],
    winText: "Плейлист вечора зібрано."
  }
];

const MEETUP_PLACES = ["кінотеатр", "кафе", "парк", "аніме-магазин", "онлайн у грі", "на стрімі", "на пробіжку", "біля ставка", "книгарня"];

/* Система досягнень */
const ACHIEVEMENTS = [
  { id: "first_like", name: "Перший лайк", desc: "Постав першу вподобайку", emoji: "🤍", condition: "likes", target: 1 },
  { id: "social_10", name: "Соціальна метелик", desc: "Постав 10 вподобайок", emoji: "🦋", condition: "likes", target: 10 },
  { id: "chatter", name: "Балакун", desc: "Надішли 5 повідомлень", emoji: "💬", condition: "messages", target: 5 },
  { id: "deep_talk", name: "Глибока розмова", desc: "Надішли 20 повідомлень", emoji: "🌙", condition: "messages", target: 20 },
  { id: "host", name: "Організатор", desc: "Запропонуй зустріч", emoji: "📍", condition: "meetings", target: 1 },
  { id: "party", name: "Тусовщик", desc: "3 прийняті зустрічі", emoji: "🎉", condition: "meetings_accepted", target: 3 },
  { id: "gamer", name: "Геймер", desc: "Зіграй у будь-яку гру", emoji: "🎮", condition: "games", target: 1 },
  { id: "champion", name: "Чемпіон", desc: "Виграй 3 ігри", emoji: "🏆", condition: "games_won", target: 3 },
  { id: "poster", name: "Автор", desc: "Опублікуй допис", emoji: "✍️", condition: "posts", target: 1 },
  { id: "feed_master", name: "Голос стрічки", desc: "5 власних дописів", emoji: "📢", condition: "posts", target: 5 },
  { id: "friend_maker", name: "Дружелюбний", desc: "Додай когось у друзі", emoji: "🤝", condition: "friends_added", target: 1 },
  { id: "night_owl", name: "Нічна сова", desc: "Поспілкуйся з совою (Гікі, Акіра, Джура, Дерек)", emoji: "🦉", condition: "talk_owl", target: 1 },
  { id: "drama", name: "Свідок драми", desc: "Побач пост Дерека про Саюрі", emoji: "🎭", condition: "see_drama", target: 1 },
  { id: "bestie", name: "Найкраща подруга", desc: "Поговори з Джині 3 рази", emoji: "💕", condition: "talk_jini", target: 3 },
  { id: "crush_line", name: "Лінія кохання", desc: "Напиши Акірі, коли ти Яні (або навпаки)", emoji: "💗", condition: "talk_crush", target: 1 },
  { id: "explorer", name: "Дослідник", desc: "Відкрий профілі 5 різних людей", emoji: "🔍", condition: "profiles", target: 5 },
  { id: "gallery_fan", name: "Цінитель", desc: "Відкрий 3 роботи в галереї", emoji: "🖼", condition: "gallery", target: 3 },
  { id: "all_games", name: "Колекціонер ігор", desc: "Спробуй 4 різні ігри", emoji: "🎲", condition: "unique_games", target: 4 }
];
