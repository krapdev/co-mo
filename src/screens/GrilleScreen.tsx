import { Button } from '../components/Button';
import { F } from '../components/font';
import { AV, EQUIPES, av } from '../game/data';
import { COL, DARK } from '../game/theme';
import type { TeamKey } from '../game/types';
import type { ScreenProps } from './types';

/** Avatar draft: four champions, two per team, picked in order. */
export function GrilleScreen({ s, send, ink }: ScreenProps) {
  const setupTeam: TeamKey = s.picks.length < 2 ? 'lichen' : 'braise';
  const setupStep = (s.picks.length % 2) + 1;

  const firstSpeaker =
    s.picks.length >= 3
      ? `${av(s.picks[2]).n} parlera en premier pour ${EQUIPES.braise.long}`
      : s.picks.length >= 1
        ? `${av(s.picks[0]).n} parlera en premier pour ${EQUIPES.lichen.long}`
        : '';

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            font: F('800 13px/1'),
            letterSpacing: '.24em',
            textTransform: 'uppercase',
            opacity: 0.75,
          }}
        >
          on constitue
        </div>
        <div style={{ font: F('800 38px/1.02'), marginTop: 6, transform: 'rotate(-1.4deg)' }}>
          {EQUIPES[setupTeam].long}
        </div>
        <div style={{ font: F('700 25px/1.15'), marginTop: 2, opacity: 0.92 }}>
          champion {setupStep} sur 2
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 7,
          justifyContent: 'center',
          flexWrap: 'wrap',
          alignItems: 'center',
          minHeight: 52,
          padding: 7,
          borderRadius: 18,
          background: 'rgba(28,18,6,.16)',
        }}
      >
        {s.picks.map((id, i) => {
          const k: TeamKey = i < 2 ? 'lichen' : 'braise';
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px 5px 7px',
                borderRadius: 99,
                background: COL[k].bg,
                boxShadow: '0 3px 0 rgba(28,18,6,.25)',
              }}
            >
              <span style={{ fontSize: 25, lineHeight: 1 }}>{av(id).e}</span>
              <span style={{ font: F('800 15px'), color: COL[k].ink }}>{av(id).n}</span>
            </div>
          );
        })}
        {s.picks.length === 0 && (
          <div style={{ font: F('700 16px'), opacity: 0.6 }}>personne encore</div>
        )}
      </div>

      {firstSpeaker && (
        <div style={{ textAlign: 'center', font: F('700 16px/1.25'), opacity: 0.85, padding: '0 6px' }}>
          {firstSpeaker}
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 9,
        }}
      >
        {AV.map((a) => {
          const taken = s.picks.includes(a.id);
          return (
            <Button
              key={a.id}
              onClick={() => send({ type: 'pickAvatar', id: a.id })}
              disabled={taken}
              aria-label={a.n}
              bg={taken ? 'rgba(28,18,6,.22)' : 'rgba(255,250,235,.94)'}
              fg={taken ? ink : DARK}
              ledge="rgba(28,18,6,.22)"
              style={{
                minHeight: 44,
                borderRadius: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                opacity: taken ? 0.35 : 1,
              }}
            >
              <span className="float" style={{ fontSize: 40, lineHeight: 1 }}>
                {a.e}
              </span>
              <span style={{ font: F('800 16px/1.1') }}>{a.n}</span>
            </Button>
          );
        })}
      </div>

      <Button
        onClick={() => send({ type: 'back' })}
        disabled={s.picks.length === 0}
        flat
        bg="rgba(28,18,6,.2)"
        fg={ink}
        style={{ minHeight: 52, font: F('800 20px'), opacity: s.picks.length ? 1 : 0.4 }}
      >
        Retour
      </Button>
    </div>
  );
}
