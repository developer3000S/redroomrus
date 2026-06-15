import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { WaitingListModal } from "./WaitingListModal";
import { UpgradeButton } from "./UpgradeButton";

const DISCLAIMER_KEY = "redroom_disclaimer_accepted";
const LAST_REMINDER_KEY = "redroom_last_reminder";
const REMINDER_INTERVAL_KEY = "redroom_reminder_interval";
const DEFAULT_REMINDER_MS = 30 * 60 * 1000; // 30 minutes

type Tab = "howto" | "disclaimer" | "contribute" | "enroll";

// ─── Default values used when CMS has no override ────────────────────────────
const DEFAULTS: Record<string, string> = {
  // ── Floating button ──────────────────────────────────────────────────────
  "disclaimer.visible": "true",
  "disclaimer.button.tooltip": "Соглашение об ответственном использовании",

  // ── Header ───────────────────────────────────────────────────────────────
  "disclaimer.header.title": "REDROOM",
  "disclaimer.header.subtitle": "ПЛАТФОРМА РАЗВЕДКИ ПО ОТКРЫТЫМ ИСТОЧНИКАМ — СОГЛАШЕНИЕ ОБ ОТВЕТСТВЕННОМ ИСПОЛЬЗОВАНИИ",
  "disclaimer.footer.version": "REDROOM V2.4 · OWLINK.AI · ОТКРЫТЫЙ ИСХОДНЫЙ КОД · ЛИЦЕНЗИЯ MIT · © ALEXSAI",

  // ── Tab labels & visibility ───────────────────────────────────────────────
  "disclaimer.tab.howto.visible": "true",
  "disclaimer.tab.howto.label": "📖 ИНСТРУКЦИЯ",
  "disclaimer.tab.disclaimer.visible": "true",
  "disclaimer.tab.disclaimer.label": "⚠ ПРАВИЛА И ОТКАЗ",
  "disclaimer.tab.contribute.visible": "true",
  "disclaimer.tab.contribute.label": "🤝 УЧАСТИЕ",
  "disclaimer.tab.enroll.visible": "true",
  "disclaimer.tab.enroll.label": "🎓 ОБУЧЕНИЕ",

  // ── HOW TO USE tab ────────────────────────────────────────────────────────
  "howto.intro": "Redroom спроектирован как профессиональная рабочая станция для OSINT-исследований — единая платформа, которая агрегирует общедоступные мировые разведданные для аналитиков, журналистов и исследователей.",

  // SIGINT Map section
  "howto.sigint.title": "Портал карты SIGINT",
  "howto.sigint.icon": "🌍",
  "howto.sigint.tips": JSON.stringify([
    "Включайте слои выборочно, чтобы избежать информационной перегрузки",
    "Используйте фильтр по странам (F), чтобы сфокусироваться на конкретном регионе",
    "Нарисуйте многоугольник, чтобы изолировать интересующую географическую область",
    "Нажмите на любой маркер для доступа к детальной информации, включая данные о маршрутах, метаданные судов и записи камер",
    "Используйте режим наблюдения (SVM) для одновременного мониторинга до 10 конкретных объектов",
  ]),
  "howto.sigint.signals": JSON.stringify([
    { label: "✈ Самолеты онлайн", count: "10,000+" },
    { label: "🚢 Суда AIS", count: "15,000+" },
    { label: "📷 Камеры CCTV", count: "12,000+" },
    { label: "🌋 Сейсмические события", count: "USGS M2.5+" },
    { label: "🔥 Активные пожары", count: "NASA FIRMS" },
    { label: "⛈ Погодные события", count: "NASA EONET" },
  ]),

  // Orbit section
  "howto.orbit.title": "Портал Orbit (Космическая разведка)",
  "howto.orbit.icon": "📡",
  "howto.orbit.body": "Портал Orbit обеспечивает отслеживание спутников в реальном времени, визуализацию орбитальной механики и мониторинг космической погоды. Отслеживайте активные спутники, прогнозируйте пролеты над конкретными локациями и следите за солнечной активностью, которая может повлиять на инфраструктуру связи.",
  "howto.orbit.tips": JSON.stringify([
    "Используйте для мониторинга спутниковых группировок, имеющих отношение к вашей области исследований",
    "Отслеживайте МКС и другие исследовательские платформы в академических целях",
    "Нажмите на любой космодром или наземную станцию, чтобы увидеть все связанные спутники",
    "Мониторьте космическую погоду для исследования инфраструктуры связи",
    "Сопоставляйте пролеты спутников с наземными событиями для проведения расследований",
  ]),

  // Main Intel Portal section
  "howto.intel.title": "Главный портал разведки",
  "howto.intel.icon": "🗞️",
  "howto.intel.body": "Главный портал агрегирует геополитические новости из более чем 100 глобальных источников, выполняет извлечение сущностей, анализ тональности и картирование взаимосвязей. Используйте его для отслеживания нарративов, выявления паттернов информации и создания исследовательских отчетов на основе доказательств.",
  "howto.intel.tips": JSON.stringify([
    "Используйте вкладку «Сравнение», чтобы проанализировать, как разные источники освещают одно и то же событие",
    "Используйте вкладку «Граф», чтобы построить связи между сущностями, организациями и событиями",
    "Сохраняйте расследования для долгосрочного анализа и отслеживания паттернов",
    "Сопоставляйте новостные события с данными карты SIGINT для многодоменного анализа",
  ]),

  // Use Cases section
  "howto.usecases.title": "Рекомендуемые сценарии использования",
  "howto.usecases.icon": "🔬",
  "howto.usecases.items": JSON.stringify([
    { role: "Журналист-расследователь", use: "Отслеживание движения судов в зонах конфликтов, сопоставление маршрутов полетов с новостными событиями, проверка фактов на основе открытых данных" },
    { role: "Академический исследователь", use: "Изучение геополитических паттернов, анализ предвзятости СМИ в разных источниках, исследование динамики конфликтов с использованием данных в реальном времени" },
    { role: "OSINT-аналитик", use: "Многодоменная корреляция, картирование связей между сущностями, анализ образа жизни на основе только открытых источников" },
    { role: "Исследователь политики", use: "Мониторинг глобальных событий, отслеживание гуманитарных кризисов, анализ индикаторов региональной стабильности" },
    { role: "Исследователь безопасности", use: "Изучение публично видимой инфраструктуры, анализ данных об угрозах из открытых источников, только защитные исследования" },
    { role: "Преподаватель", use: "Демонстрация сбора данных в реальном мире, обучение методологии OSINT-исследований, иллюстрация геополитических концепций" },
  ]),

  // Ethical OSINT section
  "howto.ethics.title": "Этические принципы OSINT",
  "howto.ethics.icon": "⚠️",
  "howto.ethics.items": JSON.stringify([
    "Минимизация вреда: собирайте и анализируйте только те данные, которые необходимы для ваших исследовательских целей",
    "Проверка перед публикацией: самостоятельно подтверждайте все выводы перед их публичным распространением",
    "Защита приватности: избегайте идентификации или разоблачения частных лиц, даже если данные технически публичны",
    "Прозрачность методологии: документируйте источники данных и аналитические методы",
    "Соблюдение юридических границ: знайте законы вашей юрисдикции в отношении сбора и использования данных",
    "Безопасность исследований: защищайте конфиденциальные выводы и источники от несанкционированного доступа",
  ]),

  // ── DISCLAIMER & TERMS tab ────────────────────────────────────────────────
  "disclaimer.intro": "REDROOM — это полностью открытая (OSINT) исследовательская платформа, разработанная исключительно для законных, этических и академических целей. Получая доступ к этой платформе, вы подтверждаете и соглашаетесь со следующими условиями в полном объеме.",
  "disclaimer.s1.title": "§1 — ДЕКЛАРАЦИЯ ОБ ОТКРЫТОМ ИСХОДНОМ КОДЕ",
  "disclaimer.s1.body": "Эта платформа и все её компоненты, исходный код, конвейеры данных и визуализации являются полностью открытыми и общедоступными для аудита. Проект разрабатывается с полной прозрачностью и не имеет отношения к каким-либо правительственным структурам, спецслужбам, военным организациям или коммерческим структурам слежки. Платформа агрегирует только общедоступные данные из открытых источников.",
  "disclaimer.s2.title": "§2 — РАЗРЕШЕННОЕ ИСПОЛЬЗОВАНИЕ",
  "disclaimer.s2.items": JSON.stringify([
    "Академические и научные исследования в области геополитики, международных отношений и конфликтологии",
    "Журналистские расследования и проверка фактов с использованием общедоступных данных",
    "Обучение OSINT (разведке по открытым источникам) и разработка методологий",
    "Некоммерческий гуманитарный мониторинг и информирование о кризисах",
    "Образовательные демонстрации методов агрегации общедоступных данных",
    "Исследования в области безопасности (исключительно в оборонительных целях)",
    "Политический анализ и исследования аналитических центров",
  ]),
  "disclaimer.s3.title": "§3 — КАТЕГОРИЧЕСКИ ЗАПРЕЩЕННОЕ ИСПОЛЬЗОВАНИЕ",
  "disclaimer.s3.items": JSON.stringify([
    "Любая деятельность, наносящая физический, психологический, финансовый или репутационный вред лицам или организациям",
    "Несанкционированная слежка, преследование или мониторинг частных лиц без их согласия",
    "Хакерство, несанкционированный доступ к системам, кибератаки или любая форма цифрового вторжения",
    "Содействие, планирование или осуществление актов терроризма, экстремизма или политического насилия",
    "Целевое преследование, доксинг или скоординированные кампании травли против любого человека или группы",
    "Кампании по дезинформации, создание пропаганды или манипулирование общественным мнением",
    "Нарушение любых применимых местных, национальных или международных законов или постановлений",
    "Коммерческая слежка, профилирование или деятельность по продаже данных",
    "Любое использование, нарушающее права на неприкосновенность частной жизни в соответствии с GDPR или аналогичными законами",
    "Военное целеуказание, разработка оружия или наступательные разведывательные операции",
    "Дискриминация по признаку расы, религии, пола, национальности, ориентации или любой защищенной характеристики",
  ]),
  "disclaimer.s4.title": "§4 — ИСТОЧНИКИ ДАННЫХ И ТОЧНОСТЬ",
  "disclaimer.s4.body": "Все данные, отображаемые на этой платформе, получены из общедоступных API и открытых наборов данных (adsb.lol, aisstream.io, USGS, NASA FIRMS, NASA EONET и др.). Платформа не гарантирует точность, полноту или своевременность данных. Данные не должны использоваться в качестве единственного основания для принятия любых решений, которые могут повлиять на безопасность или благополучие людей. Пользователи несут ответственность за самостоятельную проверку всей информации перед её использованием.",
  "disclaimer.s5.title": "§5 — ОТСУТСТВИЕ ОТВЕТСТВЕННОСТИ",
  "disclaimer.s5.body": "Разработчики и участники платформы Redroom не несут ответственности за любое неправомерное использование, ущерб, вред или юридические последствия, возникающие в результате использования этой платформы или её данных. Пользователи принимают на себя полную ответственность за свои действия и соблюдение всех применимых законов. Платформа предоставляется «как есть» без каких-либо гарантий.",
  "disclaimer.s6.title": "§6 — ОТВЕТСТВЕННОЕ РАЗГЛАШЕНИЕ",
  "disclaimer.s6.body": "Если вы обнаружите данные, которые могут скомпрометировать частную жизнь, национальную безопасность или общественную безопасность, вы обязаны немедленно сообщить об этом мейнтейнерам платформы и воздержаться от распространения таких данных.",
  "disclaimer.s6.email": "responsible@redroom.live",
  "disclaimer.s7.title": "§7 — ЛИЦЕНЗИЯ MIT И АТРИБУЦИЯ",
  "disclaimer.s7.body": "Лицензия MIT\nCopyright © 2024–2026 Alexsai · Owlink.ai\n\nНастоящим разрешается бесплатное получение копии данного программного обеспечения любым лицом для использования ПО без ограничений, включая права на использование, копирование, изменение, публикацию, распространение и продажу копий ПО, при условии соблюдения следующих условий:\n\nУказанное выше уведомление об авторских правах и данное уведомление о разрешении должны быть включены во все копии или значительные части Программного обеспечения.\n\nПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ», БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ.",
  "disclaimer.s8.title": "§8 — СОГЛАШЕНИЕ",
  "disclaimer.s8.body": "Принимая эти условия, вы подтверждаете, что вам исполнилось 18 лет, что вы прочитали и поняли все вышеперечисленные пункты и что вы будете использовать эту платформу исключительно в законных, этических и конструктивных целях. Это соглашение является обязательным, и ваше дальнейшее использование платформы означает постоянное согласие с этими условиями.",

  // Checkboxes
  "disclaimer.checkbox.noHarm": "Я подтверждаю, что не буду использовать эту платформу для нанесения вреда, преследования или слежки за кем-либо",
  "disclaimer.checkbox.noHack": "Я подтверждаю, что не буду использовать платформу для несанкционированного доступа, взлома или любой незаконной деятельности",
  "disclaimer.checkbox.researchOnly": "Я подтверждаю, что мое использование ограничивается исследованиями, журналистикой, образованием или иными законными целями",
  "disclaimer.checkbox.noAbuse": "Я понимаю, что неправомерное использование платформы может привести к юридическим последствиям, и принимаю полную ответственность",

  // Accept button
  "disclaimer.btn.accept": "Я ПРИНИМАЮ — ВОЙТИ В REDROOM",
  "disclaimer.btn.notReady": "ОТМЕТЬТЕ ВСЕ ПУНКТЫ ДЛЯ ПРОДОЛЖЕНИЯ",
  "disclaimer.btn.readDisclaimer": "→ ЧИТАТЬ СОГЛАШЕНИЕ",
  "disclaimer.btn.backToHowTo": "← НАЗАД К ИНСТРУКЦИИ",

  // Reminder modal
  "reminder.title": "НАПОМИНАНИЕ ОБ ОТВЕТСТВЕННОМ ИСПОЛЬЗОВАНИИ",
  "reminder.body": "Вы используете Redroom. Пожалуйста, подтвердите, что ваша текущая деятельность остается в рамках этических, законных и ответственных OSINT-исследований.",
  "reminder.questions": JSON.stringify([
    "Использую ли я эти данные только в законных исследовательских целях?",
    "Избегаю ли я нанесения вреда любому лицу или группе лиц?",
    "Уважаю ли я частную жизнь отдельных людей?",
    "Было бы мне комфортно публично объяснить свою текущую деятельность?",
  ]),
  "reminder.btn.confirm": "ДА, Я ДЕЙСТВУЮ ОТВЕТСТВЕННО",
  "reminder.btn.review": "ПРОСМОТРЕТЬ УСЛОВИЯ",

  // ── CONTRIBUTE tab ────────────────────────────────────────────────────────
  "contribute.intro": "Redroom — это проект с открытым исходным кодом, созданный сообществом для исследователей OSINT, журналистов и аналитиков.",
  "contribute.star.title": "Поставьте звезду и поделитесь репозиторием",
  "contribute.star.icon": "⭐",
  "contribute.star.body": "Самое важное, что вы можете сделать — это поставить звезду репозиторию на GitHub и поделиться им. Звезды помогают проекту стать заметнее в сообществе OSINT и безопасности, привлекают разработчиков и показывают, что инструмент ценен и активно используется.",
  "contribute.github.url": "https://github.com/Owlinkai/redroom",
  "contribute.github.label": "github.com/Owlinkai/redroom",
  "contribute.github.sublabel": "Звезда · Форк · Участие",
  "contribute.code.title": "Как внести вклад в код",
  "contribute.code.icon": "🛠",
  "contribute.code.steps": JSON.stringify([
    "Сделайте форк репозитория и создайте ветку для новой функции",
    "Добавляйте новые слои данных, улучшайте визуализации или исправляйте ошибки",
    "Отправьте Pull Request с четким описанием ваших изменений",
    "Соблюдайте существующий стиль кода (TypeScript, tRPC, React 19, Tailwind 4)",
    "Все вклады должны соответствовать принципам этичного использования из Соглашения",
  ]),
  "contribute.ideas.title": "Идеи и запросы функций",
  "contribute.ideas.icon": "💡",
  "contribute.ideas.body": "Есть идея для нового слоя данных или функции анализа? Откройте GitHub Issue с меткой feature-request. Самые популярные идеи попадают в приоритет разработки. Сейчас в приоритете: дополнительные спутниковые ленты, интеграция мониторинга даркнета и расширенные графы связей.",
  "contribute.spread.title": "Расскажите о проекте",
  "contribute.spread.icon": "📣",
  "contribute.spread.items": JSON.stringify([
    { action: "Поделитесь в Twitter/X", detail: "Используйте тег #RedRoomOSINT — это поможет исследователям найти инструмент" },
    { action: "Напишите статью в блоге", detail: "Задокументируйте, как вы используете Redroom в своем рабочем процессе" },
    { action: "Упомяните в научной работе", detail: "Цитируйте платформу в статьях, отчетах или презентациях" },
    { action: "Порекомендуйте коллегам", detail: "Расскажите журналистам и аналитикам в вашей сети о проекте" },
  ]),
  "contribute.follow.title": "Подпишитесь на Alexsai",
  "contribute.follow.icon": "🔗",
  "contribute.linkedin.url": "https://www.linkedin.com/company/alexsai",
  "contribute.linkedin.label": "LinkedIn · Alexsai",
  "contribute.twitter.url": "https://twitter.com/alexsai_com",
  "contribute.twitter.label": "Twitter/X · @alexsai_com",
  "contribute.website.url": "https://alexsai.com",
  "contribute.website.label": "Alexsai.com",
  "contribute.website.sublabel": "Исследования в области ИИ и инструменты разведки",
  "contribute.upgrade.url": "https://owlink.ai/redroom",
  "contribute.upgrade.body": "Выйдите за рамки открытой версии — получите облачное развертывание, приоритетное расширение источников, настраиваемые правила алертов, полный доступ к API и выделенную поддержку. Доступны уровни Enterprise и Sovereign для правительств и редакций СМИ.",
  "contribute.copyright": "© 2024–2026 Alexsai · Owlink.ai — Скрытая разведка для государственных структур и общества",
  "contribute.license": "Redroom V2.4 · Выпущено под лицензией MIT · Открытый исходный код · Создано с ❤ для OSINT-сообщества",

  // ── ENROLL tab ────────────────────────────────────────────────────────────
  "enroll.hero.badge": "ПРЕДСТОЯЩЕЕ БЕСПЛАТНОЕ ОБУЧЕНИЕ",
  "enroll.hero.title": "Освоение разведки с Redroom",
  "enroll.hero.subtitle": "Бесплатный практический тренинг от Alexsai о том, как эффективно использовать Redroom — от основ до продвинутых методик OSINT.",
  "enroll.cta.url": "https://forms.alexsai.com/12356",
  "enroll.cta.label": "🎓 ЗАРЕГИСТРИРОВАТЬ ИНТЕРЕС",
  "enroll.cta.note": "forms.alexsai.com/12356 · Бесплатно · Без обязательств",
  "enroll.modules.title": "Модули обучения",
  "enroll.modules.icon": "📚",
  "enroll.modules": JSON.stringify([
    { num: "01", title: "Как всё начиналось", desc: "История создания Redroom — зачем он был построен, какую проблему решает и каково видение открытой глобальной платформы разведки." },
    { num: "02", title: "Почему именно сейчас?", desc: "Геополитический и технологический контекст, делающий OSINT важнее, чем когда-либо. Рост открытых данных, ИИ и демократизация разведки." },
    { num: "03", title: "Технологический стек", desc: "Глубокое погружение в архитектуру: конвейеры данных, ADS-B, AIS, USGS, API NASA, tRPC, React 19, Leaflet, Three.js и слой интеграции LLM." },
    { num: "04", title: "Данные и источники", desc: "Разбор 10,000+ самолетов, 15,000+ судов, 12,000+ камер CCTV, сейсмических данных, пожаров и агрегации новостей из 100+ источников." },
    { num: "05", title: "Рабочие процессы расследований", desc: "Практика: отслеживание подозрительного судна, сопоставление маршрутов полетов с новостями, построение графов связей и сохранение расследований." },
    { num: "06", title: "Лучшие сценарии использования", desc: "Реальные примеры из журналистских расследований, академической работы, гуманитарного мониторинга и анализа безопасности." },
    { num: "07", title: "Скрытые функции и секреты", desc: "Разбор продвинутых функций: режим наблюдения SVM, рисование полигонов, кросс-слойные алерты, тепловые карты и горячие клавиши." },
    { num: "08", title: "Анонс новых функций", desc: "Эксклюзивный обзор будущих обновлений и плана развития. Каким будет Redroom завтра и как сообщество влияет на него." },
    { num: "09", title: "Секреты LLM для разработчиков", desc: "Как использовать ИИ для создания подобного — промпт-инжиниринг для извлечения данных, структурированный JSON, распознавание сущностей и анализ тональности." },
    { num: "10", title: "Цифры и показатели", desc: "Данные за данными: объемы сигналов, частота обновления, лимиты API, точность и то, как правильно интерпретировать увиденное на карте." },
  ]),
  "enroll.bestfor.title": "Кому подходит",
  "enroll.bestfor.icon": "🎯",
  "enroll.bestfor.roles": JSON.stringify([
    "Технологические гики", "Инженеры ИИ", "Новостные агентства",
    "Исследователи", "Инженеры", "Государственные структуры",
    "НКО", "Сторонники OSINT", "Эксперты по этичному ИИ",
    "Журналисты-расследователи", "Политические аналитики", "Специалисты по безопасности",
    "Преподаватели и академики", "Интересующиеся технологиями", "Основатели стартапов",
  ]),
  "enroll.connected.title": "ОСТАВАЙТЕСЬ НА СВЯЗИ",
  "enroll.linkedin.url": "https://www.linkedin.com/company/alexsai",
  "enroll.twitter.url": "https://twitter.com/alexsai_com",
  "enroll.website.url": "https://alexsai.com",
};

