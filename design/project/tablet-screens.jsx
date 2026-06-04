/* TooToo — Планшет · iPad Portrait · 768 × 1024
   TabletFrame, TabToday, TabTree, TabFocus, TabProjects
   Экспортируется в window. */
const Tb = React.createElement

/* ── Рамка iPad ─────────────────────────────────────────── */
function TabletFrame({ children, dark }) {
  /* внешние размеры: 816 × 1136 (768+48 × 1024+112) */
  return Tb(
    'div',
    {
      style: {
        width: 816,
        height: 1136,
        borderRadius: 44,
        overflow: 'hidden',
        background: dark ? '#1A1A1A' : '#2D2D2D',
        boxShadow: '0 44px 88px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.18)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        boxSizing: 'border-box',
      },
    },
    [
      /* камера */
      Tb('div', {
        key: 'cam',
        style: {
          position: 'absolute',
          top: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 13,
          height: 13,
          borderRadius: 999,
          background: '#3A3A3A',
        },
      }),
      /* полоска */
      Tb('div', {
        key: 'bar',
        style: {
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 144,
          height: 5,
          borderRadius: 999,
          background: dark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.22)',
        },
      }),
      /* экран 768 × 1024 */
      Tb(
        'div',
        {
          key: 'scr',
          style: {
            width: 768,
            height: 1024,
            borderRadius: 24,
            overflow: 'hidden',
            background: dark ? '#1A211D' : 'var(--cream)',
            position: 'relative',
          },
        },
        children,
      ),
    ],
  )
}

