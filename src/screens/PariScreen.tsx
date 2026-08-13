import { Button } from '../components/Button';
import { F } from '../components/font';
import { av } from '../game/data';
import { CREAM, DARK, GOLD } from '../game/theme';
import type { Pari } from '../game/types';
import type { ScreenProps } from './types';

const BIDS: { n: Pari; label: string; bg: string; fg: string }[] = [
  // A single-coup bid cannot be undercut, so it buys immunity from the steal.
  { n: 1, label: 'coup — involable', bg: DARK, fg: '#ffeec2' },
  { n: 2, label: '2 coups', bg: GOLD, fg: DARK },
  { n: 3, label: '3 coups', bg: CREAM, fg: DARK },
];

/** The opening bid: how few guesses the team will need. */
export function PariScreen({ s, send }: ScreenProps) {
  const donneur = av(s.cur?.donneurOuv);

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            font: F('700 15px'),
            opacity: 0.7,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
          }}
        >
          {donneur.n} annonce
        </div>
        <div style={{ font: F('800 40px/1.05'), marginTop: 2 }}>
          {s.cur?.m} <span style={{ fontSize: 22, opacity: 0.6 }}>{s.cur?.v}</span>
        </div>
        <div style={{ font: F('800 25px/1.1'), marginTop: 6 }}>En combien de coups ?</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {BIDS.map((b) => (
          <Button
            key={b.n}
            onClick={() => send({ type: 'setPari', n: b.n })}
            bg={b.bg}
            fg={b.fg}
            ledge="rgba(28,18,6,.28)"
            ledgeH={6}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <span style={{ font: F('800 76px/1') }}>{b.n}</span>
            <span style={{ font: F('800 22px'), opacity: 0.85 }}>{b.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
