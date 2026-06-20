/* =========================================================
   Shared tile registry (описание страниц, плашек и их полей)
   Используется и админ-панелью (admin.js), и публичными
   страницами (script.js) — чтобы было единое место для
   перечня data-tile и их редактируемых полей.
   ========================================================= */
window.PAGE_REGISTRY = [
  {
    key: 'index',
    title: 'Главная',
    file: 'index.html',
    tiles: [
      {
        id: 'hero', name: 'Hero-блок (заголовок + CTA)',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.hero__title',    type: 'html',
            default: 'Твоё будущее<br>начинается здесь' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.hero__subtitle', type: 'multiline',
            default: 'Искусственный интеллект меняет мир прямо сейчас. Стань тем, кто создаёт технологии завтрашнего дня — начни с лучшего факультета страны.' },
          { id: 'btn-primary', label: 'Основная кнопка', selector: '.hero__actions .btn--primary', type: 'text',
            default: 'Узнать шансы поступления' },
          { id: 'btn-outline', label: 'Кнопка справа',   selector: '.hero__actions .btn--outline', type: 'text',
            default: 'Программы обучения' },
          { id: 'meta-1-label', label: 'Плашка 1 · подпись', selector: '.hero__meta-item:nth-of-type(1) .hero__meta-label', type: 'text', default: 'До конца приёма' },
          { id: 'meta-2-label', label: 'Плашка 2 · подпись', selector: '.hero__meta-item:nth-of-type(2) .hero__meta-label', type: 'text', default: 'Сейчас учатся' },
          { id: 'meta-2-value', label: 'Плашка 2 · значение', selector: '.hero__meta-item:nth-of-type(2) .hero__meta-value', type: 'text', default: '127 студентов' },
          { id: 'meta-3-label', label: 'Плашка 3 · подпись', selector: '.hero__meta-item:nth-of-type(3) .hero__meta-label', type: 'text', default: 'Приём декана' },
          { id: 'meta-3-value', label: 'Плашка 3 · значение', selector: '.hero__meta-item:nth-of-type(3) .hero__meta-value', type: 'text', default: 'Ср · 15:00 – 17:00' },
        ],
      },
      {
        id: 'about-section', name: 'Секция «О факультете» (целиком)',
        fields: [
          { id: 'title',    label: 'Заголовок секции', selector: '.section__title',    type: 'text',
            default: 'О факультете' },
          { id: 'subtitle', label: 'Подзаголовок',     selector: '.section__subtitle', type: 'text',
            default: 'Цифры, которые говорят сами за себя' },
        ],
      },
      {
        id: 'programs-section', name: 'Секция «Программы обучения» (целиком)',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Программы обучения' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'text', default: 'Выбери свой путь в мире ИИ' },
        ],
      },
      {
        id: 'reviews-section', name: 'Секция «Отзывы студентов» (целиком)',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Отзывы студентов' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'text', default: 'Те, кто уже выбрал будущее' },
        ],
      },
      {
        id: 'review-1', name: 'Отзыв · Анна Климова',
        fields: [
          { id: 'avatar', label: 'Инициалы',     selector: '.review__avatar', type: 'text', default: 'АК' },
          { id: 'photo',  label: 'Фотография',    selector: '.review__avatar', type: 'image', default: '' },
          { id: 'name',   label: 'Имя',          selector: '.review__name',   type: 'text', default: 'Анна Климова' },
          { id: 'role',   label: 'Роль',         selector: '.review__role',   type: 'text', default: '3 курс, ИИ и МО' },
          { id: 'text',   label: 'Текст отзыва', selector: '.review__text',   type: 'multiline',
            default: '«Здесь не просто учат программировать — тебя реально погружают в науку. На втором курсе я уже работала над проектом с Яндексом. Это лучшее решение в моей жизни.»' },
        ],
      },
      {
        id: 'review-2', name: 'Отзыв · Дмитрий Морозов',
        fields: [
          { id: 'avatar', label: 'Инициалы',     selector: '.review__avatar', type: 'text', default: 'ДМ' },
          { id: 'photo',  label: 'Фотография',    selector: '.review__avatar', type: 'image', default: '' },
          { id: 'name',   label: 'Имя',          selector: '.review__name',   type: 'text', default: 'Дмитрий Морозов' },
          { id: 'role',   label: 'Роль',         selector: '.review__role',   type: 'text', default: 'Выпускник 2025' },
          { id: 'text',   label: 'Текст отзыва', selector: '.review__text',   type: 'multiline',
            default: '«Факультет дал мне не только хард-скиллы, но и комьюнити. Хакатоны, митапы, стартап-инкубатор — всё это здесь. Сейчас работаю ML-инженером в Сбере.»' },
        ],
      },
      {
        id: 'review-3', name: 'Отзыв · Елена Сидорова',
        fields: [
          { id: 'avatar', label: 'Инициалы',     selector: '.review__avatar', type: 'text', default: 'ЕС' },
          { id: 'photo',  label: 'Фотография',    selector: '.review__avatar', type: 'image', default: '' },
          { id: 'name',   label: 'Имя',          selector: '.review__name',   type: 'text', default: 'Елена Сидорова' },
          { id: 'role',   label: 'Роль',         selector: '.review__role',   type: 'text', default: '2 курс, Робототехника' },
          { id: 'text',   label: 'Текст отзыва', selector: '.review__text',   type: 'multiline',
            default: '«Я думала, что ИИ — это что-то далёкое и сложное. А тут уже на первом курсе мы собирали роботов и учили их распознавать объекты. Это было нереально круто!»' },
        ],
      },
      {
        id: 'apply-section', name: 'CTA «Готов сделать первый шаг?»',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Готов сделать первый шаг?' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'multiline',
            default: 'Оставь заявку, и мы расскажем всё о поступлении — баллы ЕГЭ, олимпиады и бюджетные места.' },
          { id: 'btn',      label: 'Кнопка',       selector: '.btn--white',        type: 'text', default: 'Оставить заявку' },
        ],
      },

      // ---- ДОСТИЖЕНИЯ (КАРУСЕЛЬ) ----
      {
        id: 'achievements-carousel', name: 'Секция «Достижения» — заголовок',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text',
            default: 'Победы, которые говорят за нас.' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'multiline',
            default: 'Научные премии, победы в соревнованиях и признание индустрии — результат совместной работы студентов и преподавателей.' },
        ],
      },
      // ---- ПРЕПОДАВАТЕЛИ (КАРУСЕЛЬ) ----
      {
        id: 'teachers-carousel', name: 'Секция «Преподаватели» — заголовок',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text',
            default: 'Учёные, которые передают знания.' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'multiline',
            default: 'Каждый преподаватель — действующий исследователь с публикациями, грантами и опытом работы в индустрии.' },
        ],
      },
    ],
    lists: [
      { id: 'about-cards',  container: '#about .cards',        item: '.card',          template: 'about-card',   addLabel: 'Добавить карточку' },
      { id: 'programs',     container: '.cards--programs',     item: '.card--program', template: 'program-card', addLabel: 'Добавить программу' },
      { id: 'achievements', container: '#achievementsCarousel', item: '.achieve-card', template: 'achieve-card', addLabel: 'Добавить достижение' },
      { id: 'teachers',     container: '#teachersCarousel',     item: '.teacher-card', template: 'teacher-card', addLabel: 'Добавить преподавателя' },
    ],
    templates: {
      'about-card': {
        name: 'Карточка «О факультете»',
        html:
          '<div class="card">' +
            '<span class="card__icon">Заголовок</span>' +
            '<span class="card__number">00</span>' +
            '<p class="card__text">Описание карточки…</p>' +
          '</div>',
        fields: [
          { id: 'icon',   label: 'Подпись сверху', selector: '.card__icon',   type: 'text', default: 'Заголовок' },
          { id: 'number', label: 'Число',          selector: '.card__number', type: 'html', default: '00' },
          { id: 'text',   label: 'Описание',       selector: '.card__text',   type: 'multiline', default: 'Описание карточки…' },
        ],
      },
      'program-card': {
        name: 'Программа обучения',
        html:
          '<article class="card card--program">' +
            '<span class="card__badge">Бакалавриат · 4 года</span>' +
            '<h3 class="card__heading">Название программы</h3>' +
            '<p class="card__desc">Краткое описание программы…</p>' +
            '<a href="#apply" class="btn btn--primary btn--sm">Подробнее <span class="arrow">→</span></a>' +
          '</article>',
        fields: [
          { id: 'badge',   label: 'Бейдж',    selector: '.card__badge',   type: 'text', default: 'Бакалавриат · 4 года' },
          { id: 'heading', label: 'Название', selector: '.card__heading', type: 'text', default: 'Название программы' },
          { id: 'desc',    label: 'Описание', selector: '.card__desc',    type: 'multiline', default: 'Краткое описание программы…' },
          { id: 'btn',     label: 'Кнопка',   selector: '.btn',           type: 'html', default: 'Подробнее <span class="arrow">→</span>' },
        ],
      },
      'achieve-card': {
        name: 'Достижение',
        html:
          '<article class="achieve-card">' +
            '<span class="achieve-card__tag">Категория</span>' +
            '<p class="achieve-card__year">2025</p>' +
            '<h3 class="achieve-card__title">Заголовок достижения</h3>' +
            '<p class="achieve-card__desc">Описание достижения…</p>' +
          '</article>',
        fields: [
          { id: 'tag',   label: 'Категория', selector: '.achieve-card__tag',   type: 'text', default: 'Категория' },
          { id: 'year',  label: 'Год',       selector: '.achieve-card__year',  type: 'text', default: '2025' },
          { id: 'title', label: 'Заголовок', selector: '.achieve-card__title', type: 'text', default: 'Заголовок достижения' },
          { id: 'desc',  label: 'Описание',  selector: '.achieve-card__desc',  type: 'multiline', default: 'Описание достижения…' },
        ],
      },
      'teacher-card': {
        name: 'Преподаватель',
        html:
          '<article class="teacher-card">' +
            '<div class="teacher-card__avatar">НН</div>' +
            '<div class="teacher-card__body">' +
              '<h3 class="teacher-card__name">Имя Фамилия</h3>' +
              '<p class="teacher-card__rank">Учёная степень</p>' +
              '<p class="teacher-card__role">Должность</p>' +
              '<p class="teacher-card__bio">Краткая биография…</p>' +
            '</div>' +
          '</article>',
        fields: [
          { id: 'avatar', label: 'Инициалы',       selector: '.teacher-card__avatar', type: 'text',  default: 'НН' },
          { id: 'photo',  label: 'Фотография',     selector: '.teacher-card__avatar', type: 'image', default: '' },
          { id: 'name',   label: 'ФИО',            selector: '.teacher-card__name',   type: 'text',  default: 'Имя Фамилия' },
          { id: 'rank',   label: 'Учёная степень', selector: '.teacher-card__rank',   type: 'text',  default: 'Учёная степень' },
          { id: 'role',   label: 'Должность',      selector: '.teacher-card__role',   type: 'text',  default: 'Должность' },
          { id: 'bio',    label: 'Биография',      selector: '.teacher-card__bio',    type: 'multiline', default: 'Краткая биография…' },
        ],
      },
    },
  },
  {
    key: 'about',
    title: 'О факультете',
    file: 'about.html',
    tiles: [
      {
        id: 'about-hero', name: 'Hero-блок',
        fields: [
          { id: 'badge', label: 'Бейдж',      selector: '.about-hero__badge', type: 'text', default: 'Факультет будущего' },
          { id: 'title', label: 'Заголовок',  selector: '.about-hero__title', type: 'text', default: 'Факультет искусственного интеллекта' },
          { id: 'lead',  label: 'Вступление', selector: '.about-hero__lead',  type: 'multiline',
            default: 'Готовим специалистов в сфере анализа данных, машинного обучения и глубокого обучения нового уровня. Выпускники факультета смогут успешно реализовать себя как в работе в государственных корпорациях, так и в рамках частного бизнеса, решать практические задачи по развитию, созданию и усовершенствованию технологий искусственного интеллекта.' },
          { id: 'btn-primary', label: 'Основная кнопка', selector: '.about-hero__actions .btn--primary', type: 'text', default: 'Поступить' },
          { id: 'btn-outline', label: 'Кнопка справа',   selector: '.about-hero__actions .btn--outline', type: 'text', default: 'Узнать больше' },
        ],
      },
      {
        id: 'infrastructure-section', name: 'Секция «Инфраструктура и технологии»',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.about-section__eyebrow', type: 'text', default: 'Инфраструктура' },
          { id: 'title',   label: 'Заголовок',    selector: '.about-section__title',   type: 'text', default: 'Инфраструктура и технологии' },
          { id: 'intro',   label: 'Вступление',   selector: '.about-section__intro',   type: 'multiline',
            default: 'Факультет оснащён современным техническим оборудованием. Студентам доступна лаборатория ИИ, менторство ведущих разработчиков и вычислительные мощности суперкомпьютера РУДН.' },
        ],
      },
      {
        id: 'infra-card-1', name: 'Карточка · Современное оборудование',
        fields: [
          { id: 'title', label: 'Заголовок', selector: '.infra-card__title', type: 'text', default: 'Современное оборудование' },
          { id: 'text',  label: 'Текст',     selector: '.infra-card__text',  type: 'multiline',
            default: 'Факультет оснащён современным техническим оборудованием — передовая база для практической подготовки на уровне индустриальных стандартов.' },
        ],
      },
      {
        id: 'infra-card-2', name: 'Карточка · Лаборатория ИИ',
        fields: [
          { id: 'title', label: 'Заголовок', selector: '.infra-card__title', type: 'text', default: 'Лаборатория искусственного интеллекта' },
          { id: 'text',  label: 'Текст',     selector: '.infra-card__text',  type: 'multiline',
            default: 'Открыта лаборатория ИИ, в которой студенты и преподаватели реализуют самые смелые проекты под менторством ведущих разработчиков отрасли.' },
        ],
      },
      {
        id: 'infra-card-3', name: 'Карточка · Суперкомпьютер РУДН',
        fields: [
          { id: 'title', label: 'Заголовок', selector: '.infra-card__title', type: 'text', default: 'Суперкомпьютер РУДН' },
          { id: 'text',  label: 'Текст',     selector: '.infra-card__text',  type: 'multiline',
            default: 'Обучающимся предоставляется доступ к суперкомпьютеру РУДН — для расчётов, обучения нейросетей и масштабных научных задач.' },
        ],
      },
      {
        id: 'leadership-section', name: 'Секция «Деканат и лаборатория ИИ» — заголовок',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.about-section__eyebrow', type: 'text', default: '02 — Руководство' },
          { id: 'title',   label: 'Заголовок',    selector: '.about-section__title',   type: 'text', default: 'Деканат и лаборатория ИИ.' },
          { id: 'intro',   label: 'Вступление',   selector: '.about-section__intro',   type: 'multiline',
            default: 'Деканы факультета и заместители руководителя лаборатории искусственного интеллекта — команда, которая курирует образовательную и научную работу.' },
        ],
      },
      {
        id: 'leadership-dean', name: 'Руководство · Декан',
        fields: [
          { id: 'photo',   label: 'Фотография', selector: '.leadership-card__photo',   type: 'image', default: '' },
          { id: 'role',    label: 'Должность',  selector: '.leadership-card__role',    type: 'text', default: 'Декан' },
          { id: 'name',    label: 'ФИО',        selector: '.leadership-card__name',    type: 'text', default: 'Имя Фамилия' },
          { id: 'caption', label: 'Подпись',    selector: '.leadership-card__caption', type: 'multiline', default: 'Декан факультета искусственного интеллекта.' },
        ],
      },
      {
        id: 'leadership-vice-dean', name: 'Руководство · Заместитель декана',
        fields: [
          { id: 'photo',   label: 'Фотография', selector: '.leadership-card__photo',   type: 'image', default: '' },
          { id: 'role',    label: 'Должность',  selector: '.leadership-card__role',    type: 'text', default: 'Заместитель декана' },
          { id: 'name',    label: 'ФИО',        selector: '.leadership-card__name',    type: 'text', default: 'Имя Фамилия' },
          { id: 'caption', label: 'Подпись',    selector: '.leadership-card__caption', type: 'multiline', default: 'Заместитель декана по учебной работе.' },
        ],
      },
      {
        id: 'leadership-lab-deputy-1', name: 'Руководство · Зам. лаборатории ИИ (1)',
        fields: [
          { id: 'photo',   label: 'Фотография', selector: '.leadership-card__photo',   type: 'image', default: '' },
          { id: 'role',    label: 'Должность',  selector: '.leadership-card__role',    type: 'text', default: 'Зам. лаборатории ИИ' },
          { id: 'name',    label: 'ФИО',        selector: '.leadership-card__name',    type: 'text', default: 'Имя Фамилия' },
          { id: 'caption', label: 'Подпись',    selector: '.leadership-card__caption', type: 'multiline', default: 'Заместитель руководителя лаборатории ИИ.' },
        ],
      },
      {
        id: 'leadership-lab-deputy-2', name: 'Руководство · Зам. лаборатории ИИ (2)',
        fields: [
          { id: 'photo',   label: 'Фотография', selector: '.leadership-card__photo',   type: 'image', default: '' },
          { id: 'role',    label: 'Должность',  selector: '.leadership-card__role',    type: 'text', default: 'Зам. лаборатории ИИ' },
          { id: 'name',    label: 'ФИО',        selector: '.leadership-card__name',    type: 'text', default: 'Имя Фамилия' },
          { id: 'caption', label: 'Подпись',    selector: '.leadership-card__caption', type: 'multiline', default: 'Заместитель руководителя лаборатории ИИ.' },
        ],
      },
      {
        id: 'partners-section', name: 'Секция «Партнёры и практика»',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.about-section__eyebrow', type: 'text', default: 'Партнёры' },
          { id: 'title',   label: 'Заголовок',    selector: '.about-section__title',   type: 'text', default: 'Партнёры и практика' },
          { id: 'text',    label: 'Описание',     selector: '.partners-text p',        type: 'html',
            default: 'Образовательные программы факультета реализуются совместно с компаниями-партнёрами — <strong>Сбер</strong> и <strong>Альфа-Банк</strong> — IT-гигантами, признанными не только в России. Обучение направлено на развитие конкретных практических навыков в области искусственного интеллекта, необходимых для работы в крупнейших компаниях отрасли.' },
        ],
      },
      {
        id: 'partner-sber', name: 'Партнёр · Сбер',
        fields: [
          { id: 'logo',    label: 'Логотип/Название', selector: '.partner-card__logo',    type: 'text', default: 'Сбер' },
          { id: 'caption', label: 'Подпись',          selector: '.partner-card__caption', type: 'text', default: 'Технологический партнёр' },
        ],
      },
      {
        id: 'partner-alfa', name: 'Партнёр · Альфа-Банк',
        fields: [
          { id: 'logo',    label: 'Логотип/Название', selector: '.partner-card__logo',    type: 'text', default: 'Альфа-Банк' },
          { id: 'caption', label: 'Подпись',          selector: '.partner-card__caption', type: 'text', default: 'Технологический партнёр' },
        ],
      },
      {
        id: 'career-cta', name: 'CTA «Карьера ещё до диплома»',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.career-cta__eyebrow', type: 'text', default: 'Карьерные перспективы' },
          { id: 'title',   label: 'Заголовок',    selector: '.career-cta__title',   type: 'text', default: 'Карьера ещё до диплома' },
          { id: 'text',    label: 'Описание',     selector: '.career-cta__text',    type: 'multiline',
            default: 'Большинство студентов могут получить предложение о работе ещё до окончания обучения в бакалавриате и имеют возможность продолжить учёбу в магистратуре за счёт работодателя.' },
          { id: 'item-1',  label: 'Пункт 1',      selector: '.career-cta__item:nth-child(1) .career-cta__item-text', type: 'text',
            default: 'Оффер до окончания бакалавриата' },
          { id: 'item-2',  label: 'Пункт 2',      selector: '.career-cta__item:nth-child(2) .career-cta__item-text', type: 'text',
            default: 'Магистратура за счёт работодателя' },
          { id: 'btn',     label: 'Кнопка',       selector: '.btn--white',          type: 'text', default: 'Узнать об условиях поступления' },
        ],
      },
    ],
  },
  {
    key: 'achievements',
    title: 'Достижения',
    file: 'achievements.html',
    tiles: [
      {
        id: 'stub-content', name: 'Основной контент страницы',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Достижения' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'text', default: 'Страница находится в разработке' },
          { id: 'btn',      label: 'Кнопка',       selector: '.btn',               type: 'text', default: 'Назад на главную' },
        ],
      },
    ],
  },
  {
    key: 'news',
    title: 'Новости',
    file: 'news.html',
    tiles: [
      {
        id: 'stub-content', name: 'Основной контент страницы',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Новости' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'text', default: 'Страница находится в разработке' },
          { id: 'btn',      label: 'Кнопка',       selector: '.btn',               type: 'text', default: 'Назад на главную' },
        ],
      },
    ],
  },
  {
    key: 'reviews',
    title: 'Отзывы',
    file: 'reviews.html',
    tiles: [
      {
        id: 'reviews-section', name: 'Секция «Отзывы» — заголовок',
        fields: [
          { id: 'eyebrow',  label: 'Надзаголовок', selector: '.section__eyebrow',  type: 'text',
            default: 'Голоса студентов и выпускников' },
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Отзывы.' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'multiline',
            default: 'Студенты, выпускники и преподаватели рассказывают, как устроена учебная и научная жизнь факультета.' },
        ],
      },
    ],
    // Repeatable, admin-managed blocks. Each list points at a container in the
    // page and a template to clone; instances live in the DB (dynamic_blocks).
    lists: [
      { id: 'reviews-grid', container: '.reviews__grid', template: 'review-card', addLabel: 'Добавить отзыв' },
    ],
    templates: {
      'review-card': {
        name: 'Отзыв',
        html:
          '<figure class="review">' +
            '<blockquote class="review__text">Текст отзыва…</blockquote>' +
            '<figcaption class="review__header">' +
              '<span class="review__avatar">НН</span>' +
              '<div>' +
                '<div class="review__name">Имя Фамилия</div>' +
                '<div class="review__role">Студент</div>' +
              '</div>' +
            '</figcaption>' +
          '</figure>',
        fields: [
          { id: 'text',   label: 'Текст отзыва', selector: '.review__text',   type: 'multiline', default: 'Текст отзыва…' },
          { id: 'avatar', label: 'Инициалы',     selector: '.review__avatar', type: 'text',  default: 'НН' },
          { id: 'photo',  label: 'Фотография',   selector: '.review__avatar', type: 'image', default: '' },
          { id: 'name',   label: 'Имя',          selector: '.review__name',   type: 'text',  default: 'Имя Фамилия' },
          { id: 'role',   label: 'Роль',         selector: '.review__role',   type: 'text',  default: 'Студент' },
        ],
      },
    },
  },
  {
    key: 'admission',
    title: 'Поступление',
    file: 'admission.html',
    tiles: [
      {
        id: 'stub-content', name: 'Основной контент страницы',
        fields: [
          { id: 'title',    label: 'Заголовок',    selector: '.section__title',    type: 'text', default: 'Поступление' },
          { id: 'subtitle', label: 'Подзаголовок', selector: '.section__subtitle', type: 'text', default: 'Страница находится в разработке' },
          { id: 'btn',      label: 'Кнопка',       selector: '.btn',               type: 'text', default: 'Назад на главную' },
        ],
      },
    ],
  },
  {
    key: 'grant',
    title: 'Грант РНФ',
    file: 'grant.html',
    tiles: [
      {
        id: 'grant-hero', name: 'Hero — заголовок страницы',
        fields: [
          { id: 'badge', label: 'Бейдж',         selector: '.grant-hero__badge', type: 'text',
            default: 'Научный грант · РНФ · 2024–2026' },
          { id: 'title', label: 'Заголовок',     selector: '.grant-hero__title', type: 'html',
            default: 'Генеративные <em>мультимодальные</em><br>модели нового поколения.' },
          { id: 'lead',  label: 'Вводный текст', selector: '.grant-hero__lead',  type: 'multiline',
            default: 'Факультет искусственного интеллекта РУДН получил финансирование Российского научного фонда на трёхлетнюю исследовательскую программу в области генеративных мультимодальных моделей. Проект реализуется научной группой под руководством проф. Захаровой М.Д.' },
          { id: 'meta-1-label', label: 'Метрика 1 · название', selector: '.grant-meta__item:nth-of-type(1) .grant-meta__label', type: 'text', default: 'Финансирование' },
          { id: 'meta-1-value', label: 'Метрика 1 · значение', selector: '.grant-meta__item:nth-of-type(1) .grant-meta__value', type: 'text', default: '12 млн ₽' },
          { id: 'meta-2-label', label: 'Метрика 2 · название', selector: '.grant-meta__item:nth-of-type(2) .grant-meta__label', type: 'text', default: 'Срок' },
          { id: 'meta-2-value', label: 'Метрика 2 · значение', selector: '.grant-meta__item:nth-of-type(2) .grant-meta__value', type: 'text', default: '2024 — 2026' },
          { id: 'meta-3-label', label: 'Метрика 3 · название', selector: '.grant-meta__item:nth-of-type(3) .grant-meta__label', type: 'text', default: 'Участники' },
          { id: 'meta-3-value', label: 'Метрика 3 · значение', selector: '.grant-meta__item:nth-of-type(3) .grant-meta__value', type: 'text', default: '8 человек' },
          { id: 'meta-4-label', label: 'Метрика 4 · название', selector: '.grant-meta__item:nth-of-type(4) .grant-meta__label', type: 'text', default: 'Фонд' },
          { id: 'meta-4-value', label: 'Метрика 4 · значение', selector: '.grant-meta__item:nth-of-type(4) .grant-meta__value', type: 'text', default: 'РНФ' },
        ],
      },
      {
        id: 'grant-goals-section', name: 'Секция «Цели проекта» — заголовок',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.grant-section__eyebrow', type: 'text', default: '01 — Цели проекта' },
          { id: 'title', label: 'Заголовок', selector: '.grant-section__title', type: 'text',
            default: 'Что мы исследуем.' },
          { id: 'intro', label: 'Введение',  selector: '.grant-section__intro', type: 'multiline',
            default: 'Проект направлен на создание нового класса генеративных моделей, способных работать одновременно с текстом, изображениями и звуком.' },
        ],
      },
      { id: 'grant-goal-1', name: 'Цель 1 · Унифицированная архитектура', fields: [
          { id: 'num',   label: 'Номер',     selector: '.goal-item__num',   type: 'text', default: '01' },
          { id: 'title', label: 'Заголовок', selector: '.goal-item__title', type: 'text',
            default: 'Унифицированная мультимодальная архитектура' },
          { id: 'text',  label: 'Описание',  selector: '.goal-item__text',  type: 'multiline',
            default: 'Разработка единой архитектуры трансформерного типа, обрабатывающей текст, изображения, аудио и структурированные данные в общем скрытом пространстве без модальностно-специфических энкодеров.' },
      ]},
      { id: 'grant-goal-2', name: 'Цель 2 · Обучение при ограниченных данных', fields: [
          { id: 'num',   label: 'Номер',     selector: '.goal-item__num',   type: 'text', default: '02' },
          { id: 'title', label: 'Заголовок', selector: '.goal-item__title', type: 'text',
            default: 'Эффективное обучение при ограниченных данных' },
          { id: 'text',  label: 'Описание',  selector: '.goal-item__text',  type: 'multiline',
            default: 'Разработка методов few-shot и zero-shot адаптации мультимодальных моделей для русскоязычного домена, где аннотированных данных значительно меньше, чем в английском.' },
      ]},
      { id: 'grant-goal-3', name: 'Цель 3 · Контролируемая генерация', fields: [
          { id: 'num',   label: 'Номер',     selector: '.goal-item__num',   type: 'text', default: '03' },
          { id: 'title', label: 'Заголовок', selector: '.goal-item__title', type: 'text',
            default: 'Контролируемая генерация и выравнивание' },
          { id: 'text',  label: 'Описание',  selector: '.goal-item__text',  type: 'multiline',
            default: 'Исследование методов RLHF и Constitutional AI для выравнивания генеративных моделей с предпочтениями пользователей, обеспечения фактической точности и снижения галлюцинаций.' },
      ]},
      { id: 'grant-goal-4', name: 'Цель 4 · Интерпретируемость', fields: [
          { id: 'num',   label: 'Номер',     selector: '.goal-item__num',   type: 'text', default: '04' },
          { id: 'title', label: 'Заголовок', selector: '.goal-item__title', type: 'text',
            default: 'Интерпретируемость и безопасность' },
          { id: 'text',  label: 'Описание',  selector: '.goal-item__text',  type: 'multiline',
            default: 'Разработка инструментов объяснения решений мультимодальных моделей и методов обнаружения нежелательных или вредоносных паттернов генерации на этапе инференса.' },
      ]},
      {
        id: 'grant-team-section', name: 'Секция «Команда» — заголовок',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.grant-section__eyebrow', type: 'text', default: '02 — Команда' },
          { id: 'title', label: 'Заголовок', selector: '.grant-section__title', type: 'text',
            default: 'Исследовательская группа.' },
          { id: 'intro', label: 'Введение',  selector: '.grant-section__intro', type: 'multiline',
            default: 'Восемь специалистов — преподаватели, аспиранты и студенты магистратуры — объединились для работы над проектом.' },
        ],
      },
      { id: 'grant-team-1', name: 'Команда 1 · Захарова', fields: [
          { id: 'photo',  label: 'Фотография',     selector: '.team-member__avatar', type: 'image', default: '' },
          { id: 'avatar', label: 'Инициалы',       selector: '.team-member__avatar', type: 'text', default: 'ЗМ' },
          { id: 'name',   label: 'ФИО',            selector: '.team-member__name',   type: 'text', default: 'Захарова Мария Дмитриевна' },
          { id: 'rank',   label: 'Учёная степень', selector: '.team-member__rank',   type: 'text', default: 'PhD, доцент' },
          { id: 'role',   label: 'Роль в проекте', selector: '.team-member__role',   type: 'text', default: 'Руководитель проекта · генеративные модели' },
      ]},
      { id: 'grant-team-2', name: 'Команда 2 · Козлов', fields: [
          { id: 'photo',  label: 'Фотография',     selector: '.team-member__avatar', type: 'image', default: '' },
          { id: 'avatar', label: 'Инициалы',       selector: '.team-member__avatar', type: 'text', default: 'КД' },
          { id: 'name',   label: 'ФИО',            selector: '.team-member__name',   type: 'text', default: 'Козлов Дмитрий Андреевич' },
          { id: 'rank',   label: 'Учёная степень', selector: '.team-member__rank',   type: 'text', default: 'PhD, доцент' },
          { id: 'role',   label: 'Роль в проекте', selector: '.team-member__role',   type: 'text', default: 'Со-руководитель · NLP, LLM' },
      ]},
      { id: 'grant-team-3', name: 'Команда 3 · Смирнова', fields: [
          { id: 'photo',  label: 'Фотография',     selector: '.team-member__avatar', type: 'image', default: '' },
          { id: 'avatar', label: 'Инициалы',       selector: '.team-member__avatar', type: 'text', default: 'СЕ' },
          { id: 'name',   label: 'ФИО',            selector: '.team-member__name',   type: 'text', default: 'Смирнова Елена Викторовна' },
          { id: 'rank',   label: 'Учёная степень', selector: '.team-member__rank',   type: 'text', default: 'к.ф.-м.н., доцент' },
          { id: 'role',   label: 'Роль в проекте', selector: '.team-member__role',   type: 'text', default: 'Ведущий исследователь · компьютерное зрение' },
      ]},
      { id: 'grant-team-4', name: 'Команда 4 · Алексеев', fields: [
          { id: 'photo',  label: 'Фотография',     selector: '.team-member__avatar', type: 'image', default: '' },
          { id: 'avatar', label: 'Инициалы',       selector: '.team-member__avatar', type: 'text', default: 'АР' },
          { id: 'name',   label: 'ФИО',            selector: '.team-member__name',   type: 'text', default: 'Алексеев Роман Игоревич' },
          { id: 'rank',   label: 'Учёная степень', selector: '.team-member__rank',   type: 'text', default: 'аспирант' },
          { id: 'role',   label: 'Роль в проекте', selector: '.team-member__role',   type: 'text', default: 'Разработка диффузионных архитектур' },
      ]},
      { id: 'grant-team-5', name: 'Команда 5 · Тихонова', fields: [
          { id: 'photo',  label: 'Фотография',     selector: '.team-member__avatar', type: 'image', default: '' },
          { id: 'avatar', label: 'Инициалы',       selector: '.team-member__avatar', type: 'text', default: 'ТА' },
          { id: 'name',   label: 'ФИО',            selector: '.team-member__name',   type: 'text', default: 'Тихонова Анна Сергеевна' },
          { id: 'rank',   label: 'Учёная степень', selector: '.team-member__rank',   type: 'text', default: 'аспирант' },
          { id: 'role',   label: 'Роль в проекте', selector: '.team-member__role',   type: 'text', default: 'Выравнивание моделей, RLHF' },
      ]},
      { id: 'grant-team-6', name: 'Команда 6 · Михайлов', fields: [
          { id: 'photo',  label: 'Фотография',     selector: '.team-member__avatar', type: 'image', default: '' },
          { id: 'avatar', label: 'Инициалы',       selector: '.team-member__avatar', type: 'text', default: 'МВ' },
          { id: 'name',   label: 'ФИО',            selector: '.team-member__name',   type: 'text', default: 'Михайлов Вадим Олегович' },
          { id: 'rank',   label: 'Учёная степень', selector: '.team-member__rank',   type: 'text', default: 'магистрант 2 курса' },
          { id: 'role',   label: 'Роль в проекте', selector: '.team-member__role',   type: 'text', default: 'Интерпретируемость · аудиомодальность' },
      ]},
      {
        id: 'grant-milestones-section', name: 'Секция «План» — заголовок',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.grant-section__eyebrow', type: 'text', default: '03 — План проекта' },
          { id: 'title', label: 'Заголовок', selector: '.grant-section__title', type: 'text',
            default: 'Этапы и ожидаемые результаты.' },
          { id: 'intro', label: 'Введение',  selector: '.grant-section__intro', type: 'multiline',
            default: 'Трёхлетняя программа разбита на последовательные этапы с публикацией промежуточных результатов на ведущих конференциях.' },
        ],
      },
      { id: 'grant-milestone-1', name: 'Этап 2024 · Базовая архитектура', fields: [
          { id: 'year',  label: 'Год',      selector: '.milestone__year',  type: 'text', default: '2024' },
          { id: 'title', label: 'Название', selector: '.milestone__title', type: 'text',
            default: 'Базовая архитектура и датасеты' },
          { id: 'desc',  label: 'Описание', selector: '.milestone__desc',  type: 'multiline',
            default: 'Проектирование унифицированной архитектуры, сбор и разметка русскоязычного мультимодального датасета объёмом 2 млн пар. Первая публикация на AIST 2024.' },
      ]},
      { id: 'grant-milestone-2', name: 'Этап 2025 · Предобучение', fields: [
          { id: 'year',  label: 'Год',      selector: '.milestone__year',  type: 'text', default: '2025' },
          { id: 'title', label: 'Название', selector: '.milestone__title', type: 'text',
            default: 'Предобучение и выравнивание' },
          { id: 'desc',  label: 'Описание', selector: '.milestone__desc',  type: 'multiline',
            default: 'Предобучение модели на кластере РУДН, fine-tuning с использованием RLHF. Публикации на NeurIPS 2025 и ACL 2025.' },
      ]},
      { id: 'grant-milestone-3', name: 'Этап 2026 · Открытый выпуск', fields: [
          { id: 'year',  label: 'Год',      selector: '.milestone__year',  type: 'text', default: '2026' },
          { id: 'title', label: 'Название', selector: '.milestone__title', type: 'text',
            default: 'Открытый выпуск и внедрение' },
          { id: 'desc',  label: 'Описание', selector: '.milestone__desc',  type: 'multiline',
            default: 'Публикация модели в открытом доступе под лицензией Apache 2.0. Демонстрация применения в медицинской диагностике. Итоговый отчёт в РНФ.' },
      ]},
      {
        id: 'grant-cta', name: 'CTA «Сотрудничество»',
        fields: [
          { id: 'eyebrow', label: 'Надзаголовок', selector: '.grant-cta__eyebrow', type: 'text', default: 'Сотрудничество' },
          { id: 'title', label: 'Заголовок', selector: '.grant-cta__title', type: 'text',
            default: 'Хотите участвовать в исследовании?' },
          { id: 'text',  label: 'Описание',  selector: '.grant-cta__text',  type: 'multiline',
            default: 'Мы приглашаем студентов магистратуры и аспирантов присоединиться к команде проекта. Также открыты к партнёрству с компаниями, заинтересованными в применении мультимодальных моделей.' },
          { id: 'btn',   label: 'Кнопка',    selector: '.btn--white',       type: 'text',
            default: 'Связаться с командой' },
        ],
      },
    ],
  },

  // ---- ОБЩИЕ ЭЛЕМЕНТЫ (на всех страницах) ----
  // Подвал сайта одинаков на каждой странице, поэтому он вынесен в отдельную
  // псевдостраницу с ключом `_shared`. Правки сохраняются под page_key
  // `_shared` и применяются скриптом сразу на всех страницах сайта.
  {
    key: '_shared',
    title: 'Шапка и подвал (общие)',
    file: 'index.html',
    tiles: [
      {
        id: 'site-header', name: 'Шапка — логотип, меню, соцсети',
        fields: [
          { id: 'logo-text',     label: 'Логотип — название', selector: '.header__logo-text',     type: 'text', default: 'Факультет ИИ' },
          { id: 'logo-subtitle', label: 'Логотип — подпись',  selector: '.header__logo-subtitle', type: 'text', default: 'РУДН' },
          { id: 'nav-1', label: 'Меню 1', selector: '.header__nav-list li:nth-of-type(1) .header__nav-link', type: 'text', default: 'О факультете' },
          { id: 'nav-2', label: 'Меню 2', selector: '.header__nav-list li:nth-of-type(2) .header__nav-link', type: 'text', default: 'Достижения' },
          { id: 'nav-3', label: 'Меню 3', selector: '.header__nav-list li:nth-of-type(3) .header__nav-link', type: 'text', default: 'Новости' },
          { id: 'nav-4', label: 'Меню 4', selector: '.header__nav-list li:nth-of-type(4) .header__nav-link', type: 'text', default: 'Отзывы' },
          { id: 'nav-5', label: 'Меню 5', selector: '.header__nav-list li:nth-of-type(5) .header__nav-link', type: 'text', default: 'Поступление' },
          { id: 'cta',   label: 'Кнопка «Задать вопрос»', selector: '.header__cta', type: 'text', default: 'Задать вопрос' },
          { id: 'tg-label', label: 'Telegram — подпись', selector: '.header__socials a:nth-of-type(1)', type: 'text', default: 'TG' },
          { id: 'tg-url',   label: 'Telegram — ссылка',  selector: '.header__socials a:nth-of-type(1)', type: 'link', default: '' },
          { id: 'vk-label', label: 'VK — подпись',       selector: '.header__socials a:nth-of-type(2)', type: 'text', default: 'VK' },
          { id: 'vk-url',   label: 'VK — ссылка',        selector: '.header__socials a:nth-of-type(2)', type: 'link', default: '' },
          { id: 'yt-label', label: 'YouTube — подпись',  selector: '.header__socials a:nth-of-type(3)', type: 'text', default: 'YT' },
          { id: 'yt-url',   label: 'YouTube — ссылка',   selector: '.header__socials a:nth-of-type(3)', type: 'link', default: '' },
        ],
      },
      {
        id: 'site-footer', name: 'Подвал — контакты и адрес',
        fields: [
          { id: 'brand',      label: 'Название',           selector: '.footer__brand .header__logo-text', type: 'text', default: 'Факультет ИИ' },
          { id: 'university', label: 'Описание',           selector: '.footer__university', type: 'multiline',
            default: 'Факультет искусственного интеллекта Российского университета дружбы народов' },
          { id: 'copy',       label: 'Копирайт',           selector: '.footer__copy', type: 'text', default: '© 2026 РУДН · Все права защищены' },
          { id: 'contact-heading', label: 'Заголовок «Приёмная комиссия»', selector: '.footer__col:nth-of-type(2) .footer__heading', type: 'text', default: 'Приёмная комиссия' },
          { id: 'phone',      label: 'Телефон',            selector: '.footer__col:nth-of-type(2) p:nth-of-type(1)', type: 'text', default: '+7 (495) 123-45-67' },
          { id: 'email',      label: 'E-mail',             selector: '.footer__col:nth-of-type(2) p:nth-of-type(2)', type: 'text', default: 'admission@ai-faculty.ru' },
          { id: 'hours',      label: 'Часы работы',        selector: '.footer__col:nth-of-type(2) p:nth-of-type(3)', type: 'text', default: 'Пн – Пт · 09:00 – 18:00' },
          { id: 'address-heading', label: 'Заголовок «Адрес»', selector: '.footer__col:nth-of-type(3) .footer__heading', type: 'text', default: 'Адрес' },
          { id: 'address-1',  label: 'Адрес, строка 1',    selector: '.footer__col:nth-of-type(3) p:nth-of-type(1)', type: 'text', default: 'Москва, ул. Примерная, 1' },
          { id: 'address-2',  label: 'Адрес, строка 2',    selector: '.footer__col:nth-of-type(3) p:nth-of-type(2)', type: 'text', default: 'Корпус «Нейрон», 3 этаж' },
        ],
      },
    ],
  },
];
