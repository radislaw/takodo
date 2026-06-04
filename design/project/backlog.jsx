/* TooToo — Backlog / Монетизация
   S11 theme store · achievement badges · heatmap · TooToo Plus
   Exports: S11ThemeStore, BadgesScreen, HeatmapScreen, PlusScreen */
const B = React.createElement

/* mini phone-screen preview that re-themes via data-theme */
function ThemeSwatch({ theme, name, premium, selected }) {
  return B('div', { style: { display: 'flex', flexDirection: 'column', gap: 9 } }, [
    B(
      'div',
      {
        key: 'pv',
        'data-theme': theme || undefined,
        style: {
          position: 'relative',
          borderRadius: 18,
          overflow: 'hidden',
          height: 132,
          background: 'var(--cream)',
          padding: 12,
          boxShadow: selected ? '0 0 0 2.5px var(--sage)' : 'var(--shadow-sm)',
          border: '1px solid var(--line)',
        },
      },
      [
        /* header dot row */
        B(
          'div',
          {
            key: 'h',
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
          },
          [
            B('span', {
              key: 't',
              style: {
                width: 38,
                height: 7,
                borderRadius: 999,
                background: 'var(--ink)',
                opacity: 0.8,
              },
            }),
            B('span', {
              key: 'd',
              style: { width: 14, height: 14, borderRadius: 999, background: 'var(--reward-fill)' },
            }),
          ],
        ),
        /* task lines */
        ...[0, 1].map((i) =>
          B(
            'div',
            {
              key: 'c' + i,
              style: {
                marginTop: 9,
                height: 26,
                borderRadius: 8,
                background: 'var(--card)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '0 8px',
              },
            },
            [
              B('span', {
                key: 'r',
                style: {
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  background: i === 0 ? 'var(--accent-fill)' : 'transparent',
                  border: i === 0 ? 'none' : '2px solid var(--line-strong)',
                },
              }),
              B('span', {
                key: 'l',
                style: {
                  height: 6,
                  width: i === 0 ? 44 : 60,
                  borderRadius: 999,
                  background: 'var(--ink)',
                  opacity: 0.25,
                },
              }),
            ],
          ),
        ),
        /* FAB */
        B('span', {
          key: 'f',
          style: {
            position: 'absolute',
            right: 11,
            bottom: 11,
            width: 24,
            height: 24,
            borderRadius: 999,
            background: 'var(--accent-fill)',
          },
        }),
        premium &&
          B(
            'span',
            {
              key: 'lk',
              style: {
                position: 'absolute',
                left: 10,
                bottom: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(44,58,51,.78)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 999,
                fontFamily: 'var(--font-body)',
              },
            },
            'PLUS',
          ),
      ],
    ),
    B(
      'div',
      {
        key: 'nm',
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2px',
        },
      },
      [
        B(
          'span',
          {
            key: 'n',
            style: {
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13.5,
              color: 'var(--ink)',
            },
          },
          name,
        ),
        selected &&
          B(Icon, { key: 'c', name: 'check', size: 16, color: 'var(--sage-deep)', strokeWidth: 3 }),
      ],
    ),
  ])
}
function S11ThemeStore() {
  const free = [
    { theme: null, name: 'Шалфей', selected: true },
    { theme: 'dark', name: 'Вечерний' },
    { theme: 'lavender', name: 'Лаванда' },
    { theme: 'eco', name: 'Эко' },
    { theme: 'cloud', name: 'Облака' },
    { theme: 'high-contrast', name: 'Контраст' },
  ]
  const prem = [
    { theme: 'cyberpunk', name: 'Киберпанк', premium: true },
    { theme: 'lavender-dark', name: 'Ночное поле', premium: true },
    { theme: 'amoled', name: 'AMOLED', premium: true },
  ]
  return B(Screen, { pad: 64 }, [
    B('div', { key: 'h', style: { padding: '0 22px', marginBottom: 18 } }, [
      B('div', { key: 't', className: 'ad-h1' }, 'Оформление'),
      B(
        'div',
        {
          key: 's',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 4,
          },
        },
        'Выбери спокойный фон под настроение.',
      ),
    ]),
    B(SectionLabel, { key: 'l1', style: { margin: '0 22px 12px' } }, 'Бесплатные'),
    B(
      'div',
      {
        key: 'g1',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 22px' },
      },
      free.map((t, i) => B(ThemeSwatch, { key: i, ...t })),
    ),
    B(SectionLabel, { key: 'l2', style: { margin: '26px 22px 12px' } }, 'TooToo Plus'),
    B(
      'div',
      {
        key: 'g2',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 22px' },
      },
      prem.map((t, i) => B(ThemeSwatch, { key: i, ...t })),
    ),
    B(
      'div',
      { key: 'cta', style: { padding: '20px 22px 0' } },
      B(PrimaryBtn, { reward: true, icon: 'sparkles', label: 'Открыть все темы · Plus' }),
    ),
  ])
}

