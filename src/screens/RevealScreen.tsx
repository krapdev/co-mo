import { Button } from '../components/Button';
import { F } from '../components/font';
import { av } from '../game/data';
import { DARK } from '../game/theme';
import type { ScreenProps } from './types';

/** The word, shown to the arbiters and the clue-giver only. */
export function RevealScreen({ s, send }: ScreenProps) {
  const c = s.cur;
  const pari = c?.pari ?? 0;
  const sub = c?.donneur
    ? `${av(c.donneur).n} mémorise · les arbitres retiennent · ${pari}${pari > 1 ? ' coups' : ' coup'}`
    : '';

  return (
    <div
      className="screen-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            font: F('700 16px'),
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          le mot à faire deviner
        </div>
        <div style={{ font: F('800 54px/1.02'), padding: '0 4px', transform: 'rotate(-1deg)' }}>
          {c?.m}
        </div>
        <div
          style={{
            font: F('800 26px'),
            padding: '6px 20px',
            borderRadius: 99,
            background: 'rgba(255,250,235,.9)',
            color: DARK,
          }}
        >
          {c?.v} points
        </div>
        <div style={{ font: F('700 18px/1.3'), opacity: 0.9, padding: '14px 12px 0' }}>{sub}</div>
      </div>

      <Button
        onClick={() => send({ type: 'toArbitre' })}
        bg="rgba(255,250,235,.95)"
        fg={DARK}
        ledge="rgba(28,18,6,.3)"
        ledgeH={6}
        style={{ width: '100%', minHeight: 80, borderRadius: 22, font: F('800 24px') }}
      >
        Mot mémorisé
      </Button>
    </div>
  );
}
