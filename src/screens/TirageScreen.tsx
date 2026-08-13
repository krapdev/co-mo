import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES } from '../game/data';
import { DARK } from '../game/theme';
import type { ScreenProps } from './types';

/** The coin toss that decides who opens the bidding. */
export function TirageScreen({ s, send }: ScreenProps) {
  return (
    <div
      className="screen-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
      }}
    >
      <div className="float-big" style={{ fontSize: 110, lineHeight: 1 }}>
        🎲
      </div>
      <div
        style={{
          font: F('800 15px'),
          letterSpacing: '.24em',
          textTransform: 'uppercase',
          opacity: 0.8,
        }}
      >
        le sort désigne
      </div>
      <div style={{ font: F('800 46px/1.02'), transform: 'rotate(-1.5deg)', padding: '0 4px' }}>
        {s.opener ? EQUIPES[s.opener].long : ''}
      </div>

      <Button
        onClick={() => send({ type: 'beginTurn' })}
        bg="rgba(255,250,235,.94)"
        fg={DARK}
        ledge="rgba(28,18,6,.3)"
        ledgeH={6}
        style={{ marginTop: 26, minHeight: 72, width: '100%', borderRadius: 20, font: F('800 26px') }}
      >
        Ouvrir le tour
      </Button>
    </div>
  );
}