/* ============================== ЗНАЧКИ ДОСТИЖЕНИЙ ============================== */
function BadgesScreen() {
  const cards = [
    { icon: 'sparkles', title: 'Первый шаг', sub: 'Закрыто первое дело', got: true },
    { icon: 'flame', title: 'Серия 5 дней', sub: 'Понемногу каждый день', got: true },
    { icon: 'moon', title: 'Бережно к себе', sub: 'Перенёс без вины 3 раза', got: true },
    { icon: 'layers', title: 'Разбиватель', sub: 'Разбил 10 больших дел', got: true },
    { icon: 'award', title: 'Серия 7 дней', sub: 'Ещё 2 дня', got: false },
    { icon: 'gift', title: '100 шагов', sub: 'Сделано 64 из 100', got: false },
  ]
  return B(Screen, { pad: 64 }, [
    B('div', { key: 'h', style: { padding: '0 22px' } }, [
      B('div', { key: 't', className: 'ad-h1' }, 'Твои значки'),
      B(
        'div',
        {
          key: 's',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 4,
            lineHeight: 1.5,
          },
        },
        'Не за идеальность — за то, что возвращаешься.',
      ),
    ]),
    B(
      'div',
      {
        key: 'hero',
        style: {
          margin: '20px 22px 0',
          background: 'var(--apricot-tint)',
          borderRadius: 'var(--r-xl)',
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: 'var(--shadow-md)',
        },
      },
      [
        B(
          'div',
          {
            key: 'm',
            style: {
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'var(--apricot)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(224,168,126,.5)',
              flexShrink: 0,
            },
          },
          B(Icon, { name: 'flame', size: 30, color: '#fff' }),
        ),
        B('div', { key: 't' }, [
          B(
            'div',
            {
              key: 'n',
              style: {
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 22,
                color: 'var(--apricot-deep)',
              },
            },
            '6 дней подряд',
          ),
          B(
            'div',
            {
              key: 's',
              style: {
                fontSize: 13,
                color: 'var(--apricot-deep)',
                opacity: 0.85,
                fontWeight: 600,
                marginTop: 2,
              },
            },
            'Маленькие шаги складываются',
          ),
        ]),
      ],
    ),
    B(SectionLabel, { key: 'l', style: { margin: '24px 22px 12px' } }, 'Собрано 4 из 6'),
    B(
      'div',
      {
        key: 'g',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 22px' },
      },
      cards.map((c) =>
        B(
          'div',
          {
            key: c.title,
            style: {
              background: 'var(--card)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: 16,
              opacity: c.got ? 1 : 0.55,
            },
          },
          [
            B(
              'div',
              {
                key: 'i',
                style: {
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: c.got ? 'var(--sage-tint)' : 'var(--cream-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: c.got ? 'var(--sage-deep)' : 'var(--ink-faint)',
                },
              },
              B(Icon, { name: c.icon, size: 22 }),
            ),
            B(
              'div',
              {
                key: 't',
                style: {
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 15,
                  color: 'var(--ink)',
                  marginTop: 12,
                },
              },
              c.title,
            ),
            B(
              'div',
              {
                key: 's',
                style: { fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.35 },
              },
              c.sub,
            ),
          ],
        ),
      ),
    ),
  ])
}

/* ============================== HEATMAP ============================== */
function HeatmapScreen() {
  const weeks = 19,
    days = 7
  // deterministic pseudo-random intensity 0..4
  const lvl = (w, d) => {
    const x = ((w * 7 + d) * 2654435761) % 97
    if (x < 26) return 0
    if (x < 50) return 1
    if (x < 72) return 2
    if (x < 88) return 3
    return 4
  }
  const tints = [
    'var(--sage-tint-2)',
    'rgba(124,154,146,.35)',
    'rgba(124,154,146,.6)',
    'rgba(124,154,146,.82)',
    'var(--sage)',
  ]
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май']
  return B(Screen, { pad: 64 }, [
    B('div', { key: 'h', style: { padding: '0 22px', marginBottom: 18 } }, [
      B('div', { key: 't', className: 'ad-h1' }, 'Год понемногу'),
      B(
        'div',
        {
          key: 's',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 4,
            lineHeight: 1.5,
          },
        },
        'Каждая клетка — маленький шаг. Пустые дни — это тоже отдых.',
      ),
    ]),
    /* stat row */
    B(
      'div',
      { key: 'stats', style: { margin: '0 22px 20px', display: 'flex', gap: 12 } },
      [
        ['flame', '6', 'дней серия'],
        ['check', '248', 'шагов всего'],
        ['flower', '18', 'недель с нами'],
      ].map(([ic, n, l], i) =>
        B(
          'div',
          {
            key: i,
            style: {
              flex: 1,
              background: 'var(--card)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 10px',
              textAlign: 'center',
            },
          },
          [
            B(Icon, {
              key: 'i',
              name: ic,
              size: 20,
              color: 'var(--sage-deep)',
              style: { margin: '0 auto' },
            }),
            B(
              'div',
              {
                key: 'n',
                style: {
                  fontFamily: 'var(--font-num)',
                  fontWeight: 800,
                  fontSize: 21,
                  color: 'var(--ink)',
                  marginTop: 6,
                },
              },
              n,
            ),
            B(
              'div',
              {
                key: 'l',
                style: {
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  fontWeight: 600,
                  marginTop: 1,
                },
              },
              l,
            ),
          ],
        ),
      ),
    ),
    /* grid */
    B(
      'div',
      {
        key: 'card',
        style: {
          margin: '0 22px',
          background: 'var(--card)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: 18,
        },
      },
      [
        B(
          'div',
          {
            key: 'mo',
            style: {
              display: 'flex',
              gap: 24,
              marginBottom: 8,
              paddingLeft: 2,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink-soft)',
            },
          },
          months.map((m) => B('span', { key: m }, m)),
        ),
        B(
          'div',
          { key: 'grid', style: { display: 'flex', gap: 5 } },
          Array.from({ length: weeks }).map((_, w) =>
            B(
              'div',
              { key: w, style: { display: 'flex', flexDirection: 'column', gap: 5 } },
              Array.from({ length: days }).map((_, d) =>
                B('span', {
                  key: d,
                  style: { width: 11, height: 11, borderRadius: 3, background: tints[lvl(w, d)] },
                }),
              ),
            ),
          ),
        ),
        B(
          'div',
          {
            key: 'leg',
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 6,
              marginTop: 14,
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink-soft)',
            },
          },
          [
            B('span', { key: 'a' }, 'реже'),
            ...tints.map((t, i) =>
              B('span', {
                key: i,
                style: { width: 11, height: 11, borderRadius: 3, background: t },
              }),
            ),
            B('span', { key: 'b' }, 'чаще'),
          ],
        ),
      ],
    ),
  ])
}

