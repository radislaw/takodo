/* AddyDo — Фазы 1–3
   S10 auth · S8 pomodoro+lofi · PushBanner · Projects · ProjectDetail(AI)
   Exports: S10Auth, S8Focus, PushBanner, ProjectsScreen, ProjectDetail */
const Q = React.createElement;

/* ============================== S10 — ВХОД (Фаза 1) ============================== */
function S10Auth({ dark }) {
  return Q(Screen, { pad: 64 }, [
    Q('div', { key: 'mid', style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px' } }, [
      /* brand */
      Q('div', { key: 'brand', style: { textAlign: 'center', marginBottom: 38 } }, [
        Q('img', { key: 'logo', src: dark ? 'assets/logo-mark-light.svg' : 'assets/logo-mark.svg', width: 66, height: 66, style: { display: 'block', margin: '0 auto' } }),
        Q('div', { key: 'w', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--ink)', marginTop: 16, letterSpacing: '-0.02em' } }, ['Addy', Q('span', { key: 'd', style: { color: 'var(--sage-deep)' } }, 'Do')]),
        Q('div', { key: 't', style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)', marginTop: 6 } }, 'Спокойный список дел'),
      ]),
      /* email */
      Q('label', { key: 'lbl', className: 'ad-overline', style: { display: 'block', marginBottom: 9 } }, 'Почта'),
      Q('div', { key: 'inp', style: { background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 16 } }, [
        Q(Icon, { key: 'i', name: 'bell', size: 18, color: 'var(--ink-soft)' }),
        Q('span', { key: 't' }, 'anya@mail.ru'),
      ]),
      Q('div', { key: 'p', style: { marginTop: 13 } }, Q(PrimaryBtn, { icon: 'zap', label: 'Прислать ссылку для входа' })),
      Q('div', { key: 'hint', style: { textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 11, fontWeight: 600 } }, 'Без паролей — пришлём волшебную ссылку'),
      /* divider */
      Q('div', { key: 'div', style: { display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' } }, [
        Q('div', { key: 'l', style: { flex: 1, height: 1, background: 'var(--line)' } }),
        Q('span', { key: 'o', style: { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 } }, 'или'),
        Q('div', { key: 'r', style: { flex: 1, height: 1, background: 'var(--line)' } }),
      ]),
      Q('div', { key: 'g' }, Q(SecondaryBtn, { icon: Q(GoogleG, { key: 'g' }), label: 'Продолжить с Google' })),
    ]),
    Q('div', { key: 'foot', style: { padding: '0 34px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-faint)', lineHeight: 1.5, fontWeight: 600 } }, 'Входя, ты соглашаешься с условиями и политикой конфиденциальности.'),
  ]);
}
function GoogleG() {
  return Q('svg', { width: 20, height: 20, viewBox: '0 0 48 48' }, [
    Q('path', { key: 1, fill: '#EA4335', d: 'M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5z' }),
    Q('path', { key: 2, fill: '#4285F4', d: 'M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5C43.3 37.5 46.1 31.6 46.1 24.5z' }),
    Q('path', { key: 3, fill: '#FBBC05', d: 'M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.1z' }),
    Q('path', { key: 4, fill: '#34A853', d: 'M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.6 2.1-7.9 2.1-6.3 0-11.6-3.8-13.5-9.3l-7.9 6.1C6.5 42.6 14.6 48 24 48z' }),
  ]);
}

/* ============================== S8 — POMODORO + LO-FI (Фаза 2) ============================== */
function Ring({ pct }) {
  const r = 120, c = 2 * Math.PI * r;
  return Q('div', { style: { position: 'relative', width: 280, height: 280 } }, [
    Q('svg', { key: 's', width: 280, height: 280, viewBox: '0 0 280 280', style: { transform: 'rotate(-90deg)' } }, [
      Q('circle', { key: 'bg', cx: 140, cy: 140, r, fill: 'none', stroke: 'var(--sage-tint-2)', strokeWidth: 14 }),
      Q('circle', { key: 'fg', cx: 140, cy: 140, r, fill: 'none', stroke: 'var(--accent-fill)', strokeWidth: 14, strokeLinecap: 'round', strokeDasharray: c, strokeDashoffset: c * (1 - pct) }),
    ]),
    Q('div', { key: 'c', style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }, [
      Q('div', { key: 't', style: { fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 56, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 } }, '18:24'),
      Q('div', { key: 's', className: 'ad-overline', style: { marginTop: 8 } }, 'Фокус · помидор 2 из 4'),
    ]),
  ]);
}
function S8Focus() {
  return Q(Screen, { pad: 56 }, [
    Q('div', { key: 'top', style: { padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
      Q(RoundBtn, { key: 'b', icon: 'chevronL' }),
      Q(Pill, { key: 'p', tone: 'sage' }, [Q(Icon, { key: 'i', name: 'eye', size: 14 }), 'Сейчас только одно']),
    ]),
    Q('div', { key: 'task', style: { padding: '20px 30px 0', textAlign: 'center' } },
      Q('div', { className: 'ad-h2', style: { fontSize: 23, lineHeight: 1.25 } }, 'Заполнить таблицу за квартал')),
    Q('div', { key: 'ring', style: { display: 'flex', justifyContent: 'center', margin: '26px 0' } }, Q(Ring, { pct: 0.62 })),
    /* transport */
    Q('div', { key: 'ctrl', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 } }, [
      Q('button', { key: 'r', style: { width: 52, height: 52, borderRadius: 999, background: 'var(--card)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-soft)', boxShadow: 'var(--shadow-sm)' } }, Q(Icon, { name: 'moon', size: 22 })),
      Q('button', { key: 'p', style: { width: 72, height: 72, borderRadius: 999, background: 'var(--accent-fill)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 22px rgba(124,154,146,.45)' } },
        Q('div', { style: { display: 'flex', gap: 6 } }, [Q('span', { key: 1, style: { width: 7, height: 26, borderRadius: 3, background: '#fff' } }), Q('span', { key: 2, style: { width: 7, height: 26, borderRadius: 3, background: '#fff' } })])),
      Q('button', { key: 'c', style: { width: 52, height: 52, borderRadius: 999, background: 'var(--card)', border: '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--sage-deep)', boxShadow: 'var(--shadow-sm)' } }, Q(Icon, { name: 'check', size: 24, strokeWidth: 2.6 })),
    ]),
    Q('div', { key: 'sp', style: { flex: 1, minHeight: 16 } }),
    /* lo-fi player */
    Q('div', { key: 'lofi', style: { margin: '0 22px', background: 'var(--card)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-md)', padding: 16, display: 'flex', alignItems: 'center', gap: 14 } }, [
      Q('div', { key: 'art', style: { width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, var(--sage), var(--apricot))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, Q(Icon, { name: 'cloud', size: 24, color: '#fff' })),
      Q('div', { key: 'meta', style: { flex: 1, minWidth: 0 } }, [
        Q('div', { key: 'o', className: 'ad-overline', style: { color: 'var(--sage-deep)' } }, 'Lo-fi · фон'),
        Q('div', { key: 't', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginTop: 2 } }, 'Дождь за окном'),
        Q('div', { key: 'bar', style: { marginTop: 8, height: 5, borderRadius: 999, background: 'var(--sage-tint-2)', overflow: 'hidden' } }, Q('div', { style: { height: '100%', width: '45%', background: 'var(--sage)', borderRadius: 999 } })),
      ]),
      Q('button', { key: 'pp', style: { width: 42, height: 42, borderRadius: 999, background: 'var(--sage-tint)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } },
        Q('div', { style: { display: 'flex', gap: 4 } }, [Q('span', { key: 1, style: { width: 4, height: 15, borderRadius: 2, background: 'var(--sage-deep)' } }), Q('span', { key: 2, style: { width: 4, height: 15, borderRadius: 2, background: 'var(--sage-deep)' } })])),
    ]),
  ]);
}

/* ===== Push pre-permission popover (Фаза 2) — shown over dimmed home ===== */
function PushBanner() {
  return Q('div', { style: { position: 'relative', minHeight: '100%', background: 'var(--cream)' } }, [
    Q('div', { key: 'bg', style: { position: 'absolute', inset: 0, padding: '70px 22px', display: 'flex', flexDirection: 'column', gap: 12, filter: 'blur(2px)', opacity: .4 } },
      [0, 1, 2, 3].map(i => Q('div', { key: i, style: { height: 60, borderRadius: 'var(--r-lg)', background: 'var(--card)', boxShadow: 'var(--shadow-sm)' } }))),
    Q('div', { key: 'scrim', style: { position: 'absolute', inset: 0, background: 'rgba(44,58,51,.34)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' } }),
    Q('div', { key: 'wrap', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 26 } },
      Q('div', { style: { width: '100%', background: 'var(--card)', borderRadius: 28, boxShadow: 'var(--shadow-pop)', padding: '30px 24px 22px', textAlign: 'center' } }, [
        Q('div', { key: 'i', style: { width: 76, height: 76, borderRadius: 999, margin: '0 auto', background: 'var(--sage-tint)', color: 'var(--sage-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, Q(Icon, { name: 'bell', size: 36 })),
        Q('div', { key: 't', className: 'ad-h2', style: { fontSize: 22, marginTop: 20 } }, 'Мягкие напоминания?'),
        Q('div', { key: 's', style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.55 } }, 'AddyDo может тихо напомнить об одном деле. Без давления и без счётчиков — обещаем.'),
        Q('div', { key: 'act', style: { marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 } }, [
          Q(PrimaryBtn, { key: 'p', icon: 'bell', label: 'Разрешить напоминания' }),
          Q(GhostBtn, { key: 'g', label: 'Не сейчас' }),
        ]),
      ])),
  ]);
}

/* ============================== ПРОЕКТЫ (Фаза 3) ============================== */
function ProjCard({ icon, name, done, total, next, tone }) {
  const pct = Math.round(done / total * 100);
  return Q('div', { style: { background: 'var(--card)', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-md)', padding: 18 } }, [
    Q('div', { key: 'r', style: { display: 'flex', alignItems: 'center', gap: 13 } }, [
      Q('span', { key: 'i', style: { width: 46, height: 46, borderRadius: 14, background: tone[0], color: tone[1], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, Q(Icon, { name: icon, size: 23 })),
      Q('div', { key: 't', style: { flex: 1, minWidth: 0 } }, [
        Q('div', { key: 'n', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' } }, name),
        Q('div', { key: 's', style: { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 1, fontWeight: 600 } }, done + ' из ' + total + ' шагов'),
      ]),
      Q('span', { key: 'p', style: { fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 15, color: 'var(--sage-deep)' } }, pct + '%'),
    ]),
    Q('div', { key: 'bar', style: { marginTop: 14, height: 8, borderRadius: 999, background: 'var(--sage-tint-2)', overflow: 'hidden' } }, Q('div', { style: { height: '100%', width: pct + '%', background: 'var(--accent-fill)', borderRadius: 999 } })),
    Q('div', { key: 'next', style: { marginTop: 13, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600 } }, [
      Q(Icon, { key: 'i', name: 'play', size: 14, color: 'var(--sage-deep)' }),
      Q('span', { key: 't', style: { color: 'var(--ink)' } }, 'Дальше: ' + next),
    ]),
  ]);
}
function ProjectsScreen() {
  return Q(Screen, { pad: 64 }, [
    Q('div', { key: 'h', style: { padding: '0 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 } }, [
      Q('div', { key: 'l' }, [
        Q('div', { key: 't', className: 'ad-h1' }, 'Проекты'),
        Q('div', { key: 's', style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-soft)', marginTop: 4 } }, 'Большие дела, разбитые на шаги.'),
      ]),
    ]),
    Q('div', { key: 'list', style: { padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 13, flex: 1 } }, [
      Q(ProjCard, { key: 1, icon: 'layers', name: 'Переезд', done: 3, total: 8, next: 'Купить коробки', tone: ['var(--sage-tint)', 'var(--sage-deep)'] }),
      Q(ProjCard, { key: 2, icon: 'zap', name: 'Личный сайт', done: 2, total: 6, next: 'Выбрать домен', tone: ['var(--apricot-tint)', 'var(--apricot-deep)'] }),
      Q(ProjCard, { key: 3, icon: 'flower', name: 'Курс по Python', done: 5, total: 12, next: 'Урок 6 · функции', tone: ['var(--done-tint)', 'var(--done)'] }),
    ]),
    Q(FAB, { key: 'fab', onClick: () => {} }),
    Q(BottomNav, { key: 'nav', active: 'tasks', onNav: () => {} }),
  ]);
}

/* ===== Project detail with AI subtask suggestion ===== */
function AISuggestRow({ text, est }) {
  return Q('div', { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', borderRadius: 'var(--r-md)', marginBottom: 8 } }, [
    Q('div', { key: 't', style: { flex: 1, minWidth: 0 } }, [
      Q('div', { key: 'x', style: { fontFamily: 'var(--font-body)', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 } }, text),
      Q('div', { key: 'e', style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 3 } }, [Q(Icon, { key: 'i', name: 'clock', size: 12 }), est]),
    ]),
    Q('button', { key: 'add', style: { width: 32, height: 32, borderRadius: 999, background: 'var(--sage-tint)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: 'var(--sage-deep)' } }, Q(Icon, { name: 'plus', size: 18, strokeWidth: 2.5 })),
  ]);
}
function ProjectDetail() {
  return Q(Screen, { pad: 56 }, [
    Q('div', { key: 'top', style: { padding: '0 22px' } }, Q(BackBtn, {})),
    Q('div', { key: 'head', style: { padding: '18px 22px 0' } }, [
      Q(Pill, { key: 'p', tone: 'apricot' }, [Q(Icon, { key: 'i', name: 'zap', size: 14 }), 'Проект']),
      Q('div', { key: 't', className: 'ad-h1', style: { fontSize: 26, marginTop: 10 } }, 'Запустить личный сайт'),
      Q('div', { key: 'pb', style: { display: 'flex', alignItems: 'center', gap: 11, marginTop: 12 } }, [
        Q('div', { key: 'tr', style: { flex: 1, height: 8, borderRadius: 999, background: 'var(--sage-tint-2)', overflow: 'hidden' } }, Q('div', { style: { height: '100%', width: '33%', background: 'var(--accent-fill)', borderRadius: 999 } })),
        Q('span', { key: 'n', style: { fontFamily: 'var(--font-num)', fontSize: 12.5, fontWeight: 700, color: 'var(--sage-deep)' } }, '2 из 6'),
      ]),
    ]),
    /* existing steps */
    Q('div', { key: 'done', style: { padding: '20px 22px 0' } },
      ['Купить домен', 'Выбрать платформу'].map((t, i) => Q('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0' } }, [
        Q('span', { key: 'c', style: { width: 24, height: 24, borderRadius: 999, background: 'var(--accent-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, Q(Icon, { name: 'check', size: 14, color: '#fff', strokeWidth: 3 })),
        Q('span', { key: 't', style: { fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-faint)', textDecoration: 'line-through' } }, t),
      ]))),
    /* AI card */
    Q('div', { key: 'ai', style: { margin: '14px 22px 0', background: 'var(--sage-tint)', borderRadius: 'var(--r-xl)', padding: 18 } }, [
      Q('div', { key: 'h', style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 } }, [
        Q('span', { key: 'i', style: { width: 34, height: 34, borderRadius: 11, background: 'var(--sage)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } }, Q(Icon, { name: 'sparkles', size: 19 })),
        Q('div', { key: 't' }, [
          Q('div', { key: 'a', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--sage-deep)' } }, 'AddyDo предлагает шаги'),
          Q('div', { key: 'b', style: { fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--sage-deep)', opacity: .8, fontWeight: 600 } }, 'Можно принять всё или по одному'),
        ]),
      ]),
      Q('div', { key: 'list', style: { marginTop: 13 } }, [
        Q(AISuggestRow, { key: 1, text: 'Набросать 3 страницы на бумаге', est: '15 мин' }),
        Q(AISuggestRow, { key: 2, text: 'Собрать тексты «О себе»', est: '30 мин' }),
        Q(AISuggestRow, { key: 3, text: 'Выбрать шаблон оформления', est: '20 мин' }),
        Q(AISuggestRow, { key: 4, text: 'Опубликовать черновик', est: '10 мин' }),
      ]),
      Q('div', { key: 'btn', style: { marginTop: 6 } }, Q('button', { style: { width: '100%', background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 'var(--r-md)', padding: 13, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 } }, [Q(Icon, { key: 'i', name: 'plus', size: 18, color: '#fff', strokeWidth: 2.5 }), 'Добавить все шаги'])),
    ]),
    Q('div', { key: 'note', style: { padding: '13px 24px 0', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-faint)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600 } }, [
      Q(Icon, { key: 'i', name: 'heart', size: 14 }), 'Это лишь предложение. Меняй и удаляй свободно.',
    ]),
  ]);
}

Object.assign(window, { S10Auth, S8Focus, PushBanner, ProjectsScreen, ProjectDetail });