/* ── T1 · Сегодня — 2-колоночная сетка задач ───────────── */
function TabToday() {
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
    {
      id: 5,
      title: 'Купить корм коту',
      catLabel: 'Дом',
      catColor: 'var(--cat-sage)',
      time: '5 мин',
    },
    { id: 6, title: 'Прогулка 30 минут', catLabel: 'Себе', catColor: 'var(--cat-mauve)' },
  ]
  return Tb(
    'div',
    {
      style: {
        position: 'relative',
        height: '100%',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
      },
    },
    [
      /* шапка */
      Tb(
        'div',
        {
          key: 'head',
          style: {
            padding: '38px 32px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        [
          Tb('div', { key: 'l' }, [
            Tb(
              'div',
              { key: 'g', className: 'ad-h1', style: { fontSize: 32 } },
              'Доброе утро, Аня',
            ),
            Tb(
              'div',
              {
                key: 's',
                style: {
                  fontFamily: 'var(--font-body)',
                  fontSize: 16.5,
                  color: 'var(--ink-soft)',
                  marginTop: 5,
                },
              },
              'Спокойно. Шаг за шагом.',
            ),
          ]),
          Tb(ProgressRing, { key: 'ring', done: 2, total: 6 }),
        ],
      ),
      /* выгрузка */
      Tb(
        'div',
        {
          key: 'dump',
          style: {
            margin: '0 32px 20px',
            background: 'linear-gradient(180deg,var(--card),#FBFAF8)',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-md)',
            padding: '15px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          },
        },
        [
          Tb(
            'span',
            {
              key: 'i',
              style: {
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'var(--sage-tint)',
                color: 'var(--sage-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              },
            },
            Tb(Icon, { name: 'zap', size: 20 }),
          ),
          Tb(
            'div',
            {
              key: 'inp',
              style: {
                flex: 1,
                background: 'var(--cream)',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                padding: '11px 15px',
                color: 'var(--ink-faint)',
                fontFamily: 'var(--font-body)',
                fontSize: 15.5,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              },
            },
            [
              Tb(Icon, { key: 'p', name: 'plus', size: 17, color: 'var(--ink-soft)' }),
              'Выгрузи, что крутится в голове…',
            ],
          ),
        ],
      ),
      Tb(
        'div',
        { key: 'lbl', className: 'ad-overline', style: { margin: '0 32px 13px' } },
        'На сегодня · 6 дел',
      ),
      /* 2 колонки задач */
      Tb(
        'div',
        {
          key: 'grid',
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '0 32px',
            flex: 1,
          },
        },
        tasks.map((t) => Tb(TaskRow, { key: t.id, task: t, onToggle: () => {} })),
      ),
      Tb('div', { key: 'sp', style: { height: 88 } }),
      /* FAB */
      Tb(
        'button',
        {
          key: 'fab',
          style: {
            position: 'absolute',
            right: 30,
            bottom: 98,
            width: 62,
            height: 62,
            borderRadius: 999,
            background: 'var(--accent-fill)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 30,
            boxShadow: '0 8px 22px rgba(124,154,146,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        Tb(Icon, { name: 'plus', size: 28, color: '#fff', strokeWidth: 2.4 }),
      ),
      Tb(BottomNav, { key: 'nav', active: 'home', onNav: () => {} }),
    ],
  )
}

/* ── T2 · Дерево подзадач — сплит-вид ──────────────────── */

/* локальный TreeNode без соединительных рельсов */
function TabTreeNode({ text, est, state, depth, hasChildren }) {
  const done = state === 'done',
    now = state === 'now'
  return Tb('div', { style: { display: 'flex', gap: 0, marginBottom: 8 } }, [
    depth > 0 && Tb('div', { key: 'ind', style: { width: depth * 22, flexShrink: 0 } }),
    Tb(
      'div',
      {
        key: 'b',
        style: {
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '11px 13px',
          background: now ? 'var(--sage-tint)' : 'var(--card)',
          borderRadius: 'var(--r-md)',
          boxShadow: now ? 'none' : 'var(--shadow-sm)',
          border: now ? '1.5px solid var(--sage)' : '1.5px solid transparent',
        },
      },
      [
        done
          ? Tb(
              'span',
              {
                key: 'c',
                style: {
                  width: 23,
                  height: 23,
                  borderRadius: 999,
                  background: 'var(--accent-fill)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                },
              },
              Tb(Icon, { name: 'check', size: 13, color: '#fff', strokeWidth: 3 }),
            )
          : Tb('span', {
              key: 'c',
              style: {
                width: 23,
                height: 23,
                borderRadius: 999,
                flexShrink: 0,
                border: now ? '2px solid var(--sage)' : '2px solid var(--line-strong)',
                background: 'var(--card)',
              },
            }),
        Tb('div', { key: 't', style: { flex: 1 } }, [
          hasChildren &&
            Tb(
              'div',
              { key: 'lbl', className: 'ad-overline', style: { marginBottom: 2 } },
              'Группа',
            ),
          Tb(
            'div',
            {
              key: 'tx',
              style: {
                fontFamily: 'var(--font-body)',
                fontSize: 14.5,
                lineHeight: 1.3,
                fontWeight: now || hasChildren ? 700 : 600,
                color: done ? 'var(--ink-faint)' : 'var(--ink)',
                textDecoration: done ? 'line-through' : 'none',
              },
            },
            text,
          ),
        ]),
        now &&
          Tb(
            'span',
            {
              key: 'nl',
              style: {
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--sage-deep)',
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              },
            },
            'сейчас',
          ),
        !now &&
          !done &&
          est &&
          Tb(
            'span',
            {
              key: 'est',
              style: {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-soft)',
                flexShrink: 0,
              },
            },
            [Tb(Icon, { key: 'i', name: 'clock', size: 12 }), est],
          ),
      ],
    ),
  ])
}

function TabTree() {
  const nodes = [
    { text: 'Собрать документы', depth: 1, state: 'done', hasChildren: true },
    { text: 'Найти паспорт и СНИЛС', depth: 2, state: 'done', est: '5 мин' },
    { text: 'Сделать копии', depth: 2, state: 'done', est: '10 мин' },
    { text: 'Упаковать кухню', depth: 1, state: 'now', hasChildren: true },
    { text: 'Купить 10 коробок', depth: 2, state: 'now', est: '15 мин' },
    { text: 'Завернуть посуду', depth: 2, state: 'todo', est: '40 мин' },
    { text: 'Подписать коробки', depth: 2, state: 'todo', est: '10 мин' },
    { text: 'Заказать машину', depth: 1, state: 'todo', est: '10 мин' },
  ]
  return Tb('div', { style: { display: 'flex', height: '100%', background: 'var(--cream)' } }, [
    /* левая — дерево */
    Tb(
      'div',
      {
        key: 'left',
        style: {
          width: 400,
          borderRight: '1px solid var(--line)',
          overflowY: 'auto',
          padding: '36px 24px 36px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        },
      },
      [
        Tb(BackBtn, { key: 'back' }),
        Tb(Pill, { key: 'pill', tone: 'sage' }, [
          Tb(Icon, { key: 'i', name: 'layers', size: 14 }),
          'Разбито на шаги',
        ]),
        Tb(
          'div',
          { key: 't', className: 'ad-h1', style: { fontSize: 24 } },
          'Организовать переезд',
        ),
        Tb('div', { key: 'pb', style: { display: 'flex', alignItems: 'center', gap: 10 } }, [
          Tb(
            'div',
            {
              key: 'tr',
              style: {
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: 'var(--sage-tint-2)',
                overflow: 'hidden',
              },
            },
            Tb('div', {
              style: {
                height: '100%',
                width: '37%',
                background: 'var(--accent-fill)',
                borderRadius: 999,
              },
            }),
          ),
          Tb(
            'span',
            {
              key: 'n',
              style: {
                fontFamily: 'var(--font-num)',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--sage-deep)',
                whiteSpace: 'nowrap',
              },
            },
            '3 из 8',
          ),
        ]),
        Tb(
          'div',
          { key: 'tree' },
          nodes.map((n, i) => Tb(TabTreeNode, { key: i, ...n })),
        ),
      ],
    ),
    /* правая — фокус-карточка */
    Tb(
      'div',
      {
        key: 'right',
        style: { flex: 1, padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 18 },
      },
      [
        Tb(
          'div',
          { key: 'now-lbl', className: 'ad-overline', style: { color: 'var(--sage-deep)' } },
          'Сейчас этот шаг',
        ),
        Tb(
          'div',
          {
            key: 'now-card',
            style: {
              background: 'var(--sage-tint)',
              border: '2px solid var(--sage)',
              borderRadius: 'var(--r-xl)',
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 15,
            },
          },
          [
            Tb(
              'div',
              {
                key: 'i',
                style: {
                  width: 50,
                  height: 50,
                  borderRadius: 999,
                  background: 'var(--accent-fill)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(124,154,146,.4)',
                },
              },
              Tb(Icon, { name: 'layers', size: 25, color: '#fff' }),
            ),
            Tb(
              'div',
              {
                key: 't',
                style: {
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 22,
                  color: 'var(--ink)',
                  lineHeight: 1.25,
                },
              },
              'Купить 10 коробок',
            ),
            Tb(
              'div',
              {
                key: 'est',
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'var(--card)',
                  borderRadius: 999,
                  padding: '6px 13px',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--ink-soft)',
                },
              },
              [Tb(Icon, { key: 'i', name: 'clock', size: 15 }), 'примерно 15 минут'],
            ),
            Tb(
              'button',
              {
                key: 'btn',
                style: {
                  background: 'var(--accent-fill)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--r-md)',
                  padding: '15px 0',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 8px 22px rgba(124,154,146,.4)',
                },
              },
              [Tb(Icon, { key: 'i', name: 'play', size: 18, color: '#fff' }), 'Начать этот шаг'],
            ),
          ],
        ),
        Tb('div', { key: 'next-lbl', className: 'ad-overline', style: { marginTop: 6 } }, 'Дальше'),
        Tb(
          'div',
          { key: 'next-list', style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          [
            ['Завернуть посуду', '40 мин'],
            ['Подписать коробки', '10 мин'],
            ['Заказать машину', '10 мин'],
          ].map(([text, est], i) =>
            Tb(
              'div',
              {
                key: i,
                style: {
                  background: 'var(--card)',
                  borderRadius: 'var(--r-md)',
                  padding: '12px 15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: 'var(--shadow-sm)',
                  opacity: 1 - i * 0.12,
                },
              },
              [
                Tb('span', {
                  key: 'c',
                  style: {
                    width: 21,
                    height: 21,
                    borderRadius: 999,
                    border: '2px solid var(--line-strong)',
                    background: 'var(--card)',
                    flexShrink: 0,
                  },
                }),
                Tb(
                  'span',
                  {
                    key: 't',
                    style: {
                      flex: 1,
                      fontFamily: 'var(--font-body)',
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    },
                  },
                  text,
                ),
                Tb(
                  'span',
                  {
                    key: 'e',
                    style: {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12.5,
                      color: 'var(--ink-soft)',
                      fontWeight: 600,
                    },
                  },
                  [Tb(Icon, { key: 'i', name: 'clock', size: 13 }), est],
                ),
              ],
            ),
          ),
        ),
        Tb('div', { key: 'sp', style: { flex: 1 } }),
        Tb(
          SoftNote,
          { key: 'note', tone: 'sage', icon: 'heart' },
          'Сейчас только «купить коробки». Остальное подождёт.',
        ),
      ],
    ),
  ])
}

