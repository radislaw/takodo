/* AddyDo — Фаза 0 · MVP screens
   S1 empty · S2 today/dump · S3 resistance · S4 subtask tree
   S5 reward overlay · S6 history · S7 frequently-postponed · S9 settings
   Exports: S1Empty, S2Today, S3Resistance, S4Tree, S5Reward, S6History, S7Stuck, S9Settings */
const P = React.createElement

/* tiny bottom-nav spacer-aware nav reuse */
function Nav(active) {
  return P(BottomNav, { key: 'nav', active, onNav: () => {} })
}

/* ============================== S1 — ПУСТОЕ СОСТОЯНИЕ ============================== */
function S1Empty() {
  return P(Screen, { pad: 56 }, [
    P(
      'div',
      {
        key: 'h',
        style: {
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
      [
        P('div', { key: 'l', className: 'ad-h1', style: { fontSize: 27 } }, 'Сегодня'),
        P(RoundBtn, { key: 'b', icon: 'settings', soft: true }),
      ],
    ),
    P(
      'div',
      {
        key: 'mid',
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 36px',
        },
      },
      [
        P(
          'div',
          {
            key: 'i',
            style: {
              width: 92,
              height: 92,
              borderRadius: 999,
              background: 'var(--sage-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--sage-deep)',
            },
          },
          P(Icon, { name: 'flower', size: 44 }),
        ),
        P(
          'div',
          {
            key: 't',
            className: 'ad-h2',
            style: { fontSize: 24, marginTop: 26 },
          },
          'Здесь пока пусто',
        ),
        P(
          'div',
          {
            key: 's',
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: 15.5,
              color: 'var(--ink-soft)',
              marginTop: 10,
              lineHeight: 1.55,
              maxWidth: 270,
            },
          },
          'И это абсолютно нормально. Начнём с одного маленького дела — этого достаточно.',
        ),
      ],
    ),
    P(
      'div',
      {
        key: 'act',
        style: {
          padding: '0 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginBottom: 92,
        },
      },
      [
        P(PrimaryBtn, {
          key: 'p',
          icon: 'plus',
          label: 'Добавить первое дело',
        }),
        P(
          'div',
          {
            key: 'n',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'center',
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
            },
          },
          [P(Icon, { key: 'i', name: 'zap', size: 15 }), 'Или просто выгрузи всё, что в голове'],
        ),
      ],
    ),
    Nav('home'),
  ])
}

