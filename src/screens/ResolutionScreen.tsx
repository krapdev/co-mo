import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES } from '../game/data';
import { DARK } from '../game/theme';
import type { Issue } from '../game/types';
import type { ScreenProps } from './types';

const EMOJI: Record<Issue, string> = {
  'trouvé': '🎉',
  'quota épuisé': '💀',
  'indice refusé': '⛔',
};

const ISSUE_LABEL: Record<Issue, string> = {
  'trouvé': 'mot trouvé',
  'quota épuisé': 'quota épuisé',
  'indice refusé': 'indice refusé',
};

function ScoreChip({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div
      style={{
        padding: '10px 18px',
        borderRadius: 18,
        background: 'rgba(255,250,235,.9)',
        color,
      }}
    >
      <div style={{ font: F('700 14px') }}>{label}</div>
      <div style={{ font: F('800 34px/1') }}>{score}</div>
    </div>
  );
}

/** Round result, plus who opens next. */
export function ResolutionScreen({ s, send }: ScreenProps) {
  const r = s.res;
  if (!r) return null;

  const nextOpener = EQUIPES[s.opener ?? 'lichen'].court;
  const resNext = r.over
    ? 'Dernier tour joué. On compare.'
    : r.fp
      ? `Seuil franchi — ${nextOpener} ouvrent le dernier tour.`
      : s.cur?.steal
        ? `${nextOpener} gardent la main (vol).`
        : `Ouverture à ${nextOpener}.`;

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', textAlign: 'center' }}
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
        <div className="float-big" style={{ fontSize: 104, lineHeight: 1 }}>
          {EMOJI[r.issue]}
        </div>
        <div
          style={{
            font: F('700 16px'),
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {ISSUE_LABEL[r.issue]}
        </div>
        <div style={{ font: F('800 38px/1.04'), padding: '0 6px', transform: 'rotate(-1deg)' }}>
          {EQUIPES[r.gagnant].court} encaissent
        </div>
        <div style={{ font: F('800 76px/1'), marginTop: 2 }}>+{r.val}</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <ScoreChip label="les Fougères" score={s.scores.lichen} color="#1b6555" />
          <ScoreChip label="les Cendres" score={s.scores.braise} color="#8f3410" />
        </div>

        <div style={{ font: F('700 17px/1.3'), opacity: 0.9, marginTop: 14, padding: '0 6px' }}>
          {resNext}
        </div>
      </div>

      <Button
        onClick={() => send({ type: 'cont' })}
        bg="rgba(255,250,235,.95)"
        fg={DARK}
        ledge="rgba(28,18,6,.3)"
        ledgeH={6}
        style={{ minHeight: 80, borderRadius: 22, font: F('800 26px') }}
      >
        {s.gameOver ? 'Voir le vainqueur' : 'Tour suivant'}
      </Button>
    </div>
  );
}
