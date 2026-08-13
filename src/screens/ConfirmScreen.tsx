import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES, av } from '../game/data';
import { COL, DARK } from '../game/theme';
import type { AvatarId, TeamKey } from '../game/types';
import type { ScreenProps } from './types';

function TeamCard({ team, members }: { team: TeamKey; members: AvatarId[] }) {
  const c = COL[team];
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 24,
        background: c.bg,
        color: c.ink,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        boxShadow: `0 7px 0 ${c.deep}`,
      }}
    >
      <div style={{ font: F('800 22px/1.05') }}>{EQUIPES[team].long}</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        {members.map((id) => (
          <div key={id} style={{ textAlign: 'center' }}>
            <div className="float" style={{ fontSize: 80, lineHeight: 1 }}>
              {av(id).e}
            </div>
            <div style={{ font: F('800 16px') }}>{av(id).n}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Line-up review — the last stop before the coin toss. */
export function ConfirmScreen({ s, send }: ScreenProps) {
  const lichen = s.picks[0] && s.picks[1] ? [s.picks[0], s.picks[1]] : [];
  const braise = s.picks[2] && s.picks[3] ? [s.picks[2], s.picks[3]] : [];

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}
    >
      <div style={{ textAlign: 'center', font: F('800 30px/1.05'), transform: 'rotate(-1deg)' }}>
        {s.savedMode ? 'Reprendre les mêmes équipes ?' : 'Voilà les équipes'}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TeamCard team="lichen" members={lichen} />
        <TeamCard team="braise" members={braise} />

        <Button
          onClick={() => send({ type: 'start' })}
          bg={DARK}
          fg="#f7edd4"
          ledge="rgba(28,18,6,.4)"
          ledgeH={6}
          style={{ minHeight: 74, borderRadius: 20, font: F('800 26px') }}
        >
          {s.savedMode ? 'Reprendre les mêmes équipes' : 'Que la partie commence'}
        </Button>

        <Button
          onClick={() => send(s.savedMode ? { type: 'change' } : { type: 'back' })}
          flat
          bg="rgba(61,43,22,.14)"
          fg={DARK}
          style={{ minHeight: 52, font: F('800 20px') }}
        >
          {s.savedMode ? 'Changer' : 'Retour'}
        </Button>
      </div>
    </div>
  );
}
