/* AddyDo — App UI kit · shared primitives
   Exports to window: Icon, Checkbox, TaskRow, ProgressRing, StreakBadge,
   BottomNav, FAB, Sheet, Toast, CategoryChip, AppHeader  */

const I = React.createElement;

/* ---- Icon: inline Lucide paths (2px rounded stroke) ---------------- */
const ICONS = {
  check: 'M20 6 9 17l-5-5',
  plus: 'M5 12h14 M12 5v14',
  x: 'M18 6 6 18 M6 6l12 12',
  play: '',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  award: 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11',
  sparkles: 'M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
  clock: '',
  home: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .71-1.53l7-6a2 2 0 0 1 2.58 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  list: 'M3 17 5 19l4-4 M13 6h8 M13 12h8 M13 18h8',
  gift: 'M12 8v13 M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7 M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  chevronR: 'm9 18 6-6-6-6',
  chevronL: 'm15 18-6-6 6-6',
  layers: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12 M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
  settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
  calendar: 'M8 2v4 M16 2v4 M3 10h18',
  sun: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41',
  flower: 'M12 7.5a4.5 4.5 0 1 1 4.5 4.5 M12 7.5A4.5 4.5 0 1 0 7.5 12 M12 7.5V9 M7.5 12H9 M16.5 12H15 M12 16.5V15 M8 8l1.88 1.88 M14.12 9.88 16 8 M8 16l1.88-1.88 M14.12 14.12 16 16',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  eye: 'M2.06 12.34a1 1 0 0 1 0-.68 10.5 10.5 0 0 1 19.88 0 1 1 0 0 1 0 .68 10.5 10.5 0 0 1-19.88 0z',
  cloud: 'M17.5 19a4.5 4.5 0 1 0 0-9 .2.2 0 0 1-.2-.16A6 6 0 1 0 6.5 19z',
  leaf: 'M11 20A7 7 0 0 1 4 13c0-6 5-9 16-10-1 11-4 16-9 17 M11 20c0-5 2-9 7-12',
};
function Icon({ name, size = 22, color = 'currentColor', strokeWidth = 2, style = {} }) {
  const d = ICONS[name];
  const extra = [];
  if (name === 'award') extra.push(I('circle', { cx: 12, cy: 8, r: 6, key: 'c' }));
  if (name === 'clock') { extra.push(I('circle', { cx: 12, cy: 12, r: 10, key: 'c' }));
    extra.push(I('polyline', { points: '12 6 12 12 16 14', key: 'p' })); }
  if (name === 'play') extra.push(I('polygon', { points: '6 3 20 12 6 21 6 3', key: 'p', fill: color, stroke: 'none' }));
  if (name === 'list') extra.push(I('rect', { x: 3, y: 5, width: 6, height: 6, rx: 1, key: 'r' }));
  if (name === 'gift') extra.push(I('rect', { x: 3, y: 8, width: 18, height: 4, rx: 1, key: 'r' }));
  if (name === 'calendar') extra.push(I('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, key: 'r' }));
  if (name === 'sun') extra.push(I('circle', { cx: 12, cy: 12, r: 4, key: 'c' }));
  if (name === 'flower') extra.push(I('circle', { cx: 12, cy: 12, r: 3, key: 'c' }));
  if (name === 'eye') extra.push(I('circle', { cx: 12, cy: 12, r: 3, key: 'c' }));
  return I('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style,
  }, [d && I('path', { d, key: 'd' }), ...extra]);
}

/* ---- Soft round checkbox ------------------------------------------- */
function Checkbox({ done, reward, onClick, size = 28 }) {
  return I('button', {
    onClick,
    style: {
      width: size, height: size, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
      border: done ? 'none' : '2px solid var(--line-strong)',
      background: done ? (reward ? 'var(--reward-fill)' : 'var(--accent-fill)') : 'var(--card)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      boxShadow: done && reward ? '0 4px 12px rgba(224,168,126,.45)' : 'none',
      transition: 'all .22s cubic-bezier(.2,.8,.2,1)',
      transform: done ? 'scale(1)' : 'scale(1)',
    },
  }, done && I(Icon, { name: 'check', size: size * 0.58, color: '#fff', strokeWidth: 3 }));
}

/* ---- Category chip ------------------------------------------------- */
function CategoryChip({ label, color, selected, onClick }) {
  return I('button', {
    onClick,
    style: {
      display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
      padding: '8px 14px', borderRadius: 999,
      background: selected ? 'var(--sage-tint)' : 'var(--cream)',
      color: selected ? 'var(--sage-deep)' : 'var(--ink)',
      border: '1.5px solid ' + (selected ? 'var(--sage)' : 'var(--line)'),
    },
  }, [
    color && I('span', { key: 'd', style: { width: 9, height: 9, borderRadius: 999, background: color } }),
    label,
  ]);
}

/* ---- Task row ------------------------------------------------------ */
function TaskRow({ task, onToggle }) {
  const { title, catLabel, catColor, time, steps, done, rewarded } = task;
  return I('div', {
    style: {
      background: done ? 'var(--card)' : 'var(--card)', borderRadius: 'var(--r-lg)',
      boxShadow: done ? 'var(--shadow-sm)' : 'var(--shadow-md)',
      padding: '15px 16px', display: 'flex', gap: 13, alignItems: 'flex-start',
      opacity: done ? 0.78 : 1,
      transition: 'background .2s',
    },
  }, [
    I(Checkbox, { key: 'cb', done, reward: rewarded, onClick: onToggle }),
    I('div', { key: 'b', style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 } }, [
      I('div', {
        key: 't',
        style: {
          fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, lineHeight: 1.3,
          color: done ? 'var(--ink-faint)' : 'var(--ink)',
          textDecoration: done ? 'line-through' : 'none', textDecorationColor: 'var(--ink-faint)',
        },
      }, title),
      !done && (steps || time || catLabel) && I('div', {
        key: 'm', style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
      }, [
        catLabel && I('span', { key: 'c', style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' } },
          [I('span', { key: 'd', style: { width: 9, height: 9, borderRadius: 999, background: catColor } }), catLabel]),
        time && I('span', { key: 'tm', style: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' } },
          [I(Icon, { key: 'i', name: 'clock', size: 13 }), time]),
      ]),
      !done && steps && I('div', { key: 's', style: { display: 'flex', alignItems: 'center', gap: 10 } }, [
        I('div', { key: 'tr', style: { flex: 1, maxWidth: 150, height: 6, borderRadius: 999, background: 'var(--sage-tint-2)', overflow: 'hidden' } },
          I('div', { style: { height: '100%', width: (steps.done / steps.total * 100) + '%', background: 'var(--accent-fill)', borderRadius: 999 } })),
        I('span', { key: 'n', style: { fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap' } }, steps.done + ' из ' + steps.total + ' шагов'),
      ]),
      done && rewarded && I('div', { key: 'r', style: { display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 5, background: 'var(--apricot-tint)', color: 'var(--apricot-deep)', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 } },
        [I(Icon, { key: 'i', name: 'sparkles', size: 13 }), '+1 к серии']),
    ]),
  ]);
}

/* ---- Daily progress ring ------------------------------------------- */
function ProgressRing({ done, total }) {
  const pct = total ? Math.round(done / total * 100) : 0;
  return I('div', {
    style: {
      width: 78, height: 78, borderRadius: 999, flexShrink: 0,
      background: `conic-gradient(var(--sage) ${pct}%, var(--sage-tint-2) ${pct}% 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  }, I('div', { style: { width: 60, height: 60, borderRadius: 999, background: 'var(--card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }, [
    I('span', { key: 'n', style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--ink)', lineHeight: 1 } }, done + '/' + total),
    I('span', { key: 's', style: { fontSize: 10, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 2 } }, 'сегодня'),
  ]));
}

/* ---- Streak badge -------------------------------------------------- */
function StreakBadge({ days }) {
  return I('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--apricot-tint)', color: 'var(--apricot-deep)', fontSize: 13, fontWeight: 700, padding: '6px 12px', borderRadius: 999 } },
    [I(Icon, { key: 'i', name: 'flame', size: 15 }), 'Серия ' + days + ' дн.']);
}

/* ---- FAB ----------------------------------------------------------- */
function FAB({ onClick }) {
  return I('button', {
    onClick,
    style: {
      position: 'absolute', right: 20, bottom: 96, width: 60, height: 60, borderRadius: 999,
      background: 'var(--accent-fill)', border: 'none', cursor: 'pointer', zIndex: 30,
      boxShadow: '0 8px 22px rgba(124,154,146,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
  }, I(Icon, { name: 'plus', size: 28, color: '#fff', strokeWidth: 2.4 }));
}

/* ---- Bottom nav (frosted) ----------------------------------------- */
function BottomNav({ active, onNav }) {
  const tabs = [
    { id: 'home', icon: 'home', label: 'Сегодня' },
    { id: 'tasks', icon: 'list', label: 'Задачи' },
    { id: 'rewards', icon: 'award', label: 'Награды' },
    { id: 'me', icon: 'sun', label: 'Я' },
  ];
  return I('div', {
    style: {
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 25,
      paddingBottom: 26, paddingTop: 10,
      background: 'rgba(245,243,240,.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--line)',
      display: 'flex', justifyContent: 'space-around',
    },
  }, tabs.map(t => I('button', {
    key: t.id, onClick: () => onNav(t.id),
    style: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 14px',
      color: active === t.id ? 'var(--sage-deep)' : 'var(--ink-faint)' },
  }, [
    I(Icon, { key: 'i', name: t.icon, size: 23, strokeWidth: active === t.id ? 2.4 : 2 }),
    I('span', { key: 'l', style: { fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)' } }, t.label),
  ])));
}

/* ---- Bottom sheet -------------------------------------------------- */
function Sheet({ open, onClose, children }) {
  return I('div', {
    onClick: onClose,
    style: {
      position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'flex-end',
      background: open ? 'rgba(44,58,51,.28)' : 'rgba(44,58,51,0)',
      pointerEvents: open ? 'auto' : 'none', transition: 'background .28s',
    },
  }, I('div', {
    onClick: e => e.stopPropagation(),
    style: {
      width: '100%', background: 'var(--card)', borderRadius: '28px 28px 0 0',
      padding: '12px 22px 38px', boxShadow: 'var(--shadow-pop)',
      transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .32s cubic-bezier(.2,.8,.2,1)',
    },
  }, [
    I('div', { key: 'g', style: { width: 40, height: 5, borderRadius: 999, background: 'var(--line-strong)', margin: '0 auto 18px' } }),
    children,
  ]));
}

/* ---- Toast (reward) ------------------------------------------------ */
function Toast({ show, text }) {
  return I('div', {
    style: {
      position: 'absolute', left: '50%', bottom: 110, zIndex: 45,
      transform: `translateX(-50%) translateY(${show ? '0' : '12px'})`,
      opacity: show ? 1 : 0, transition: 'all .3s', pointerEvents: 'none',
      background: 'var(--ink)', color: '#fff', borderRadius: 999,
      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 9,
      boxShadow: 'var(--shadow-pop)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
    },
  }, [
    I('span', { key: 'i', style: { display: 'flex', color: 'var(--apricot)' } }, I(Icon, { name: 'sparkles', size: 17 })),
    text,
  ]);
}

Object.assign(window, {
  Icon, Checkbox, TaskRow, ProgressRing, StreakBadge, BottomNav, FAB, Sheet, Toast, CategoryChip,
});
