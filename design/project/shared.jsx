/* TooToo — shared screen primitives (exported to window)
   Reuses Icon/Checkbox/etc from app-components.jsx */
const S = React.createElement

/* Phone wrapper: applies a theme + drops content into the iOS frame.
   `theme` repoints CSS vars; dark-ish themes flip the status bar to white. */
const DARKISH = ['dark', 'lavender-dark', 'cyberpunk', 'amber', 'amoled']
function Phone({ theme, children, label, height }) {
  const dark = DARKISH.includes(theme)
  return S(
    'div',
    { 'data-theme': theme || undefined, style: { display: 'inline-block' } },
    S(IOSDevice, { dark, height: height || 874 }, children),
  )
}

/* Cream column root for a screen */
function Screen({ children, pad = 56, bottom = 40, scroll = false }) {
  return S(
    'div',
    {
      style: {
        position: 'relative',
        minHeight: '100%',
        boxSizing: 'border-box',
        background: 'var(--cream)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: pad,
        paddingBottom: bottom,
      },
    },
    children,
  )
}

function RoundBtn({ icon, soft }) {
  return S(
    'button',
    {
      style: {
        background: 'var(--card)',
        border: 'none',
        borderRadius: 999,
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        color: soft ? 'var(--ink-soft)' : 'var(--ink)',
        flexShrink: 0,
      },
    },
    S(Icon, { name: icon, size: 21 }),
  )
}
function BackBtn() {
  return S(RoundBtn, { icon: 'chevronL' })
}

function Overline({ children, color = 'var(--ink-soft)', style = {} }) {
  return S('div', { className: 'ad-overline', style: { color, ...style } }, children)
}
function SectionLabel({ children, style = {} }) {
  return S(
    'div',
    { className: 'ad-overline', style: { margin: '24px 22px 11px', ...style } },
    children,
  )
}

function Pill({ children, tone = 'sage' }) {
  const map = {
    sage: ['var(--sage-tint)', 'var(--sage-deep)'],
    apricot: ['var(--apricot-tint)', 'var(--apricot-deep)'],
    rose: ['var(--softrose-tint)', 'var(--softrose)'],
    gentle: ['var(--gentle-tint)', 'var(--gentle)'],
  }
  const [bg, col] = map[tone] || map.sage
  return S(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        alignSelf: 'flex-start',
        background: bg,
        color: col,
        fontSize: 13,
        fontWeight: 700,
        padding: '7px 13px',
        borderRadius: 999,
        fontFamily: 'var(--font-body)',
        lineHeight: 1,
      },
    },
    children,
  )
}

function PrimaryBtn({ icon, label, reward, onClick }) {
  return S(
    'button',
    {
      onClick,
      style: {
        width: '100%',
        boxSizing: 'border-box',
        background: reward ? 'var(--reward-fill)' : 'var(--accent-fill)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--r-md)',
        padding: 16,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 17,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        boxShadow: reward ? '0 6px 18px rgba(224,168,126,.4)' : '0 6px 18px rgba(124,154,146,.38)',
      },
    },
    [
      icon && S(Icon, { key: 'i', name: icon, size: 20, color: '#fff', strokeWidth: 2.5 }),
      S('span', { key: 'l' }, label),
    ],
  )
}
function GhostBtn({ label, onClick }) {
  return S(
    'button',
    {
      onClick,
      style: {
        background: 'transparent',
        color: 'var(--ink-soft)',
        border: 'none',
        padding: 8,
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 15,
        cursor: 'pointer',
        display: 'block',
        width: '100%',
        textAlign: 'center',
      },
    },
    label,
  )
}
function SecondaryBtn({ icon, label }) {
  return S(
    'button',
    {
      style: {
        width: '100%',
        boxSizing: 'border-box',
        background: 'var(--card)',
        color: 'var(--ink)',
        border: '1.5px solid var(--line)',
        borderRadius: 'var(--r-md)',
        padding: 15,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      },
    },
    [icon, S('span', { key: 'l' }, label)],
  )
}

function SoftNote({ children, tone = 'sage', icon = 'heart' }) {
  const map = {
    sage: ['var(--sage-tint)', 'var(--sage-deep)'],
    apricot: ['var(--apricot-tint)', 'var(--apricot-deep)'],
  }
  const [bg, col] = map[tone] || map.sage
  return S(
    'div',
    {
      style: {
        background: bg,
        color: col,
        borderRadius: 'var(--r-lg)',
        padding: '14px 17px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1.5,
        fontFamily: 'var(--font-body)',
      },
    },
    [
      S(
        'span',
        { key: 'i', style: { flexShrink: 0, marginTop: 1, display: 'flex' } },
        S(Icon, { name: icon, size: 19 }),
      ),
      S('span', { key: 't' }, children),
    ],
  )
}

/* iOS-ish toggle */
function Toggle({ on }) {
  return S(
    'span',
    {
      style: {
        width: 52,
        height: 31,
        borderRadius: 999,
        flexShrink: 0,
        background: on ? 'var(--accent-fill)' : 'var(--line-strong)',
        display: 'flex',
        alignItems: 'center',
        padding: 3,
        boxSizing: 'border-box',
        justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'all .2s',
      },
    },
    S('span', {
      style: {
        width: 25,
        height: 25,
        borderRadius: 999,
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      },
    }),
  )
}

/* big tappable choice row (resistance question, etc) */
function ChoiceRow({ icon, title, sub }) {
  return S(
    'button',
    {
      style: {
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'left',
        cursor: 'pointer',
        background: 'var(--card)',
        border: '1.5px solid var(--line)',
        borderRadius: 'var(--r-lg)',
        padding: '15px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: 'var(--shadow-sm)',
      },
    },
    [
      S(
        'span',
        {
          key: 'i',
          style: {
            width: 42,
            height: 42,
            borderRadius: 13,
            background: 'var(--sage-tint)',
            color: 'var(--sage-deep)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          },
        },
        S(Icon, { name: icon, size: 21 }),
      ),
      S('span', { key: 't', style: { flex: 1 } }, [
        S(
          'span',
          {
            key: 'a',
            style: {
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 16,
              color: 'var(--ink)',
            },
          },
          title,
        ),
        sub &&
          S(
            'span',
            {
              key: 'b',
              style: {
                display: 'block',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--ink-soft)',
                marginTop: 2,
              },
            },
            sub,
          ),
      ]),
      S(Icon, { key: 'c', name: 'chevronR', size: 19, color: 'var(--ink-faint)' }),
    ],
  )
}

Object.assign(window, {
  Phone,
  Screen,
  RoundBtn,
  BackBtn,
  Overline,
  SectionLabel,
  Pill,
  PrimaryBtn,
  GhostBtn,
  SecondaryBtn,
  SoftNote,
  Toggle,
  ChoiceRow,
})
