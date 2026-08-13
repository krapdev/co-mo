import { Button } from '../components/Button';
import { F } from '../components/font';
import { DARK } from '../game/theme';
import type { ScreenProps } from './types';

/**
 * The hand-off. The phone changes hands here, and the incoming holder swears
 * they have not seen what came before — the whole game rests on this screen.
 */
export function TamponScreen({ s, send }: ScreenProps) {
  if (!s.tp) return null;

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
        <div className="float-big" style={{ fontSize: 132, lineHeight: 1 }}>
          {s.tp.e}
        </div>
        <div style={{ font: F('800 34px/1.06'), padding: '0 6px', transform: 'rotate(-1deg)' }}>
          {s.tp.title}
        </div>
        <div style={{ font: F('700 19px/1.28'), opacity: 0.9, padding: '0 10px' }}>{s.tp.sub}</div>
      </div>

      <Button
        onClick={() => send({ type: 'tamponOk' })}
        bg="rgba(255,250,235,.95)"
        fg={DARK}
        ledge="rgba(28,18,6,.3)"
        ledgeH={6}
        style={{
          width: '100%',
          minHeight: 96,
          borderRadius: 22,
          font: F('800 22px/1.2'),
          padding: '12px 16px',
        }}
      >
        {s.tp.oath}
      </Button>
    </div>
  );
}
