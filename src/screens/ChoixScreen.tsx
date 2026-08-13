import { Button } from '../components/Button';
import { F } from '../components/font';
import { av } from '../game/data';
import { CREAM, DARK, VALUE_COLORS } from '../game/theme';
import type { ScreenProps } from './types';

/** The clue-giver picks one of five words — cheap and safe, or dear and hard. */
export function ChoixScreen({ s, send }: ScreenProps) {
  const donneur = av(s.cur?.donneurOuv);

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}
    >
      <div style={{ textAlign: 'center' }}>
        <div className="float" style={{ fontSize: 46, lineHeight: 1 }}>
          {donneur.e}
        </div>
        <div style={{ font: F('800 27px/1.1'), marginTop: 2 }}>{donneur.n} choisit le mot</div>
        <div
          style={{
            font: F('700 15px'),
            opacity: 0.65,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
          }}
        >
          cinq mots, un seul
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {s.propositions.map((w) => {
          const badge = VALUE_COLORS[w.v];
          return (
            <Button
              key={`${w.m}-${w.v}`}
              onClick={() => send({ type: 'pickMot', m: w.m, v: w.v })}
              bg={CREAM}
              fg={DARK}
              ledge="rgba(61,43,22,.22)"
              style={{
                flex: 1,
                minHeight: 52,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 18px',
              }}
            >
              <span style={{ font: F('800 30px') }}>{w.m}</span>
              <span
                style={{
                  font: F('800 20px'),
                  padding: '5px 13px',
                  borderRadius: 99,
                  background: badge.bg,
                  color: badge.fg,
                }}
              >
                {w.v}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
