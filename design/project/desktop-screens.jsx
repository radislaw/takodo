/* TooToo — Десктоп / веб-приложение · 1280 × 820
   DesktopFrame, DesktopSidebar
   DeskToday, DeskFocus, DeskProjects, DeskHistory
   Все экспортируются в window. */
const Dk = React.createElement

/* ── Хром браузера ──────────────────────────────────────── */
function DesktopFrame({ children }) {
  return Dk(
    'div',
    {
      style: {
        width: 1280,
        height: 820,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 44px 88px rgba(0,0,0,.20), 0 0 0 1px rgba(0,0,0,.08)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      },
    },
    [
      /* title bar */
      Dk(
        'div',
        {
          key: 'bar',
          style: {
            height: 40,
            background: '#E9E6E2',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            borderBottom: '1px solid rgba(0,0,0,.09)',
          },
        },
        [
          Dk('div', { key: 'dots', style: { display: 'flex', gap: 7, marginRight: 20 } }, [
            Dk('span', {
              key: 'r',
              style: { width: 12, height: 12, borderRadius: 999, background: '#FF5F57' },
            }),
            Dk('span', {
              key: 'y',
              style: { width: 12, height: 12, borderRadius: 999, background: '#FEBC2E' },
            }),
            Dk('span', {
              key: 'g',
              style: { width: 12, height: 12, borderRadius: 999, background: '#28C840' },
            }),
          ]),
          Dk(
            'div',
            { key: 'url-wrap', style: { flex: 1, display: 'flex', justifyContent: 'center' } },
            Dk(
              'div',
              {
                style: {
                  background: 'rgba(255,255,255,.78)',
                  borderRadius: 7,
                  padding: '4px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: 260,
                  fontSize: 12.5,
                  color: 'var(--ink-soft)',
                  border: '1px solid rgba(0,0,0,.07)',
                },
              },
              [
                Dk(
                  'svg',
                  { key: 'lock', width: 11, height: 13, viewBox: '0 0 11 13', fill: 'none' },
                  [
                    Dk('rect', {
                      key: 'r',
                      x: 0.5,
                      y: 5.5,
                      width: 10,
                      height: 7,
                      rx: 2,
                      fill: 'var(--sage)',
                    }),
                    Dk('path', {
                      key: 'p',
                      d: 'M3 5.5V3.5a2.5 2.5 0 0 1 5 0v2',
                      stroke: 'var(--sage)',
                      strokeWidth: 1.4,
                      strokeLinecap: 'round',
                      fill: 'none',
                    }),
                  ],
                ),
                'app.tootoo.ru',
              ],
            ),
          ),
        ],
      ),
      /* app container */
      Dk(
        'div',
        { key: 'app', style: { flex: 1, overflow: 'hidden', background: 'var(--cream)' } },
        children,
      ),
    ],
  )
}

/* ── Боковое меню ────────────────────────────────────────── */
function DesktopSidebar({ active }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Сегодня' },
    { id: 'tasks', icon: 'list', label: 'Задачи' },
    { id: 'projects', icon: 'layers', label: 'Проекты' },
    { id: 'rewards', icon: 'award', label: 'Награды' },
    { id: 'me', icon: 'sun', label: 'Я' },
  ]
  return Dk(
    'div',
    {
      style: {
        width: 220,
        flexShrink: 0,
        height: '100%',
        background: 'var(--card)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px 16px',
        boxSizing: 'border-box',
      },
    },
    [
      Dk(
        'div',
        {
          key: 'logo',
          style: { padding: '0 10px 24px', display: 'flex', alignItems: 'center', gap: 9 },
        },
        [
          Dk('img', { key: 'i', src: 'assets/logo-mark.svg', width: 26, height: 26 }),
          Dk(
            'span',
            {
              key: 'w',
              style: {
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 17,
                color: 'var(--ink)',
              },
            },
            ['Too', Dk('span', { key: 'd', style: { color: 'var(--sage-deep)' } }, 'Too')],
          ),
        ],
      ),
      ...items.map((item) =>
        Dk(
          'button',
          {
            key: item.id,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 11,
              marginBottom: 2,
              background: active === item.id ? 'var(--sage-tint)' : 'transparent',
              color: active === item.id ? 'var(--sage-deep)' : 'var(--ink-soft)',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontFamily: 'var(--font-body)',
              fontWeight: active === item.id ? 700 : 600,
              fontSize: 14,
              textAlign: 'left',
              boxSizing: 'border-box',
            },
          },
          [
            Dk(Icon, {
              key: 'ic',
              name: item.icon,
              size: 17,
              strokeWidth: active === item.id ? 2.4 : 2,
            }),
            item.label,
          ],
        ),
      ),
      Dk('div', { key: 'sp', style: { flex: 1 } }),
      Dk('div', { key: 'streak', style: { padding: '0 4px 10px' } }, Dk(StreakBadge, { days: 6 })),
      Dk(
        'button',
        {
          key: 'settings',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '9px 12px',
            borderRadius: 11,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-faint)',
            fontFamily: 'var(--font-body)',
            fontSize: 13.5,
            fontWeight: 600,
            width: '100%',
          },
        },
        [Dk(Icon, { key: 'i', name: 'settings', size: 16 }), 'Настройки'],
      ),
    ],
  )
}