/* ============================== TOOTOO PLUS (paywall) ============================== */
function PlusFeature({ icon, title, sub }) {
  return B('div', { style: { display: 'flex', alignItems: 'flex-start', gap: 13 } }, [
    B(
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
      B(Icon, { name: icon, size: 21 }),
    ),
    B('div', { key: 't', style: { flex: 1, paddingTop: 1 } }, [
      B(
        'div',
        {
          key: 'a',
          style: {
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--ink)',
          },
        },
        title,
      ),
      B(
        'div',
        {
          key: 'b',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 13.5,
            color: 'var(--ink-soft)',
            marginTop: 2,
            lineHeight: 1.45,
          },
        },
        sub,
      ),
    ]),
  ])
}
function PlusScreen() {
  return B(Screen, { pad: 56 }, [
    B(
      'div',
      { key: 'top', style: { padding: '0 22px', display: 'flex', justifyContent: 'flex-end' } },
      B(
        'button',
        {
          style: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-faint)',
          },
        },
        B(Icon, { name: 'x', size: 24 }),
      ),
    ),
    B('div', { key: 'hero', style: { padding: '8px 30px 0', textAlign: 'center' } }, [
      B(
        'div',
        {
          key: 'm',
          style: {
            width: 80,
            height: 80,
            borderRadius: 24,
            margin: '0 auto',
            background: 'var(--reward-fill)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 26px rgba(224,168,126,.45)',
          },
        },
        B(Icon, { name: 'sparkles', size: 40, color: '#fff' }),
      ),
      B('div', { key: 't', className: 'ad-h1', style: { fontSize: 28, marginTop: 18 } }, [
        'TooToo ',
        B('span', { key: 'p', style: { color: 'var(--apricot-deep)' } }, 'Plus'),
      ]),
      B(
        'div',
        {
          key: 's',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 8,
            lineHeight: 1.5,
          },
        },
        'Больше спокойствия, когда дел становится больше.',
      ),
    ]),
    B(
      'div',
      {
        key: 'feats',
        style: {
          padding: '26px 26px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          flex: 1,
        },
      },
      [
        B(PlusFeature, {
          key: 1,
          icon: 'layers',
          title: 'Проекты без границ',
          sub: 'Большие дела с деревом подзадач',
        }),
        B(PlusFeature, {
          key: 2,
          icon: 'sparkles',
          title: 'AI-разбивка на шаги',
          sub: 'TooToo предложит, с чего начать',
        }),
        B(PlusFeature, {
          key: 3,
          icon: 'flower',
          title: 'Все темы оформления',
          sub: 'Киберпанк, ночное поле и другие',
        }),
        B(PlusFeature, {
          key: 4,
          icon: 'flame',
          title: 'Статистика и история',
          sub: 'Heatmap и значки достижений',
        }),
      ],
    ),
    B(
      'div',
      {
        key: 'cta',
        style: { padding: '18px 22px 0', display: 'flex', flexDirection: 'column', gap: 9 },
      },
      [
        B(PrimaryBtn, { key: 'p', reward: true, label: '299 ₽ в месяц · 7 дней бесплатно' }),
        B(GhostBtn, { key: 'g', label: 'Может быть позже' }),
      ],
    ),
  ])
}

Object.assign(window, { S11ThemeStore, BadgesScreen, HeatmapScreen, PlusScreen })