/* ── T3 · Фокус-режим — просторный помидор ─────────────── */
function TabFocus() {
  const r = 150,
    c = 2 * Math.PI * r
  return Tb(
    'div',
    {
      style: {
        height: '100%',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        padding: '46px 38px 36px',
        boxSizing: 'border-box',
      },
    },
    [
      /* верхняя строка */
      Tb(
        'div',
        {
          key: 'top',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 26,
          },
        },
        [
          Tb(RoundBtn, { key: 'back', icon: 'chevronL' }),
          Tb(Pill, { key: 'pill', tone: 'sage' }, [
            Tb(Icon, { key: 'i', name: 'eye', size: 14 }),
            'Сейчас только одно',
          ]),
          Tb('span', { key: 'sp', style: { width: 44 } }),
        ],
      ),
      /* название задачи */
      Tb(
        'div',
        { key: 'task', style: { textAlign: 'center', marginBottom: 32 } },
        Tb(
          'div',
          { className: 'ad-h2', style: { fontSize: 27, lineHeight: 1.25 } },
          'Заполнить таблицу за квартал',
        ),
      ),
      /* кольцо */
      Tb(
        'div',
        { key: 'ring', style: { display: 'flex', justifyContent: 'center', marginBottom: 30 } },
        Tb('div', { style: { position: 'relative', width: 340, height: 340 } }, [
          Tb(
            'svg',
            {
              key: 's',
              width: 340,
              height: 340,
              viewBox: '0 0 340 340',
              style: { transform: 'rotate(-90deg)', display: 'block' },
            },
            [
              Tb('circle', {
                key: 'bg',
                cx: 170,
                cy: 170,
                r,
                fill: 'none',
                stroke: 'var(--sage-tint-2)',
                strokeWidth: 16,
              }),
              Tb('circle', {
                key: 'fg',
                cx: 170,
                cy: 170,
                r,
                fill: 'none',
                stroke: 'var(--accent-fill)',
                strokeWidth: 16,
                strokeLinecap: 'round',
                strokeDasharray: c,
                strokeDashoffset: c * 0.38,
              }),
            ],
          ),
          Tb(
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
              Tb(
                'div',
                {
                  key: 't',
                  style: {
                    fontFamily: 'var(--font-num)',
                    fontWeight: 800,
                    fontSize: 72,
                    color: 'var(--ink)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  },
                },
                '18:24',
              ),
              Tb(
                'div',
                { key: 's', className: 'ad-overline', style: { marginTop: 10 } },
                'Фокус · помидор 2 из 4',
              ),
            ],
          ),
        ]),
      ),
      /* управление */
      Tb(
        'div',
        {
          key: 'ctrl',
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26,
            marginBottom: 32,
          },
        },
        [
          Tb(
            'button',
            {
              key: 'snz',
              style: {
                width: 60,
                height: 60,
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
            Tb(Icon, { name: 'moon', size: 25 }),
          ),
          Tb(
            'button',
            {
              key: 'pp',
              style: {
                width: 82,
                height: 82,
                borderRadius: 999,
                background: 'var(--accent-fill)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 10px 26px rgba(124,154,146,.5)',
              },
            },
            Tb('div', { style: { display: 'flex', gap: 7 } }, [
              Tb('span', {
                key: 1,
                style: { width: 8, height: 28, borderRadius: 4, background: '#fff' },
              }),
              Tb('span', {
                key: 2,
                style: { width: 8, height: 28, borderRadius: 4, background: '#fff' },
              }),
            ]),
          ),
          Tb(
            'button',
            {
              key: 'done',
              style: {
                width: 60,
                height: 60,
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
            Tb(Icon, { name: 'check', size: 27, strokeWidth: 2.6 }),
          ),
        ],
      ),
      /* lo-fi плеер */
      Tb(
        'div',
        {
          key: 'lofi',
          style: {
            background: 'var(--card)',
            borderRadius: 'var(--r-xl)',
            boxShadow: 'var(--shadow-md)',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          },
        },
        [
          Tb(
            'div',
            {
              key: 'art',
              style: {
                width: 56,
                height: 56,
                borderRadius: 15,
                background: 'linear-gradient(135deg,var(--sage),var(--apricot))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              },
            },
            Tb(Icon, { name: 'cloud', size: 27, color: '#fff' }),
          ),
          Tb('div', { key: 'meta', style: { flex: 1 } }, [
            Tb(
              'div',
              { key: 'o', className: 'ad-overline', style: { color: 'var(--sage-deep)' } },
              'Lo-fi · фон',
            ),
            Tb(
              'div',
              {
                key: 't',
                style: {
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 16,
                  color: 'var(--ink)',
                  marginTop: 2,
                },
              },
              'Дождь за окном',
            ),
            Tb(
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
              Tb('div', {
                style: {
                  height: '100%',
                  width: '45%',
                  background: 'var(--sage)',
                  borderRadius: 999,
                },
              }),
            ),
          ]),
          Tb(
            'button',
            {
              key: 'pause',
              style: {
                width: 44,
                height: 44,
                borderRadius: 999,
                background: 'var(--sage-tint)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              },
            },
            Tb('div', { style: { display: 'flex', gap: 5 } }, [
              Tb('span', {
                key: 1,
                style: { width: 5, height: 17, borderRadius: 3, background: 'var(--sage-deep)' },
              }),
              Tb('span', {
                key: 2,
                style: { width: 5, height: 17, borderRadius: 3, background: 'var(--sage-deep)' },
              }),
            ]),
          ),
        ],
      ),
    ],
  )
}

/* ── T4 · Проекты — 2 × 2 сетка ────────────────────────── */
function TabProjects() {
  const projects = [
    {
      icon: 'layers',
      name: 'Переезд',
      done: 3,
      total: 8,
      next: 'Купить коробки',
      tone: ['var(--sage-tint)', 'var(--sage-deep)'],
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
    {
      icon: 'award',
      name: 'Фитнес-цели',
      done: 1,
      total: 5,
      next: 'Утренняя зарядка',
      tone: ['var(--apricot-tint)', 'var(--apricot-deep)'],
    },
  ]
  return Tb(
    'div',
    {
      style: {
        position: 'relative',
        height: '100%',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
      },
    },
    [
      Tb(
        'div',
        {
          key: 'head',
          style: {
            padding: '38px 32px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          },
        },
        [
          Tb('div', { key: 'l' }, [
            Tb('div', { key: 't', className: 'ad-h1', style: { fontSize: 32 } }, 'Проекты'),
            Tb(
              'div',
              {
                key: 's',
                style: {
                  fontFamily: 'var(--font-body)',
                  fontSize: 16,
                  color: 'var(--ink-soft)',
                  marginTop: 5,
                },
              },
              'Большие дела, разбитые на шаги.',
            ),
          ]),
          Tb(StreakBadge, { key: 'streak', days: 6 }),
        ],
      ),
      /* 2 × 2 сетка */
      Tb(
        'div',
        {
          key: 'grid',
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            padding: '0 32px',
            flex: 1,
          },
        },
        projects.map((p, i) =>
          Tb(
            'div',
            {
              key: i,
              style: {
                background: 'var(--card)',
                borderRadius: 'var(--r-xl)',
                boxShadow: 'var(--shadow-md)',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              },
            },
            [
              Tb('div', { key: 'top', style: { display: 'flex', alignItems: 'center', gap: 13 } }, [
                Tb(
                  'span',
                  {
                    key: 'i',
                    style: {
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: p.tone[0],
                      color: p.tone[1],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    },
                  },
                  Tb(Icon, { name: p.icon, size: 24 }),
                ),
                Tb('div', { key: 't', style: { flex: 1 } }, [
                  Tb(
                    'div',
                    {
                      key: 'n',
                      style: {
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 18,
                        color: 'var(--ink)',
                      },
                    },
                    p.name,
                  ),
                  Tb(
                    'div',
                    {
                      key: 's',
                      style: {
                        fontSize: 13,
                        color: 'var(--ink-soft)',
                        fontWeight: 600,
                        marginTop: 2,
                      },
                    },
                    p.done + ' из ' + p.total + ' шагов',
                  ),
                ]),
              ]),
              Tb(
                'div',
                {
                  key: 'bar',
                  style: {
                    height: 8,
                    borderRadius: 999,
                    background: 'var(--sage-tint-2)',
                    overflow: 'hidden',
                  },
                },
                Tb('div', {
                  style: {
                    height: '100%',
                    width: Math.round((p.done / p.total) * 100) + '%',
                    background: 'var(--accent-fill)',
                    borderRadius: 999,
                  },
                }),
              ),
              Tb(
                'div',
                {
                  key: 'next',
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 600,
                  },
                },
                [
                  Tb(Icon, { key: 'i', name: 'play', size: 15, color: 'var(--sage-deep)' }),
                  Tb('span', { key: 't', style: { color: 'var(--ink)' } }, 'Дальше: ' + p.next),
                ],
              ),
            ],
          ),
        ),
      ),
      /* FAB */
      Tb(
        'button',
        {
          key: 'fab',
          style: {
            position: 'absolute',
            right: 30,
            bottom: 98,
            width: 62,
            height: 62,
            borderRadius: 999,
            background: 'var(--accent-fill)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 30,
            boxShadow: '0 8px 22px rgba(124,154,146,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        Tb(Icon, { name: 'plus', size: 28, color: '#fff', strokeWidth: 2.4 }),
      ),
      Tb('div', { key: 'sp', style: { height: 88 } }),
      Tb(BottomNav, { key: 'nav', active: 'tasks', onNav: () => {} }),
    ],
  )
}

Object.assign(window, { TabletFrame, TabToday, TabTree, TabFocus, TabProjects })