/* ── D1 · Сегодня ──────────────────────────────────────── */
function DeskToday() {
  const tasks = [
    {
      id: 1,
      title: 'Записаться к стоматологу',
      catLabel: 'Здоровье',
      catColor: 'var(--cat-blue)',
      time: '10 мин',
    },
    {
      id: 2,
      title: 'Ответить Лене про дачу',
      catLabel: 'Себе',
      catColor: 'var(--cat-mauve)',
      time: '5 мин',
    },
    {
      id: 3,
      title: 'Организовать переезд',
      catLabel: 'Дом',
      catColor: 'var(--cat-sage)',
      steps: { done: 3, total: 8 },
    },
    {
      id: 4,
      title: 'Оплатить интернет',
      catLabel: 'Дом',
      catColor: 'var(--cat-sage)',
      time: '3 мин',
      done: true,
    },
  ]
  return Dk('div', { style: { display: 'flex', width: '100%', height: '100%' } }, [
    Dk(DesktopSidebar, { key: 'nav', active: 'home' }),
    Dk('div', { key: 'main', style: { flex: 1, overflowY: 'auto', padding: '30px 36px' } }, [
      /* header */
      Dk(
        'div',
        {
          key: 'head',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 26,
          },
        },
        [
          Dk('div', { key: 'l' }, [
            Dk(
              'div',
              { key: 'g', className: 'ad-h1', style: { fontSize: 28 } },
              'Доброе утро, Аня',
            ),
            Dk(
              'div',
              {
                key: 's',
                style: {
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  color: 'var(--ink-soft)',
                  marginTop: 5,
                },
              },
              'Спокойно. Шаг за шагом.',
            ),
          ]),
          Dk(ProgressRing, { key: 'ring', done: 1, total: 4 }),
        ],
      ),
      /* 2-col */
      Dk(
        'div',
        { key: 'cols', style: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22 } },
        [
          /* левая: brain dump + задачи */
          Dk('div', { key: 'left' }, [
            Dk(
              'div',
              {
                key: 'dump',
                style: {
                  background: 'linear-gradient(180deg,var(--card),#FBFAF8)',
                  borderRadius: 'var(--r-xl)',
                  boxShadow: 'var(--shadow-md)',
                  padding: 18,
                  marginBottom: 18,
                },
              },
              [
                Dk(
                  'div',
                  {
                    key: 'top',
                    style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 },
                  },
                  [
                    Dk(
                      'span',
                      {
                        key: 'i',
                        style: {
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: 'var(--sage-tint)',
                          color: 'var(--sage-deep)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      },
                      Dk(Icon, { name: 'zap', size: 17 }),
                    ),
                    Dk(
                      'div',
                      { key: 'o', className: 'ad-overline', style: { color: 'var(--sage-deep)' } },
                      'Быстрая выгрузка',
                    ),
                  ],
                ),
                Dk(
                  'div',
                  {
                    key: 'inp',
                    style: {
                      background: 'var(--cream)',
                      border: '1.5px solid var(--line)',
                      borderRadius: 'var(--r-sm)',
                      padding: '11px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: 'var(--ink-faint)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14.5,
                    },
                  },
                  [
                    Dk(Icon, { key: 'p', name: 'plus', size: 17, color: 'var(--ink-soft)' }),
                    'Выгрузи, что крутится в голове…',
                  ],
                ),
              ],
            ),
            Dk(
              'div',
              { key: 'lbl', className: 'ad-overline', style: { marginBottom: 12 } },
              'На сегодня · 4 дела',
            ),
            Dk(
              'div',
              { key: 'list', style: { display: 'flex', flexDirection: 'column', gap: 10 } },
              tasks.map((t) => Dk(TaskRow, { key: t.id, task: t, onToggle: () => {} })),
            ),
          ]),
          /* правая: фокус + категории + заметка */
          Dk(
            'div',
            { key: 'right', style: { display: 'flex', flexDirection: 'column', gap: 16 } },
            [
              Dk(
                'div',
                {
                  key: 'one',
                  style: {
                    background: 'var(--card)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-md)',
                    padding: 20,
                  },
                },
                [
                  Dk(
                    'div',
                    {
                      key: 'lbl',
                      className: 'ad-overline',
                      style: { color: 'var(--sage-deep)', marginBottom: 10 },
                    },
                    'Сейчас одно',
                  ),
                  Dk(
                    'div',
                    {
                      key: 't',
                      style: {
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 16,
                        color: 'var(--ink)',
                        lineHeight: 1.35,
                        marginBottom: 16,
                      },
                    },
                    'Записаться к стоматологу',
                  ),
                  Dk(
                    'button',
                    {
                      key: 'btn',
                      style: {
                        width: '100%',
                        background: 'var(--accent-fill)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--r-md)',
                        padding: '12px 0',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: 14.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 6px 18px rgba(124,154,146,.38)',
                      },
                    },
                    [Dk(Icon, { key: 'i', name: 'play', size: 16, color: '#fff' }), 'Начать фокус'],
                  ),
                ],
              ),
              Dk(
                'div',
                {
                  key: 'cats',
                  style: {
                    background: 'var(--card)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 18,
                  },
                },
                [
                  Dk(
                    'div',
                    { key: 'lbl', className: 'ad-overline', style: { marginBottom: 13 } },
                    'Категории',
                  ),
                  Dk(
                    'div',
                    { key: 'list', style: { display: 'flex', flexDirection: 'column', gap: 10 } },
                    [
                      ['Здоровье', 'var(--cat-blue)', '1 дело'],
                      ['Дом', 'var(--cat-sage)', '2 дела'],
                      ['Себе', 'var(--cat-mauve)', '1 дело'],
                    ].map(([label, color, count]) =>
                      Dk(
                        'div',
                        { key: label, style: { display: 'flex', alignItems: 'center', gap: 9 } },
                        [
                          Dk('span', {
                            key: 'd',
                            style: { width: 9, height: 9, borderRadius: 999, background: color },
                          }),
                          Dk(
                            'span',
                            {
                              key: 'l',
                              style: {
                                flex: 1,
                                fontFamily: 'var(--font-body)',
                                fontSize: 13.5,
                                color: 'var(--ink)',
                                fontWeight: 600,
                              },
                            },
                            label,
                          ),
                          Dk(
                            'span',
                            {
                              key: 'n',
                              style: { fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 },
                            },
                            count,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              Dk(
                SoftNote,
                { key: 'note', tone: 'sage', icon: 'heart' },
                'Не спеши. Одно дело — уже хорошо.',
              ),
            ],
          ),
        ],
      ),
    ]),
  ])
}

/* ── D2 · Фокус-режим ─────────────────────────────────── */
function DeskFocus() {
  const r = 130,
    c = 2 * Math.PI * r
  return Dk('div', { style: { display: 'flex', width: '100%', height: '100%' } }, [
    Dk(DesktopSidebar, { key: 'nav', active: 'home' }),
    Dk(
      'div',
      {
        key: 'main',
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 40px',
          gap: 26,
        },
      },
      [
        Dk(
          'div',
          {
            key: 'task',
            style: {
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            },
          },
          [
            Dk(Pill, { key: 'p', tone: 'sage' }, [
              Dk(Icon, { key: 'i', name: 'eye', size: 14 }),
              'Сейчас только одно',
            ]),
            Dk(
              'div',
              {
                key: 't',
                className: 'ad-h2',
                style: { fontSize: 24, lineHeight: 1.25, maxWidth: 480 },
              },
              'Заполнить таблицу за квартал',
            ),
          ],
        ),
        /* кольцо + таймер */
        Dk('div', { key: 'ring-wrap', style: { position: 'relative', width: 300, height: 300 } }, [
          Dk(
            'svg',
            {
              key: 'svg',
              width: 300,
              height: 300,
              viewBox: '0 0 300 300',
              style: { transform: 'rotate(-90deg)', display: 'block' },
            },
            [
              Dk('circle', {
                key: 'bg',
                cx: 150,
                cy: 150,
                r,
                fill: 'none',
                stroke: 'var(--sage-tint-2)',
                strokeWidth: 14,
              }),
              Dk('circle', {
                key: 'fg',
                cx: 150,
                cy: 150,
                r,
                fill: 'none',
                stroke: 'var(--accent-fill)',
                strokeWidth: 14,
                strokeLinecap: 'round',
                strokeDasharray: c,
                strokeDashoffset: c * 0.38,
              }),
            ],
          ),
          Dk(
            'div',
            {
              key: 'time',
              style: {
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
            [
              Dk(
                'div',
                {
                  key: 't',
                  style: {
                    fontFamily: 'var(--font-num)',
                    fontWeight: 800,
                    fontSize: 64,
                    color: 'var(--ink)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  },
                },
                '18:24',
              ),
              Dk(
                'div',
                { key: 's', className: 'ad-overline', style: { marginTop: 8 } },
                'Фокус · помидор 2 из 4',
              ),
            ],
          ),
        ]),
        /* управление */
        Dk('div', { key: 'ctrl', style: { display: 'flex', alignItems: 'center', gap: 20 } }, [
          Dk(
            'button',
            {
              key: 'snz',
              style: {
                width: 54,
                height: 54,
                borderRadius: 999,
                background: 'var(--card)',
                border: '1.5px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--ink-soft)',
                boxShadow: 'var(--shadow-sm)',
              },
            },
            Dk(Icon, { name: 'moon', size: 22 }),
          ),
          Dk(
            'button',
            {
              key: 'pp',
              style: {
                width: 74,
                height: 74,
                borderRadius: 999,
                background: 'var(--accent-fill)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 22px rgba(124,154,146,.48)',
              },
            },
            Dk('div', { style: { display: 'flex', gap: 6 } }, [
              Dk('span', {
                key: 1,
                style: { width: 7, height: 26, borderRadius: 3, background: '#fff' },
              }),
              Dk('span', {
                key: 2,
                style: { width: 7, height: 26, borderRadius: 3, background: '#fff' },
              }),
            ]),
          ),
          Dk(
            'button',
            {
              key: 'done',
              style: {
                width: 54,
                height: 54,
                borderRadius: 999,
                background: 'var(--card)',
                border: '1.5px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--sage-deep)',
                boxShadow: 'var(--shadow-sm)',
              },
            },
            Dk(Icon, { name: 'check', size: 24, strokeWidth: 2.6 }),
          ),
        ]),
        /* lo-fi */
        Dk(
          'div',
          {
            key: 'lofi',
            style: {
              background: 'var(--card)',
              borderRadius: 'var(--r-xl)',
              boxShadow: 'var(--shadow-md)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: 400,
            },
          },
          [
            Dk(
              'div',
              {
                key: 'art',
                style: {
                  width: 48,
                  height: 48,
                  borderRadius: 13,
                  background: 'linear-gradient(135deg,var(--sage),var(--apricot))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                },
              },
              Dk(Icon, { name: 'cloud', size: 24, color: '#fff' }),
            ),
            Dk('div', { key: 'meta', style: { flex: 1 } }, [
              Dk(
                'div',
                { key: 'o', className: 'ad-overline', style: { color: 'var(--sage-deep)' } },
                'Lo-fi · фон',
              ),
              Dk(
                'div',
                {
                  key: 't',
                  style: {
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 14.5,
                    color: 'var(--ink)',
                    marginTop: 2,
                  },
                },
                'Дождь за окном',
              ),
              Dk(
                'div',
                {
                  key: 'bar',
                  style: {
                    marginTop: 7,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--sage-tint-2)',
                    overflow: 'hidden',
                  },
                },
                Dk('div', {
                  style: {
                    height: '100%',
                    width: '45%',
                    background: 'var(--sage)',
                    borderRadius: 999,
                  },
                }),
              ),
            ]),
            Dk(
              'button',
              {
                key: 'pause',
                style: {
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  background: 'var(--sage-tint)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                },
              },
              Dk('div', { style: { display: 'flex', gap: 4 } }, [
                Dk('span', {
                  key: 1,
                  style: { width: 4, height: 14, borderRadius: 2, background: 'var(--sage-deep)' },
                }),
                Dk('span', {
                  key: 2,
                  style: { width: 4, height: 14, borderRadius: 2, background: 'var(--sage-deep)' },
                }),
              ]),
            ),
          ],
        ),
      ],
    ),
  ])
}

/* ── D3 · Проекты + AI ────────────────────────────────── */
function DeskProjects() {
  const projects = [
    {
      icon: 'layers',
      name: 'Переезд',
      done: 3,
      total: 8,
      next: 'Купить коробки',
      tone: ['var(--sage-tint)', 'var(--sage-deep)'],
      sel: true,
    },
    {
      icon: 'zap',
      name: 'Личный сайт',
      done: 2,
      total: 6,
      next: 'Выбрать домен',
      tone: ['var(--apricot-tint)', 'var(--apricot-deep)'],
    },
    {
      icon: 'flower',
      name: 'Курс по Python',
      done: 5,
      total: 12,
      next: 'Урок 6 · функции',
      tone: ['var(--done-tint)', 'var(--done)'],
    },
  ]
  const steps = [
    ['Собрать документы', true, 'done'],
    ['Найти паспорт и СНИЛС', true, 'done'],
    ['Сделать копии', true, 'done'],
    ['Упаковать кухню', false, 'now'],
    ['Купить 10 коробок', false, 'now'],
    ['Завернуть посуду', false, 'todo'],
    ['Заказать машину', false, 'todo'],
    ['Сдать ключи', false, 'todo'],
  ]
  return Dk('div', { style: { display: 'flex', width: '100%', height: '100%' } }, [
    Dk(DesktopSidebar, { key: 'nav', active: 'projects' }),
    /* список проектов */
    Dk(
      'div',
      {
        key: 'list',
        style: {
          width: 290,
          borderRight: '1px solid var(--line)',
          overflowY: 'auto',
          padding: '24px 16px',
          flexShrink: 0,
        },
      },
      [
        Dk(
          'div',
          { key: 'h', className: 'ad-h1', style: { fontSize: 21, marginBottom: 4 } },
          'Проекты',
        ),
        Dk(
          'div',
          {
            key: 's',
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: 13.5,
              color: 'var(--ink-soft)',
              marginBottom: 16,
            },
          },
          'Большие дела, разбитые на шаги.',
        ),
        Dk('div', { key: 'cards', style: { display: 'flex', flexDirection: 'column', gap: 10 } }, [
          ...projects.map((p, i) =>
            Dk(
              'div',
              {
                key: i,
                style: {
                  background: p.sel ? 'var(--sage-tint)' : 'var(--card)',
                  border: p.sel ? '1.5px solid var(--sage)' : '1.5px solid var(--line)',
                  borderRadius: 'var(--r-lg)',
                  padding: 13,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                },
              },
              [
                Dk('div', { key: 'r', style: { display: 'flex', alignItems: 'center', gap: 10 } }, [
                  Dk(
                    'span',
                    {
                      key: 'i',
                      style: {
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: p.tone[0],
                        color: p.tone[1],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      },
                    },
                    Dk(Icon, { name: p.icon, size: 18 }),
                  ),
                  Dk('div', { key: 't', style: { flex: 1, minWidth: 0 } }, [
                    Dk(
                      'div',
                      {
                        key: 'n',
                        style: {
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: 14.5,
                          color: 'var(--ink)',
                        },
                      },
                      p.name,
                    ),
                    Dk(
                      'div',
                      {
                        key: 's',
                        style: { fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 },
                      },
                      p.done + ' из ' + p.total,
                    ),
                  ]),
                  Dk(
                    'span',
                    {
                      key: 'pct',
                      style: {
                        fontFamily: 'var(--font-num)',
                        fontWeight: 800,
                        fontSize: 13,
                        color: 'var(--sage-deep)',
                      },
                    },
                    Math.round((p.done / p.total) * 100) + '%',
                  ),
                ]),
                Dk(
                  'div',
                  {
                    key: 'bar',
                    style: {
                      marginTop: 9,
                      height: 5,
                      borderRadius: 999,
                      background: 'var(--sage-tint-2)',
                      overflow: 'hidden',
                    },
                  },
                  Dk('div', {
                    style: {
                      height: '100%',
                      width: Math.round((p.done / p.total) * 100) + '%',
                      background: 'var(--accent-fill)',
                      borderRadius: 999,
                    },
                  }),
                ),
              ],
            ),
          ),
          Dk(
            'button',
            {
              key: 'new',
              style: {
                width: '100%',
                background: 'var(--card)',
                border: '1.5px dashed var(--line-strong)',
                borderRadius: 'var(--r-lg)',
                padding: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                color: 'var(--ink-soft)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 13.5,
                fontWeight: 600,
              },
            },
            [Dk(Icon, { key: 'i', name: 'plus', size: 15 }), 'Новый проект'],
          ),
        ]),
      ],
    ),
    /* детальный вид */
    Dk('div', { key: 'detail', style: { flex: 1, overflowY: 'auto', padding: '24px 28px' } }, [
      Dk(
        'div',
        {
          key: 'head',
          style: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 },
        },
        [
          Dk(
            'span',
            {
              key: 'i',
              style: {
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'var(--sage-tint)',
                color: 'var(--sage-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              },
            },
            Dk(Icon, { name: 'layers', size: 22 }),
          ),
          Dk('div', { key: 't' }, [
            Dk(Pill, { key: 'p', tone: 'sage' }, [
              Dk(Icon, { key: 'i', name: 'layers', size: 13 }),
              'Разбито на шаги',
            ]),
            Dk(
              'div',
              { key: 'h', className: 'ad-h1', style: { fontSize: 23, margin: '8px 0 10px' } },
              'Организовать переезд',
            ),
            Dk('div', { key: 'pb', style: { display: 'flex', alignItems: 'center', gap: 12 } }, [
              Dk(
                'div',
                {
                  key: 'tr',
                  style: {
                    width: 220,
                    height: 7,
                    borderRadius: 999,
                    background: 'var(--sage-tint-2)',
                    overflow: 'hidden',
                  },
                },
                Dk('div', {
                  style: {
                    height: '100%',
                    width: '37%',
                    background: 'var(--accent-fill)',
                    borderRadius: 999,
                  },
                }),
              ),
              Dk(
                'span',
                {
                  key: 'n',
                  style: {
                    fontFamily: 'var(--font-num)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: 'var(--sage-deep)',
                  },
                },
                '3 из 8',
              ),
            ]),
          ]),
        ],
      ),
      /* шаги — 2 колонки */
      Dk(
        'div',
        {
          key: 'steps',
          style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 },
        },
        steps.map(([text, done, state], i) =>
          Dk(
            'div',
            {
              key: i,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 13px',
                background: state === 'now' ? 'var(--sage-tint)' : 'var(--card)',
                borderRadius: 'var(--r-md)',
                boxShadow: 'var(--shadow-sm)',
                border: state === 'now' ? '1.5px solid var(--sage)' : '1.5px solid transparent',
              },
            },
            [
              done
                ? Dk(
                    'span',
                    {
                      key: 'c',
                      style: {
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'var(--accent-fill)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      },
                    },
                    Dk(Icon, { name: 'check', size: 12, color: '#fff', strokeWidth: 3 }),
                  )
                : Dk('span', {
                    key: 'c',
                    style: {
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      flexShrink: 0,
                      border:
                        state === 'now' ? '2px solid var(--sage)' : '2px solid var(--line-strong)',
                      background: 'transparent',
                    },
                  }),
              Dk(
                'span',
                {
                  key: 't',
                  style: {
                    flex: 1,
                    fontFamily: 'var(--font-body)',
                    fontSize: 13.5,
                    fontWeight: state === 'now' ? 700 : 600,
                    color: done ? 'var(--ink-faint)' : 'var(--ink)',
                    textDecoration: done ? 'line-through' : 'none',
                  },
                },
                text,
              ),
              state === 'now' &&
                Dk(
                  'span',
                  {
                    key: 'l',
                    style: {
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--sage-deep)',
                      fontFamily: 'var(--font-body)',
                    },
                  },
                  'сейчас',
                ),
            ],
          ),
        ),
      ),
      /* AI-предложения */
      Dk(
        'div',
        {
          key: 'ai',
          style: { background: 'var(--sage-tint)', borderRadius: 'var(--r-xl)', padding: 18 },
        },
        [
          Dk(
            'div',
            {
              key: 'h',
              style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
            },
            [
              Dk(
                'span',
                {
                  key: 'i',
                  style: {
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'var(--sage)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
                Dk(Icon, { name: 'sparkles', size: 16 }),
              ),
              Dk('div', { key: 't' }, [
                Dk(
                  'div',
                  {
                    key: 'a',
                    style: {
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 14.5,
                      color: 'var(--sage-deep)',
                    },
                  },
                  'TooToo предлагает шаги',
                ),
                Dk(
                  'div',
                  {
                    key: 'b',
                    style: {
                      fontSize: 12,
                      color: 'var(--sage-deep)',
                      opacity: 0.8,
                      fontWeight: 600,
                    },
                  },
                  'Добавь всё или по одному',
                ),
              ]),
            ],
          ),
          Dk(
            'div',
            { key: 'list', style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } },
            [
              ['Сделать опись вещей', '15 мин'],
              ['Позвонить в компанию', '10 мин'],
              ['Упаковать спальню', '45 мин'],
              ['Собрать первую коробку', '20 мин'],
            ].map(([text, est], i) =>
              Dk(
                'div',
                {
                  key: i,
                  style: {
                    background: 'var(--card)',
                    borderRadius: 'var(--r-md)',
                    padding: '11px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                  },
                },
                [
                  Dk('div', { key: 't', style: { flex: 1 } }, [
                    Dk(
                      'div',
                      {
                        key: 'x',
                        style: {
                          fontFamily: 'var(--font-body)',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--ink)',
                        },
                      },
                      text,
                    ),
                    Dk(
                      'div',
                      {
                        key: 'e',
                        style: {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          color: 'var(--ink-soft)',
                          marginTop: 2,
                        },
                      },
                      [Dk(Icon, { key: 'i', name: 'clock', size: 11 }), est],
                    ),
                  ]),
                  Dk(
                    'button',
                    {
                      key: 'add',
                      style: {
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        background: 'var(--sage-tint)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--sage-deep)',
                      },
                    },
                    Dk(Icon, { name: 'plus', size: 14, strokeWidth: 2.5 }),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ]),
  ])
}

/* ── D4 · История ────────────────────────────────────── */
function DeskHistory() {
  const days = [
    {
      label: 'Сегодня',
      done: 3,
      items: ['Налить себе воды', 'Ответить на письмо', 'Прогулка 10 минут'],
      moved: 2,
    },
    {
      label: 'Вчера',
      done: 4,
      items: ['Купить продукты', 'Помыть посуду', 'Позвонить маме', 'Зарядка'],
      moved: 1,
    },
    { label: 'Понедельник', done: 2, items: ['Оплатить счета', 'Разобрать стол'], moved: 0 },
  ]
  return Dk('div', { style: { display: 'flex', width: '100%', height: '100%' } }, [
    Dk(DesktopSidebar, { key: 'nav', active: 'rewards' }),
    Dk('div', { key: 'main', style: { flex: 1, overflowY: 'auto', padding: '28px 34px' } }, [
      Dk('div', { key: 'head', style: { marginBottom: 24 } }, [
        Dk('div', { key: 't', className: 'ad-h1', style: { fontSize: 28 } }, 'История'),
        Dk(
          'div',
          {
            key: 's',
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--ink-soft)',
              marginTop: 5,
            },
          },
          'Только то, что было сделано. Без счётов и долгов.',
        ),
      ]),
      Dk(
        'div',
        { key: 'cols', style: { display: 'grid', gridTemplateColumns: '1fr 260px', gap: 22 } },
        [
          /* дни */
          Dk(
            'div',
            { key: 'days', style: { display: 'flex', flexDirection: 'column', gap: 14 } },
            days.map((day) =>
              Dk(
                'div',
                {
                  key: day.label,
                  style: {
                    background: 'var(--card)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  },
                },
                [
                  Dk(
                    'div',
                    {
                      key: 'h',
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderBottom: '1px solid var(--line-card)',
                      },
                    },
                    [
                      Dk(
                        'span',
                        {
                          key: 't',
                          style: {
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            fontSize: 15.5,
                            color: 'var(--ink)',
                          },
                        },
                        day.label,
                      ),
                      Dk(
                        'span',
                        {
                          key: 'd',
                          style: {
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--sage-deep)',
                            background: 'var(--sage-tint)',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontFamily: 'var(--font-body)',
                          },
                        },
                        day.done + ' сделано',
                      ),
                    ],
                  ),
                  Dk('div', { key: 'items', style: { padding: '4px 0' } }, [
                    ...day.items.map((it, i) =>
                      Dk(
                        'div',
                        {
                          key: i,
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 18px',
                          },
                        },
                        [
                          Dk(
                            'span',
                            {
                              key: 'c',
                              style: {
                                width: 21,
                                height: 21,
                                borderRadius: 999,
                                background: 'var(--done)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              },
                            },
                            Dk(Icon, { name: 'check', size: 12, color: '#fff', strokeWidth: 3 }),
                          ),
                          Dk(
                            'span',
                            {
                              key: 't',
                              style: {
                                fontFamily: 'var(--font-body)',
                                fontSize: 14,
                                color: 'var(--ink-soft)',
                                textDecoration: 'line-through',
                              },
                            },
                            it,
                          ),
                        ],
                      ),
                    ),
                    day.moved > 0 &&
                      Dk(
                        'div',
                        {
                          key: 'mv',
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 18px',
                          },
                        },
                        [
                          Dk(
                            'span',
                            {
                              key: 'c',
                              style: {
                                width: 21,
                                height: 21,
                                borderRadius: 999,
                                background: 'var(--cream-deep)',
                                color: 'var(--ink-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                            },
                            Dk(Icon, { name: 'moon', size: 12 }),
                          ),
                          Dk(
                            'span',
                            {
                              key: 't',
                              style: {
                                fontSize: 13,
                                color: 'var(--ink-faint)',
                                fontWeight: 600,
                                fontFamily: 'var(--font-body)',
                              },
                            },
                            day.moved + ' перенесено на потом',
                          ),
                        ],
                      ),
                  ]),
                ],
              ),
            ),
          ),
          /* серия + статистика */
          Dk(
            'div',
            { key: 'right', style: { display: 'flex', flexDirection: 'column', gap: 14 } },
            [
              Dk(
                'div',
                {
                  key: 'streak',
                  style: {
                    background: 'var(--apricot-tint)',
                    borderRadius: 'var(--r-xl)',
                    padding: 18,
                  },
                },
                [
                  Dk(
                    'div',
                    {
                      key: 'r',
                      style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
                    },
                    [
                      Dk(
                        'div',
                        {
                          key: 'i',
                          style: {
                            width: 42,
                            height: 42,
                            borderRadius: 999,
                            background: 'var(--apricot)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(224,168,126,.45)',
                          },
                        },
                        Dk(Icon, { name: 'flame', size: 22, color: '#fff' }),
                      ),
                      Dk('div', { key: 't' }, [
                        Dk(
                          'div',
                          {
                            key: 'n',
                            style: {
                              fontFamily: 'var(--font-display)',
                              fontWeight: 800,
                              fontSize: 18,
                              color: 'var(--apricot-deep)',
                            },
                          },
                          '6 дней',
                        ),
                        Dk(
                          'div',
                          {
                            key: 's',
                            style: {
                              fontSize: 12,
                              color: 'var(--apricot-deep)',
                              opacity: 0.85,
                              fontWeight: 600,
                            },
                          },
                          'Серия · идёт',
                        ),
                      ]),
                    ],
                  ),
                  Dk(
                    'div',
                    { key: 'week', style: { display: 'flex', gap: 6 } },
                    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) =>
                      Dk(
                        'div',
                        {
                          key: d,
                          style: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                          },
                        },
                        [
                          Dk(
                            'div',
                            {
                              key: 'c',
                              style: {
                                width: 26,
                                height: 26,
                                borderRadius: 999,
                                background: i < 6 ? 'var(--apricot)' : 'rgba(224,168,126,.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              },
                            },
                            i < 6 &&
                              Dk(Icon, { name: 'check', size: 13, color: '#fff', strokeWidth: 3 }),
                          ),
                          Dk(
                            'span',
                            {
                              key: 'l',
                              style: {
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'var(--apricot-deep)',
                                opacity: 0.8,
                              },
                            },
                            d,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              Dk(
                'div',
                {
                  key: 'stats',
                  style: {
                    background: 'var(--card)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 18,
                  },
                },
                [
                  Dk(
                    'div',
                    { key: 'lbl', className: 'ad-overline', style: { marginBottom: 14 } },
                    'За неделю',
                  ),
                  ...[
                    ['check', '10', 'сделано'],
                    ['moon', '6', 'перенесено'],
                    ['flame', '4', 'серии'],
                  ].map(([ic, n, l]) =>
                    Dk(
                      'div',
                      {
                        key: l,
                        style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
                      },
                      [
                        Dk(
                          'span',
                          {
                            key: 'i',
                            style: {
                              width: 30,
                              height: 30,
                              borderRadius: 9,
                              background: 'var(--sage-tint)',
                              color: 'var(--sage-deep)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                          },
                          Dk(Icon, { name: ic, size: 15 }),
                        ),
                        Dk(
                          'span',
                          {
                            key: 'n',
                            style: {
                              fontFamily: 'var(--font-num)',
                              fontWeight: 800,
                              fontSize: 20,
                              color: 'var(--ink)',
                              marginRight: 4,
                            },
                          },
                          n,
                        ),
                        Dk(
                          'span',
                          {
                            key: 'l',
                            style: {
                              fontFamily: 'var(--font-body)',
                              fontSize: 13,
                              color: 'var(--ink-soft)',
                              fontWeight: 600,
                            },
                          },
                          l,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              Dk(
                SoftNote,
                { key: 'note', tone: 'apricot', icon: 'heart' },
                'Каждый день — новый старт.',
              ),
            ],
          ),
        ],
      ),
    ]),
  ])
}

Object.assign(window, {
  DesktopFrame,
  DesktopSidebar,
  DeskToday,
  DeskFocus,
  DeskProjects,
  DeskHistory,
})
