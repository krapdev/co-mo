import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES } from '../game/data';
import { COL, DARK } from '../game/theme';
import type { TeamKey } from '../game/types';
import type { ScreenProps } from './types';

function FinalCard({ team, score }: { team: TeamKey; score: number }) {
  const c = COL[team];
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 22,
        background: c.bg,
        color: c.ink,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 6px 0 ${c.deep}`,
      }}
    >
      <div style={{ font: F('800 21px') }}>{EQUIPES[team].long}</div>
      <div style={{ font: F('800 62px/1') }}>{score}</div>
    </div>
  );
}

/** Final tally. */
export function FinScreen({ s, send }: ScreenProps) {
  const { lichen, braise } = s.scores;
  const win: TeamKey | null = lichen === braise ? null : lichen > braise ? 'lichen' : 'braise';

  return (
    <div
      className="screen-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        textAlign: 'center',
        gap: 10,
      }}
    >
      <div className="float-big" style={{ fontSize: 88, lineHeight: 1 }}>
        🏆
      </div>
      <div style={{ font: F('800 34px/1.04'), transform: 'rotate(-1.4deg)' }}>
        {win ? `${EQUIPES[win].long} l’emportent` : 'Égalité parfaite'}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <FinalCard team="lichen" score={lichen} />
        <FinalCard team="braise" score={braise} />
      </div>

      <Button
        onClick={() => send({ type: 'again' })}
        bg={DARK}
        fg="#f7edd4"
        ledge="rgba(28,18,6,.4)"
        ledgeH={6}
        style={{ minHeight: 72, borderRadius: 20, font: F('800 25px') }}
      >
        Nouvelle partie
      </Button>
    </div>
  );
}
