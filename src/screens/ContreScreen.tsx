import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES, av } from '../game/data';
import { canSteal } from '../game/engine';
import { CREAM, DARK } from '../game/theme';
import type { Pari } from '../game/types';
import type { ScreenProps } from './types';

const BIDS: Pari[] = [1, 2, 3];

/** The opposing team's chance to take the word by undercutting the bid. */
export function ContreScreen({ s, send, ink, rules }: ScreenProps) {
  const c = s.cur;
  if (!c) return null;

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 9 }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            font: F('700 15px'),
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          pari {EQUIPES[c.opener].court}
        </div>
        <div style={{ font: F('800 96px/.95') }}>{c.pariOuv}</div>
        <div style={{ font: F('800 30px/1.06'), marginTop: 2 }}>
          {c.m} · {c.v} points
        </div>
        <div style={{ font: F('700 17px/1.25'), opacity: 0.88, marginTop: 4 }}>
          {c.donneurAdv ? `${av(c.donneurAdv).n} : laisser la main, ou voler plus court` : ''}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {BIDS.map((n) => {
          const ok = canSteal(s, n, rules);
          return (
            <Button
              key={n}
              onClick={() => send({ type: 'voler', n })}
              disabled={!ok}
              bg={ok ? CREAM : 'rgba(255,250,235,.35)'}
              fg={DARK}
              ledge="rgba(28,18,6,.25)"
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                opacity: ok ? 1 : 0.45,
              }}
            >
              <span style={{ font: F('800 56px/1') }}>{n}</span>
              <span style={{ font: F('800 19px') }}>
                {ok ? `Voler en ${n}${n > 1 ? ' coups' : ' coup'}` : 'impossible'}
              </span>
            </Button>
          );
        })}
      </div>

      <Button
        onClick={() => send({ type: 'laisser' })}
        flat
        bg="rgba(28,18,6,.24)"
        fg={ink}
        style={{ minHeight: 74, borderRadius: 20, font: F('800 24px') }}
      >
        Laisser la main
      </Button>
    </div>
  );
}