/* ============================== S2 — СЕГОДНЯ / ВЫГРУЗКА ============================== */
function S2Today() {
  const dump = [
    {
      id: 1,
      title: 'Записаться к стоматологу',
      catLabel: 'Здоровье',
      catColor: 'var(--cat-blue)',
    },
    {
      id: 2,
      title: 'Ответить Лене про дачу',
      catLabel: 'Себе',
      catColor: 'var(--cat-mauve)',
    },
    {
      id: 3,
      title: 'Оплатить интернет',
      catLabel: 'Дом',
      catColor: 'var(--cat-sage)',
    },
    {
      id: 4,
      title: 'Купить корм коту',
      catLabel: 'Дом',
      catColor: 'var(--cat-sage)',
    },
  ]
  return P(Screen, { pad: 56 }, [
    P(
      'div',
      {
        key: 'h',
        style: {
          padding: '0 22px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
      },
      [
        P('div', { key: 'l' }, [
          P('div', { key: 'g', className: 'ad-h1', style: { fontSize: 27 } }, 'Доброе утро, Аня'),
          P(
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
            'Спокойно. Шаг за шагом.',
          ),
        ]),
        P(RoundBtn, { key: 'b', icon: 'settings', soft: true }),
      ],
    ),
    /* brain-dump capture card */
    P(
      'div',
      {
        key: 'cap',
        style: {
          margin: '20px 22px 0',
          background: 'linear-gradient(180deg,#fff,#FBFAF8)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-md)',
          padding: 18,
        },
      },
      [
        P(
          'div',
          {
            key: 'top',
            style: { display: 'flex', alignItems: 'center', gap: 10 },
          },
          [
            P(
              'span',
              {
                key: 'i',
                style: {
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'var(--sage-tint)',
                  color: 'var(--sage-deep)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
              P(Icon, { name: 'zap', size: 20 }),
            ),
            P(Overline, { key: 'o', color: 'var(--sage-deep)' }, 'Выгрузка'),
          ],
        ),
        P(
          'div',
          {
            key: 'inp',
            style: {
              marginTop: 13,
              background: 'var(--cream)',
              border: '1.5px solid var(--line)',
              borderRadius: 'var(--r-sm)',
              padding: '13px 15px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-body)',
              fontSize: 15.5,
            },
          },
          [
            P(Icon, {
              key: 'p',
              name: 'plus',
              size: 18,
              color: 'var(--ink-soft)',
            }),
            'Выгрузи всё, что крутится в голове…',
          ],
        ),
        P(
          'div',
          {
            key: 'hint',
            style: {
              marginTop: 10,
              fontFamily: 'var(--font-body)',
              fontSize: 12.5,
              color: 'var(--ink-soft)',
              fontWeight: 600,
            },
          },
          'Не сортируй сейчас. Просто запиши — разберём потом.',
        ),
      ],
    ),
    P(SectionLabel, { key: 'lbl' }, 'Только что выгрузил · 4'),
    P(
      'div',
      {
        key: 'list',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '0 22px',
        },
      },
      dump.map((t) => P(TaskRow, { key: t.id, task: t, onToggle: () => {} })),
    ),
    P('div', { key: 'sp', style: { height: 110 } }),
    P(FAB, { key: 'fab', onClick: () => {} }),
    Nav('home'),
  ])
}

/* ============================== S3 — ВОПРОС СОПРОТИВЛЕНИЯ ============================== */
function S3Resistance() {
  const opts = [
    {
      icon: 'layers',
      title: 'Слишком большое',
      sub: 'Разобьём на маленькие шаги',
    },
    {
      icon: 'eye',
      title: 'Не знаю, с чего начать',
      sub: 'Подскажу самый первый шаг',
    },
    { icon: 'moon', title: 'Нет сил сегодня', sub: 'Перенесём без вины' },
    {
      icon: 'cloud',
      title: 'Скучно, не хочу',
      sub: 'Сделаем крошечную версию',
    },
  ]
  return P(Screen, { pad: 56 }, [
    P('div', { key: 'top', style: { padding: '0 22px' } }, P(BackBtn, {})),
    P('div', { key: 'head', style: { padding: '20px 26px 0', textAlign: 'center' } }, [
      P(
        Overline,
        {
          key: 'o',
          color: 'var(--sage-deep)',
          style: { textAlign: 'center' },
        },
        'Без осуждения',
      ),
      P(
        'div',
        {
          key: 't',
          className: 'ad-h1',
          style: { fontSize: 25, marginTop: 12, lineHeight: 1.25 },
        },
        'Что мешает начать?',
      ),
      P(
        'div',
        {
          key: 's',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 10,
            lineHeight: 1.5,
          },
        },
        '«Записаться к врачу» ждёт уже 4 дня. Давай поймём почему — чтобы помочь.',
      ),
    ]),
    P(
      'div',
      {
        key: 'opts',
        style: {
          padding: '22px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
          flex: 1,
        },
      },
      opts.map((o, i) => P(ChoiceRow, { key: i, icon: o.icon, title: o.title, sub: o.sub })),
    ),
    P(
      'div',
      { key: 'foot', style: { padding: '14px 22px 0' } },
      P(GhostBtn, { label: 'Просто перенести — это тоже нормально' }),
    ),
  ])
}

/* ============================== S4 — ДЕРЕВО ПОДЗАДАЧ ============================== */
function TreeNode({ text, est, state, depth, last, hasChildren }) {
  // state: 'todo' | 'now' | 'done'
  const done = state === 'done',
    now = state === 'now'
  return P('div', { style: { display: 'flex', alignItems: 'stretch' } }, [
    /* indent rails */
    depth > 0 &&
      P(
        'div',
        {
          key: 'rail',
          style: { width: depth * 26, flexShrink: 0, position: 'relative' },
        },
        P('div', {
          style: {
            position: 'absolute',
            left: (depth - 1) * 26 + 13,
            top: 0,
            bottom: last ? '50%' : 0,
            width: 2,
            background: 'var(--line-strong)',
          },
        }),
      ),
    P(
      'div',
      {
        key: 'b',
        style: {
          flex: 1,
          position: 'relative',
          paddingLeft: depth > 0 ? 14 : 0,
        },
      },
      [
        depth > 0 &&
          P('div', {
            key: 'elbow',
            style: {
              position: 'absolute',
              left: -13,
              top: 22,
              width: 14,
              height: 2,
              background: 'var(--line-strong)',
            },
          }),
        P(
          'div',
          {
            key: 'row',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: now ? 'var(--sage-tint)' : 'var(--card)',
              borderRadius: 'var(--r-md)',
              boxShadow: now ? 'none' : 'var(--shadow-sm)',
              marginBottom: 9,
              border: now ? '1.5px solid var(--sage)' : '1.5px solid transparent',
            },
          },
          [
            done
              ? P(
                  'span',
                  {
                    key: 'm',
                    style: {
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: 'var(--accent-fill)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    },
                  },
                  P(Icon, {
                    name: 'check',
                    size: 14,
                    color: '#fff',
                    strokeWidth: 3,
                  }),
                )
              : P('span', {
                  key: 'm',
                  style: {
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    flexShrink: 0,
                    border: now ? '2px solid var(--sage)' : '2px solid var(--line-strong)',
                    background: 'var(--card)',
                  },
                }),
            P('div', { key: 't', style: { flex: 1, minWidth: 0 } }, [
              hasChildren &&
                P(
                  'div',
                  {
                    key: 'lbl',
                    className: 'ad-overline',
                    style: { color: 'var(--ink-soft)', marginBottom: 2 },
                  },
                  'Группа',
                ),
              P(
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
              P(
                'span',
                {
                  key: 'c',
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--sage-deep)',
                    fontFamily: 'var(--font-body)',
                    flexShrink: 0,
                  },
                },
                'сейчас',
              ),
            !now &&
              est &&
              !done &&
              P(
                'span',
                {
                  key: 'e',
                  style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--ink-soft)',
                    flexShrink: 0,
                  },
                },
                [P(Icon, { key: 'i', name: 'clock', size: 12 }), est],
              ),
          ],
        ),
      ],
    ),
  ])
}
function S4Tree() {
  const nodes = [
    { text: 'Собрать документы', depth: 1, state: 'done', hasChildren: true },
    { text: 'Найти паспорт и СНИЛС', depth: 2, state: 'done', est: '5 мин' },
    {
      text: 'Сделать копии',
      depth: 2,
      state: 'done',
      est: '10 мин',
      last: true,
    },
    { text: 'Упаковать кухню', depth: 1, state: 'now', hasChildren: true },
    { text: 'Купить 10 коробок', depth: 2, state: 'now', est: '15 мин' },
    { text: 'Завернуть посуду', depth: 2, state: 'todo', est: '40 мин' },
    {
      text: 'Подписать коробки',
      depth: 2,
      state: 'todo',
      est: '10 мин',
      last: true,
    },
    {
      text: 'Заказать машину',
      depth: 1,
      state: 'todo',
      est: '10 мин',
      last: true,
    },
  ]
  return P(Screen, { pad: 56 }, [
    P('div', { key: 'top', style: { padding: '0 22px' } }, P(BackBtn, {})),
    P(
      'div',
      {
        key: 'head',
        style: {
          padding: '18px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        },
      },
      [
        P(Pill, { key: 'p', tone: 'sage' }, [
          P(Icon, { key: 'i', name: 'layers', size: 14 }),
          'Большое дело · разбито',
        ]),
        P('div', { key: 't', className: 'ad-h1', style: { fontSize: 26 } }, 'Организовать переезд'),
        P(
          'div',
          {
            key: 'pb',
            style: { display: 'flex', alignItems: 'center', gap: 11 },
          },
          [
            P(
              'div',
              {
                key: 'tr',
                style: {
                  flex: 1,
                  height: 9,
                  borderRadius: 999,
                  background: 'var(--sage-tint-2)',
                  overflow: 'hidden',
                },
              },
              P('div', {
                style: {
                  height: '100%',
                  width: '37%',
                  background: 'var(--accent-fill)',
                  borderRadius: 999,
                },
              }),
            ),
            P(
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
          ],
        ),
      ],
    ),
    P(
      'div',
      { key: 'tree', style: { padding: '18px 22px 0', flex: 1 } },
      nodes.map((n, i) => P(TreeNode, { key: i, ...n })),
    ),
    P(
      'div',
      {
        key: 'foot',
        style: {
          padding: '6px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
        },
      },
      [
        P(
          SoftNote,
          { key: 'n', tone: 'sage' },
          'Сейчас только «купить коробки». Остальное подождёт.',
        ),
        P(PrimaryBtn, { key: 'b', icon: 'play', label: 'Начать этот шаг' }),
      ],
    ),
  ])
}

/* ============================== S5 — REWARD-ОВЕРЛЕЙ ============================== */
function S5Reward() {
  const week = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const filled = 6
  return P(
    'div',
    {
      style: {
        position: 'relative',
        minHeight: '100%',
        background: 'var(--cream)',
      },
    },
    [
      /* faint task list behind */
      P(
        'div',
        {
          key: 'bg',
          style: {
            position: 'absolute',
            inset: 0,
            padding: '70px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            filter: 'blur(2px)',
            opacity: 0.4,
          },
        },
        [0, 1, 2].map((i) =>
          P('div', {
            key: i,
            style: {
              height: 64,
              borderRadius: 'var(--r-lg)',
              background: 'var(--card)',
              boxShadow: 'var(--shadow-sm)',
            },
          }),
        ),
      ),
      /* scrim */
      P('div', {
        key: 'scrim',
        style: {
          position: 'absolute',
          inset: 0,
          background: 'rgba(44,58,51,.34)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        },
      }),
      /* card */
      P(
        'div',
        {
          key: 'wrap',
          style: {
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          },
        },
        P(
          'div',
          {
            style: {
              width: '100%',
              background: 'var(--card)',
              borderRadius: 28,
              boxShadow: 'var(--shadow-pop)',
              padding: '34px 26px 26px',
              textAlign: 'center',
            },
          },
          [
            P(
              'div',
              {
                key: 'm',
                style: {
                  width: 96,
                  height: 96,
                  borderRadius: 999,
                  margin: '0 auto',
                  background: 'var(--reward-fill)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 30px rgba(224,168,126,.5)',
                },
              },
              P(Icon, {
                name: 'check',
                size: 50,
                color: '#fff',
                strokeWidth: 2.6,
              }),
            ),
            P(
              'div',
              {
                key: 't',
                className: 'ad-h1',
                style: { fontSize: 28, marginTop: 22 },
              },
              'Готово',
            ),
            P(
              'div',
              {
                key: 's',
                style: {
                  fontFamily: 'var(--font-body)',
                  fontSize: 15.5,
                  color: 'var(--ink-soft)',
                  marginTop: 8,
                  lineHeight: 1.5,
                },
              },
              'Маленькая победа засчитана. Спасибо, что вернулся.',
            ),
            P(
              'div',
              {
                key: 'streak',
                style: {
                  margin: '22px 0 0',
                  background: 'var(--apricot-tint)',
                  borderRadius: 'var(--r-lg)',
                  padding: '16px 18px',
                },
              },
              [
                P(
                  'div',
                  {
                    key: 'r',
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 9,
                    },
                  },
                  [
                    P(Icon, {
                      key: 'i',
                      name: 'flame',
                      size: 20,
                      color: 'var(--apricot-deep)',
                    }),
                    P(
                      'span',
                      {
                        key: 'n',
                        style: {
                          fontFamily: 'var(--font-display)',
                          fontWeight: 800,
                          fontSize: 17,
                          color: 'var(--apricot-deep)',
                        },
                      },
                      '+1 к серии · 6 дней',
                    ),
                  ],
                ),
                P(
                  'div',
                  {
                    key: 'w',
                    style: {
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 14,
                    },
                  },
                  week.map((d, i) =>
                    P(
                      'div',
                      {
                        key: d,
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                        },
                      },
                      [
                        P(
                          'div',
                          {
                            key: 'c',
                            style: {
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              background: i < filled ? 'var(--apricot)' : 'rgba(224,168,126,.28)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            },
                          },
                          i < filled &&
                            P(Icon, {
                              name: 'check',
                              size: 14,
                              color: '#fff',
                              strokeWidth: 3,
                            }),
                        ),
                        P(
                          'span',
                          {
                            key: 'l',
                            style: {
                              fontSize: 10.5,
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
            P(
              'div',
              {
                key: 'act',
                style: {
                  marginTop: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                },
              },
              [
                P(PrimaryBtn, { key: 'p', label: 'Продолжить' }),
                P(GhostBtn, {
                  key: 'g',
                  label: 'На сегодня хватит — и это здорово',
                }),
              ],
            ),
          ],
        ),
      ),
    ],
  )
}

/* ============================== S6 — ИСТОРИЯ ============================== */
function HistDay({ title, done, items, moved }) {
  return P('div', { style: { padding: '0 22px', marginBottom: 22 } }, [
    P(
      'div',
      {
        key: 'h',
        style: {
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 11,
        },
      },
      [
        P(
          'span',
          {
            key: 't',
            style: {
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 16,
              color: 'var(--ink)',
            },
          },
          title,
        ),
        P(
          'span',
          {
            key: 'd',
            style: {
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--sage-deep)',
            },
          },
          done + ' сделано',
        ),
      ],
    ),
    P(
      'div',
      {
        key: 'card',
        style: {
          background: 'var(--card)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '4px 0',
        },
      },
      [
        ...items.map((it, i) =>
          P(
            'div',
            {
              key: i,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderBottom:
                  i === items.length - 1 && !moved ? 'none' : '1px solid var(--line-card)',
              },
            },
            [
              P(
                'span',
                {
                  key: 'c',
                  style: {
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: 'var(--done)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  },
                },
                P(Icon, {
                  name: 'check',
                  size: 13,
                  color: '#fff',
                  strokeWidth: 3,
                }),
              ),
              P(
                'span',
                {
                  key: 't',
                  style: {
                    fontFamily: 'var(--font-body)',
                    fontSize: 14.5,
                    color: 'var(--ink-soft)',
                    textDecoration: 'line-through',
                  },
                },
                it,
              ),
            ],
          ),
        ),
        moved &&
          P(
            'div',
            {
              key: 'mv',
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
              },
            },
            [
              P(
                'span',
                {
                  key: 'c',
                  style: {
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: 'var(--cream-deep)',
                    color: 'var(--ink-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  },
                },
                P(Icon, { name: 'moon', size: 13 }),
              ),
              P(
                'span',
                {
                  key: 't',
                  style: {
                    fontFamily: 'var(--font-body)',
                    fontSize: 13.5,
                    color: 'var(--ink-faint)',
                    fontWeight: 600,
                  },
                },
                moved + ' перенесено на потом',
              ),
            ],
          ),
      ],
    ),
  ])
}
function S6History() {
  return P(Screen, { pad: 64 }, [
    P('div', { key: 'h', style: { padding: '0 22px', marginBottom: 22 } }, [
      P('div', { key: 't', className: 'ad-h1' }, 'История'),
      P(
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
        'Только то, что было сделано. Без счётов и долгов.',
      ),
    ]),
    P(HistDay, {
      key: 'd0',
      title: 'Сегодня',
      done: 3,
      items: ['Налить себе воды', 'Ответить на письмо', 'Прогулка 10 минут'],
      moved: 2,
    }),
    P(HistDay, {
      key: 'd1',
      title: 'Вчера',
      done: 4,
      items: ['Купить продукты', 'Помыть посуду', 'Позвонить маме', 'Зарядка'],
      moved: 1,
    }),
    P(HistDay, {
      key: 'd2',
      title: 'Понедельник',
      done: 2,
      items: ['Оплатить счета', 'Разобрать стол'],
    }),
  ])
}

/* ============================== S7 — ЧАСТЫЕ НЕВЫПОЛНЕННЫЕ ============================== */
function StuckCard({ title, days, cat }) {
  const acts = [
    ['layers', 'Разбить'],
    ['flower', 'Уменьшить'],
    ['moon', 'Отпустить'],
  ]
  return P(
    'div',
    {
      style: {
        background: 'var(--card)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 17,
      },
    },
    [
      P(
        'div',
        {
          key: 'r',
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          },
        },
        [
          P('div', { key: 'l', style: { flex: 1 } }, [
            P(
              'div',
              {
                key: 't',
                style: {
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 16.5,
                  color: 'var(--ink)',
                  lineHeight: 1.3,
                },
              },
              title,
            ),
            P(
              'div',
              {
                key: 'm',
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 7,
                  background: 'var(--softrose-tint)',
                  color: 'var(--softrose)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                },
              },
              [P(Icon, { key: 'i', name: 'moon', size: 13 }), 'ждёт ' + days + ' дн.'],
            ),
          ]),
        ],
      ),
      P(
        'div',
        { key: 'acts', style: { display: 'flex', gap: 8, marginTop: 14 } },
        acts.map(([ic, lb]) =>
          P(
            'button',
            {
              key: lb,
              style: {
                flex: 1,
                background: 'var(--cream)',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                padding: '10px 6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                color: 'var(--ink)',
              },
            },
            [
              P(Icon, {
                key: 'i',
                name: ic,
                size: 18,
                color: 'var(--sage-deep)',
              }),
              P(
                'span',
                {
                  key: 'l',
                  style: {
                    fontFamily: 'var(--font-body)',
                    fontSize: 12.5,
                    fontWeight: 700,
                  },
                },
                lb,
              ),
            ],
          ),
        ),
      ),
    ],
  )
}
function S7Stuck() {
  return P(Screen, { pad: 64 }, [
    P('div', { key: 'h', style: { padding: '0 22px', marginBottom: 18 } }, [
      P('div', { key: 't', className: 'ad-h1', style: { fontSize: 27 } }, 'Давно ждут'),
      P(
        'div',
        {
          key: 's',
          style: {
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 6,
            lineHeight: 1.5,
          },
        },
        'Эти дела переносятся чаще других. Давай облегчим их — без вины.',
      ),
    ]),
    P(
      'div',
      {
        key: 'list',
        style: {
          padding: '0 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
          flex: 1,
        },
      },
      [
        P(StuckCard, { key: 1, title: 'Записаться к стоматологу', days: 12 }),
        P(StuckCard, { key: 2, title: 'Разобрать шкаф в коридоре', days: 9 }),
        P(StuckCard, { key: 3, title: 'Прочитать договор аренды', days: 6 }),
      ],
    ),
    P(
      'div',
      { key: 'foot', style: { padding: '16px 22px 0' } },
      P(
        SoftNote,
        { tone: 'apricot', icon: 'heart' },
        'Отпустить дело — это тоже решение, а не провал.',
      ),
    ),
  ])
}

/* ============================== S9 — НАСТРОЙКИ (только тема) ============================== */
function SettingRow({ icon, title, sub, control, last }) {
  return P(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '15px 17px',
        borderBottom: last ? 'none' : '1px solid var(--line-card)',
      },
    },
    [
      P(
        'span',
        {
          key: 'i',
          style: {
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'var(--sage-tint)',
            color: 'var(--sage-deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          },
        },
        P(Icon, { name: icon, size: 19 }),
      ),
      P('div', { key: 't', style: { flex: 1 } }, [
        P(
          'div',
          {
            key: 'a',
            style: {
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 15.5,
              color: 'var(--ink)',
            },
          },
          title,
        ),
        sub &&
          P(
            'div',
            {
              key: 'b',
              style: {
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                color: 'var(--ink-soft)',
                marginTop: 1,
              },
            },
            sub,
          ),
      ]),
      control,
    ],
  )
}
function S9Settings({ dark }) {
  return P(Screen, { pad: 64 }, [
    P('div', { key: 'h', style: { padding: '0 22px', marginBottom: 20 } }, [
      P('div', { key: 't', className: 'ad-h1' }, 'Настройки'),
      P(
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
        'Спокойно и по минимуму.',
      ),
    ]),
    P(SectionLabel, { key: 'l1', style: { margin: '0 22px 11px' } }, 'Внешний вид'),
    P(
      'div',
      {
        key: 'c1',
        style: {
          margin: '0 22px',
          background: 'var(--card)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        },
      },
      [
        P(SettingRow, {
          key: 'r1',
          icon: dark ? 'moon' : 'sun',
          title: 'Тёмная тема',
          sub: dark ? 'Вечерний шалфей · включена' : 'Мягче для глаз вечером',
          control: P(Toggle, { key: 'ctl', on: dark }),
          last: true,
        }),
      ],
    ),
    P(
      'div',
      {
        key: 'note',
        style: {
          padding: '16px 24px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--ink-faint)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
        },
      },
      [
        P(Icon, { key: 'i', name: 'flower', size: 15 }),
        'Остальные настройки появятся позже — без спешки.',
      ],
    ),
    P('div', { key: 'sp', style: { flex: 1 } }),
    P(
      'div',
      {
        key: 'ver',
        style: {
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 12.5,
          color: 'var(--ink-faint)',
          fontWeight: 600,
        },
      },
      'AddyDo · версия 0.1',
    ),
  ])
}

Object.assign(window, {
  S1Empty,
  S2Today,
  S3Resistance,
  S4Tree,
  S5Reward,
  S6History,
  S7Stuck,
  S9Settings,
})