// ─── Helper: parse JSON array safely ─────────────────────────────────────────
function parseArr<T>(val: string, fallback: T[] = []): T[] {
  try { return JSON.parse(val) as T[]; } catch { return fallback; }
}

function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("howto");
  const [accepted, setAccepted] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    noHarm: false,
    noHack: false,
    researchOnly: false,
    noAbuse: false,
  });
  const [reminderInterval, setReminderInterval] = useState<number>(() => {
    const stored = localStorage.getItem(REMINDER_INTERVAL_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_REMINDER_MS;
  });

  // Fetch CMS content overrides
  const { data: cmsRows } = trpc.cms.getSiteContent.useQuery({ section: undefined });
  const cms = useMemo(() => {
    const map: Record<string, string> = { ...DEFAULTS };
    if (cmsRows) {
      for (const row of cmsRows) {
        map[row.key] = row.value;
      }
    }
    return map;
  }, [cmsRows]);
  const c = (key: string) => cms[key] ?? DEFAULTS[key] ?? "";
  const visible = (key: string) => c(key) !== "false";

  // Show on first visit
  useEffect(() => {
    const hasAccepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!hasAccepted) {
      setOpen(true);
      setActiveTab("howto");
    }
  }, []);

  // Responsible-use reminder at chosen interval.
  // Uses a 10-second startup delay so the disclaimer/how-to modal always
  // appears before the reminder. Never fires if LAST_REMINDER_KEY is 0
  // (i.e. the user just accepted for the first time — clock starts fresh).
  useEffect(() => {
    const hasAccepted = localStorage.getItem(DISCLAIMER_KEY);
    if (!hasAccepted) return;

    let intervalTimer: ReturnType<typeof setInterval> | null = null;

    const checkReminder = () => {
      const lastReminder = parseInt(localStorage.getItem(LAST_REMINDER_KEY) || "0", 10);
      const now = Date.now();
      const interval = parseInt(localStorage.getItem(REMINDER_INTERVAL_KEY) || String(DEFAULT_REMINDER_MS), 10);
      // If never set (0), initialise the clock and skip this cycle
      if (lastReminder === 0) {
        localStorage.setItem(LAST_REMINDER_KEY, String(now));
        return;
      }
      if (now - lastReminder >= interval) {
        setReminderOpen(true);
        localStorage.setItem(LAST_REMINDER_KEY, String(now));
      }
    };

    // 10-second startup delay — disclaimer/how-to always loads first
    const startupDelay = setTimeout(() => {
      checkReminder();
      intervalTimer = setInterval(checkReminder, 60 * 1000);
    }, 10000);

    return () => {
      clearTimeout(startupDelay);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [accepted, reminderInterval]);

  const allChecked = Object.values(checkboxes).every(Boolean);

  const handleAccept = useCallback(() => {
    if (!allChecked) return;
    localStorage.setItem(DISCLAIMER_KEY, "1");
    localStorage.setItem(LAST_REMINDER_KEY, String(Date.now()));
    setAccepted(true);
    setOpen(false);
  }, [allChecked]);

  const handleReminderAck = useCallback(() => {
    localStorage.setItem(LAST_REMINDER_KEY, String(Date.now()));
    setReminderOpen(false);
  }, []);

  const openDisclaimer = useCallback(() => {
    setActiveTab("howto");
    setOpen(true);
  }, []);

  const handleReminderChange = (ms: number) => {
    setReminderInterval(ms);
    localStorage.setItem(REMINDER_INTERVAL_KEY, String(ms));
  };

  const TABS: { key: Tab; label: string; show: boolean }[] = (
    [
      { key: "howto" as Tab, label: c("disclaimer.tab.howto.label"), show: visible("disclaimer.tab.howto.visible") },
      { key: "disclaimer" as Tab, label: c("disclaimer.tab.disclaimer.label"), show: visible("disclaimer.tab.disclaimer.visible") },
      { key: "contribute" as Tab, label: c("disclaimer.tab.contribute.label"), show: visible("disclaimer.tab.contribute.visible") },
      { key: "enroll" as Tab, label: c("disclaimer.tab.enroll.label"), show: visible("disclaimer.tab.enroll.visible") },
    ] as { key: Tab; label: string; show: boolean }[]
  ).filter(t => t.show);

  return (
    <>
      {/* ── Full Disclaimer Modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="relative w-full max-w-3xl mx-4 rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 50%, #0a0f1e 100%)",
              border: "1px solid rgba(239,68,68,0.4)",
              boxShadow: "0 0 60px rgba(239,68,68,0.15), 0 0 120px rgba(6,182,212,0.08)",
              maxHeight: "90vh",
            }}
          >
            {/* Header */}
            <div
              className="flex-shrink-0 px-8 pt-8 pb-4"
              style={{ borderBottom: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-widest" style={{ color: "#ef4444", fontFamily: "'Orbitron', monospace" }}>
                    {c("disclaimer.header.title")}
                  </h1>
                  <p className="text-xs tracking-widest" style={{ color: "rgba(239,68,68,0.6)", fontFamily: "monospace" }}>
                    {c("disclaimer.header.subtitle")}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 flex-wrap">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="px-4 py-2 text-xs font-bold tracking-widest rounded-t transition-all"
                    style={{
                      fontFamily: "monospace",
                      background: activeTab === key ? "rgba(239,68,68,0.15)" : "transparent",
                      color: activeTab === key ? "#ef4444" : "rgba(255,255,255,0.4)",
                      borderTop: activeTab === key ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
                      borderLeft: activeTab === key ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
                      borderRight: activeTab === key ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
                      borderBottom: "none",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(239,68,68,0.3) transparent" }}>

              {/* ── HOW TO USE ── */}
              {activeTab === "howto" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-lg" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {c("howto.intro")}
                    </p>
                  </div>

                  <HowToSection icon={c("howto.sigint.icon")} title={c("howto.sigint.title")}>
                    <p className="mb-2">Портал SIGINT предоставляет глобальную карту разведки в реальном времени, объединяющую:</p>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {parseArr<{ label: string; count: string }>(c("howto.sigint.signals")).map(({ label, count }) => (
                        <div key={label} className="flex items-center justify-between px-3 py-1.5 rounded" style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
                          <span className="text-xs font-bold" style={{ color: "#06b6d4" }}>{count}</span>
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-1">
                      {parseArr<string>(c("howto.sigint.tips")).map((tip, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <span style={{ color: "#06b6d4" }}>→</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </HowToSection>

                  <HowToSection icon={c("howto.orbit.icon")} title={c("howto.orbit.title")}>
                    {c("howto.orbit.body")}
                    <ul className="mt-3 space-y-1">
                      {parseArr<string>(c("howto.orbit.tips")).map((tip, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <span style={{ color: "#06b6d4" }}>→</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </HowToSection>

                  <HowToSection icon={c("howto.intel.icon")} title={c("howto.intel.title")}>
                    {c("howto.intel.body")}
                    <ul className="mt-3 space-y-1">
                      {parseArr<string>(c("howto.intel.tips")).map((tip, i) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <span style={{ color: "#06b6d4" }}>→</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </HowToSection>

                  <HowToSection icon={c("howto.usecases.icon")} title={c("howto.usecases.title")}>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {parseArr<{ role: string; use: string }>(c("howto.usecases.items")).map(({ role, use }) => (
                        <div key={role} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="text-xs font-bold mb-1" style={{ color: "#06b6d4" }}>{role}</div>
                          <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{use}</div>
                        </div>
                      ))}
                    </div>
                  </HowToSection>

                  <HowToSection icon={c("howto.ethics.icon")} title={c("howto.ethics.title")}>
                    <ul className="mt-2 space-y-2">
                      {parseArr<string>(c("howto.ethics.items")).map((principle, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <span style={{ color: "#f59e0b", flexShrink: 0 }}>◆</span>
                          {principle}
                        </li>
                      ))}
                    </ul>
                  </HowToSection>
                </div>
              )}

              {/* ── DISCLAIMER & TERMS ── */}
              {activeTab === "disclaimer" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                      <span className="font-bold" style={{ color: "#ef4444" }}>{c("disclaimer.header.title")}</span>{" "}
                      {c("disclaimer.intro")}
                    </p>
                  </div>

                  <Section title={c("disclaimer.s1.title")}>{c("disclaimer.s1.body")}</Section>

                  <Section title={c("disclaimer.s2.title")}>
                    <ul className="space-y-2 mt-2">
                      {parseArr<string>(c("disclaimer.s2.items")).map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                          <span style={{ color: "#06b6d4", flexShrink: 0 }}>✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  <Section title={c("disclaimer.s3.title")}>
                    <div className="p-3 rounded mt-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <ul className="space-y-2">
                        {parseArr<string>(c("disclaimer.s3.items")).map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                            <span style={{ color: "#ef4444", flexShrink: 0 }}>✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Section>

                  <Section title={c("disclaimer.s4.title")}>{c("disclaimer.s4.body")}</Section>
                  <Section title={c("disclaimer.s5.title")}>{c("disclaimer.s5.body")}</Section>

                  <Section title={c("disclaimer.s6.title")}>
                    {c("disclaimer.s6.body")}{" "}
                    Contact: <span style={{ color: "#06b6d4" }}>{c("disclaimer.s6.email")}</span>
                  </Section>

                  <Section title={c("disclaimer.s7.title")}>
                    <div className="p-3 rounded mt-2 font-mono text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {c("disclaimer.s7.body")}
                    </div>
                  </Section>

                  <Section title={c("disclaimer.s8.title")}>{c("disclaimer.s8.body")}</Section>

                  {/* Reminder interval selector */}
                  <div className="p-4 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <div className="text-xs font-bold tracking-widest mb-3" style={{ color: "#f59e0b", fontFamily: "monospace" }}>
                      ⏱ RESPONSIBLE USE REMINDER INTERVAL
                    </div>
                    <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Redroom will periodically remind you to use the platform responsibly. Choose your preferred reminder frequency:
                    </p>
                    <div className="flex gap-2">
                      {[
                        { label: "15 MIN", ms: 15 * 60 * 1000 },
                        { label: "30 MIN", ms: 30 * 60 * 1000 },
                        { label: "60 MIN", ms: 60 * 60 * 1000 },
                      ].map(({ label, ms }) => (
                        <button
                          key={ms}
                          onClick={() => handleReminderChange(ms)}
                          className="flex-1 py-2 rounded text-xs font-bold tracking-widest transition-all"
                          style={{
                            fontFamily: "monospace",
                            background: reminderInterval === ms ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)",
                            border: reminderInterval === ms ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.1)",
                            color: reminderInterval === ms ? "#f59e0b" : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3 pt-2">
                    {(["noHarm", "noHack", "researchOnly", "noAbuse"] as const).map((key) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer group">
                        <div
                          className="flex-shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center transition-all"
                          style={{
                            background: checkboxes[key] ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.05)",
                            border: checkboxes[key] ? "1px solid #06b6d4" : "1px solid rgba(255,255,255,0.2)",
                          }}
                          onClick={() => setCheckboxes(prev => ({ ...prev, [key]: !prev[key] }))}
                        >
                          {checkboxes[key] && (
                            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#06b6d4" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
                          )}
                        </div>
                        <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {c(`disclaimer.checkbox.${key}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CONTRIBUTE ── */}
              {activeTab === "contribute" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-lg" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)" }}>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {c("contribute.intro")}
                    </p>
                  </div>

                  <HowToSection icon={c("contribute.star.icon")} title={c("contribute.star.title")}>
                    {c("contribute.star.body")}
                    <div className="mt-3 flex flex-col gap-2">
                      <a
                        href={c("contribute.github.url")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-90"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", textDecoration: "none" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                        <div>
                          <div className="text-xs font-bold" style={{ color: "#06b6d4" }}>{c("contribute.github.label")}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{c("contribute.github.sublabel")}</div>
                        </div>
                      </a>
                    </div>
                  </HowToSection>

                  <HowToSection icon={c("contribute.code.icon")} title={c("contribute.code.title")}>
                    <ul className="mt-2 space-y-2">
                      {parseArr<string>(c("contribute.code.steps")).map((step, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <span style={{ color: "#06b6d4", flexShrink: 0 }}>{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </HowToSection>

                  <HowToSection icon={c("contribute.ideas.icon")} title={c("contribute.ideas.title")}>
                    {c("contribute.ideas.body")}
                  </HowToSection>

                  <HowToSection icon={c("contribute.spread.icon")} title={c("contribute.spread.title")}>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {parseArr<{ action: string; detail: string }>(c("contribute.spread.items")).map(({ action, detail }) => (
                        <div key={action} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="text-xs font-bold mb-1" style={{ color: "#06b6d4" }}>{action}</div>
                          <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{detail}</div>
                        </div>
                      ))}
                    </div>
                  </HowToSection>

                  {/* Follow Alexsai */}
                  <HowToSection icon={c("contribute.follow.icon")} title={c("contribute.follow.title")}>
                    <div className="flex flex-col gap-3 mt-3">
                      <a href={c("contribute.linkedin.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-90"
                        style={{ background: "rgba(10,102,194,0.12)", border: "1px solid rgba(10,102,194,0.35)", textDecoration: "none" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        <div>
                          <div className="text-xs font-bold" style={{ color: "#0a66c2" }}>{c("contribute.linkedin.label")}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{c("contribute.linkedin.url").replace("https://","")}</div>
                        </div>
                      </a>
                      <a href={c("contribute.twitter.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-90"
                        style={{ background: "rgba(29,161,242,0.08)", border: "1px solid rgba(29,161,242,0.3)", textDecoration: "none" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1da1f2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <div>
                          <div className="text-xs font-bold" style={{ color: "#1da1f2" }}>{c("contribute.twitter.label")}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{c("contribute.twitter.url").replace("https://","")}</div>
                        </div>
                      </a>
                      <a href={c("contribute.website.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-90"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", textDecoration: "none" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                        <div>
                          <div className="text-xs font-bold" style={{ color: "#ef4444" }}>{c("contribute.website.label")}</div>
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{c("contribute.website.sublabel")}</div>
                        </div>
                      </a>
                    </div>
                  </HowToSection>

                  {/* Request Access / Waiting List */}
                  <div className="p-4 rounded-lg" style={{ background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.25)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,200,255,0.12)", border: "1px solid rgba(0,200,255,0.3)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,200,255,0.8)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: "rgba(0,200,255,0.9)" }}>Запросить доступ аналитика</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Присоединяйтесь к списку ожидания, чтобы стать авторизованным участником</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Авторизованные аналитики получают доступ к расширенным функциям разведки, включая проверку нарративов, отправку проверенных источников и полный конвейер OSINT. Регистрация скоро откроется — присоединяйтесь к списку ожидания.
                    </p>
                    <button
                      onClick={() => setWaitingListOpen(true)}
                      className="w-full py-2.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "rgba(0,200,255,0.12)", border: "1px solid rgba(0,200,255,0.35)", color: "rgba(0,200,255,0.9)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.2)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,200,255,0.12)"; }}
                    >
                      🔐 Join the Waiting List →
                    </button>
                  </div>

                  {/* Upgrade to Enterprise */}
                  <div className="p-4 rounded-lg" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.35)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.9)" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold" style={{ color: "rgba(248,113,113,0.95)" }}>Перейти на Enterprise</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Разблокируйте полный набор инструментов Owlink · Redroom</div>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
                      {c("contribute.upgrade.body")}
                    </p>
                    <div className="flex justify-center">
                      <UpgradeButton portal="contribute" variant="compact" className="w-full" />
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="p-4 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                      {c("contribute.copyright")}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {c("contribute.license")}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ENROLL ── */}
              {activeTab === "enroll" && (
                <div className="space-y-5">
                  {/* Hero */}
                  <div className="p-5 rounded-xl text-center" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(6,182,212,0.08) 100%)", border: "1px solid rgba(239,68,68,0.3)" }}>
                    <div className="text-xs font-bold tracking-widest mb-2" style={{ color: "rgba(239,68,68,0.7)", fontFamily: "monospace" }}>{c("enroll.hero.badge")}</div>
                    <h2 className="text-lg font-bold tracking-wider mb-1" style={{ color: "#fff", fontFamily: "'Orbitron', monospace" }}>
                      {c("enroll.hero.title")}
                    </h2>
                    <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {c("enroll.hero.subtitle")}
                    </p>
                    <a
                      href={c("enroll.cta.url")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-bold tracking-widest transition-all hover:opacity-90"
                      style={{
                        background: "linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.15) 100%)",
                        border: "1px solid rgba(239,68,68,0.6)",
                        color: "#ef4444",
                        textDecoration: "none",
                        boxShadow: "0 0 20px rgba(239,68,68,0.2)",
                        fontFamily: "monospace",
                      }}
                    >
                      {c("enroll.cta.label")}
                    </a>
                    <div className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{c("enroll.cta.note")}</div>
                  </div>

                  {/* Modules */}
                  <HowToSection icon={c("enroll.modules.icon")} title={c("enroll.modules.title")}>
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      {parseArr<{ num: string; title: string; desc: string }>(c("enroll.modules")).map(({ num, title, desc }) => (
                        <div key={num} className="flex gap-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: "monospace" }}>{num}</div>
                          <div>
                            <div className="text-xs font-bold mb-0.5" style={{ color: "#06b6d4" }}>{title}</div>
                            <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </HowToSection>

                  {/* Best For */}
                  <HowToSection icon={c("enroll.bestfor.icon")} title={c("enroll.bestfor.title")}>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {parseArr<string>(c("enroll.bestfor.roles")).map((role) => (
                        <div key={role} className="px-2 py-1.5 rounded text-center text-xs" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "rgba(255,255,255,0.7)" }}>
                          {role}
                        </div>
                      ))}
                    </div>
                  </HowToSection>

                  {/* CTA + Follow */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <div className="text-xs font-bold tracking-widest mb-3" style={{ color: "#ef4444", fontFamily: "monospace" }}>{c("enroll.connected.title")}</div>
                    <div className="flex flex-col gap-2">
                      <a href={c("enroll.cta.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all hover:opacity-90"
                        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", textDecoration: "none", fontFamily: "monospace" }}>
                        {c("enroll.cta.label")} — {c("enroll.cta.note")}
                      </a>
                      <a href={c("enroll.linkedin.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all hover:opacity-90"
                        style={{ background: "rgba(10,102,194,0.1)", border: "1px solid rgba(10,102,194,0.3)", color: "#0a66c2", textDecoration: "none", fontFamily: "monospace" }}>
                        💼 Follow on LinkedIn · {c("enroll.linkedin.url").replace("https://","")}
                      </a>
                      <a href={c("enroll.twitter.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all hover:opacity-90"
                        style={{ background: "rgba(29,161,242,0.08)", border: "1px solid rgba(29,161,242,0.25)", color: "#1da1f2", textDecoration: "none", fontFamily: "monospace" }}>
                        🐦 Follow on Twitter/X · {c("enroll.twitter.url").replace("https://","")}
                      </a>
                      <a href={c("enroll.website.url")} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all hover:opacity-90"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", textDecoration: "none", fontFamily: "monospace" }}>
                        🌐 Visit {c("enroll.website.url").replace("https://","")}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-8 py-5 flex items-center justify-between" style={{ borderTop: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                {c("disclaimer.footer.version")}
              </div>
              <div className="flex gap-3">
                {activeTab === "howto" ? (
                  <button
                    onClick={() => setActiveTab("disclaimer")}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-widest transition-all"
                    style={{ fontFamily: "monospace", background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", color: "#06b6d4" }}
                  >
                    {c("disclaimer.btn.readDisclaimer")}
                  </button>
                ) : activeTab === "contribute" || activeTab === "enroll" ? (
                  <button
                    onClick={() => setActiveTab("howto")}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-widest transition-all"
                    style={{ fontFamily: "monospace", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", color: "#06b6d4" }}
                  >
                    {c("disclaimer.btn.backToHowTo")}
                  </button>
                ) : (
                  <button
                    onClick={handleAccept}
                    disabled={!allChecked}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-widest transition-all"
                    style={{
                      fontFamily: "monospace",
                      background: allChecked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                      border: allChecked ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)",
                      color: allChecked ? "#ef4444" : "rgba(255,255,255,0.25)",
                      cursor: allChecked ? "pointer" : "not-allowed",
                      boxShadow: allChecked ? "0 0 20px rgba(239,68,68,0.2)" : "none",
                    }}
                  >
                    {allChecked ? c("disclaimer.btn.accept") : c("disclaimer.btn.notReady")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Responsible Use Reminder ── */}
      {reminderOpen && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-8"
            style={{
              background: "linear-gradient(135deg, #0a0f1e 0%, #0d1a2e 100%)",
              border: "1px solid rgba(245,158,11,0.4)",
              boxShadow: "0 0 40px rgba(245,158,11,0.15)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="1.5"/>
                  <path d="M12 7v5l3 3" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold tracking-widest" style={{ color: "#f59e0b", fontFamily: "'Orbitron', monospace" }}>
                  {c("reminder.title")}
                </div>
                <div className="text-xs" style={{ color: "rgba(245,158,11,0.6)", fontFamily: "monospace" }}>
                  {reminderInterval === 15 * 60 * 1000 ? "15" : reminderInterval === 60 * 60 * 1000 ? "60" : "30"}-MINUTE CHECK-IN
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.8)" }}>
              {c("reminder.body")}
            </p>

            <div className="space-y-2 mb-6">
              {parseArr<string>(c("reminder.questions")).map((q, i) => (
                <div key={i} className="flex gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: "#f59e0b", flexShrink: 0 }}>?</span>
                  {q}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReminderAck}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold tracking-widest transition-all"
                style={{ fontFamily: "monospace", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b" }}
              >
                {c("reminder.btn.confirm")}
              </button>
              <button
                onClick={() => { setReminderOpen(false); setOpen(true); setActiveTab("disclaimer"); }}
                className="px-4 py-2.5 rounded-lg text-xs transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
              >
                {c("reminder.btn.review")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Shield Icon ── */}
      {!open && visible("disclaimer.visible") && (
        <button
          onClick={openDisclaimer}
          title={c("disclaimer.button.tooltip")}
          className="fixed bottom-6 right-6 z-[9990] w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: "rgba(10,15,30,0.9)",
            border: "1px solid rgba(239,68,68,0.4)",
            boxShadow: "0 0 20px rgba(239,68,68,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
      <WaitingListModal open={waitingListOpen} onClose={() => setWaitingListOpen(false)} />
    </>
  );
}

// Helper sub-components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-widest mb-2" style={{ color: "#ef4444", fontFamily: "monospace" }}>
        {title}
      </h3>
      <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
        {children}
      </div>
    </div>
  );
}

function HowToSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <h3 className="text-sm font-bold tracking-wider mb-2 flex items-center gap-2" style={{ color: "#06b6d4", fontFamily: "monospace" }}>
        <span>{icon}</span>
        {title}
      </h3>
      <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
        {children}
      </div>
    </div>
  );
}

export default DisclaimerModal;
