import type { PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES, av } from '../game/data';
import { arbitreOf } from '../game/engine';
import { CREAM, DARK, EMBER, GOLD, MINT } from '../game/theme';
import type { ScreenProps, Send } from './types';

/** One token per guess the playing team committed to; spent ones go dark. */
function Braises({ pari, left }: { pari: number; left: number }) {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      {Array.from({ length: pari }, (_, i) => {
        const lit = i < left;
        return (
          <div
            key={i}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: lit ? EMBER : 'rgba(61,43,22,.14)',
              boxShadow: lit
                ? '0 0 0 4px rgba(232,100,31,.22),0 3px 8px rgba(160,60,10,.4)'
                : 'inset 0 2px 4px rgba(61,43,22,.25)',
            }}
          />
        );
      })}
    </div>
  );
}

/** Hold-to-peek: the arbiters can re-check the word without exposing it. */
function PeekButton({ label, send }: { label: string; send: Send }) {
  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    send({ type: 'peek', on: true });
  };
  const release = () => send({ type: 'peek', on: false });

  return (
    <Button
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onContextMenu={(e) => e.preventDefault()}
      flat
      bg="rgba(61,43,22,.1)"
      fg={DARK}
      style={{ minHeight: 56, font: F('800 20px') }}
    >
      {label}
    </Button>
  );
}

function Beat({
  kicker,
  title,
  hint,
  bg,
  fg,
  ledge,
}: {
  kicker: string;
  title: string;
  hint: string;
  bg: string;
  fg: string;
  ledge: string;
}) {
  return (
    <div
      style={{
        borderRadius: 22,
        background: bg,
        color: fg,
        padding: '16px 14px',
        textAlign: 'center',
        boxShadow: `0 6px 0 ${ledge}`,
      }}
    >
      <div
        style={{
          font: F('700 14px'),
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          opacity: 0.75,
        }}
      >
        {kicker}
      </div>
      <div style={{ font: F('800 34px/1.06'), marginTop: 4 }}>{title}</div>
      <div style={{ font: F('700 14px/1.3'), marginTop: 6, opacity: 0.8 }}>{hint}</div>
    </div>
  );
}

/** The arbiters run the round: judge each clue, then judge each answer. */
export function ArbitreScreen({ s, send }: ScreenProps) {
  const c = s.cur;
  if (!c || !c.preneur) return null;

  const arb = arbitreOf(s);
  const peekLabel = s.showWord ? (c.m ?? '') : 'voir le mot (maintenir)';

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 9 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Braises pari={c.pari ?? 0} left={s.braises} />
        <Button
          onClick={() => send({ type: 'undo' })}
          disabled={!s.undoable}
          flat
          bg="rgba(61,43,22,.1)"
          fg={DARK}
          style={{
            minHeight: 44,
            padding: '0 14px',
            borderRadius: 14,
            font: F('700 16px'),
            opacity: s.undoable ? 1 : 0.35,
          }}
        >
          ↩ annuler
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', font: F('700 15px'), opacity: 0.7 }}>
        <span>
          {EQUIPES[c.preneur].court} · {s.scores[c.preneur]}
        </span>
        <span>
          {EQUIPES[arb].court} · {s.scores[arb]}
        </span>
      </div>

      {s.phase === 'indice' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Beat
            kicker="temps 1 — l'indice"
            title={`L'indice de ${av(c.donneur).n} ?`}
            hint="banni — le mot, sa famille, plus d'un mot, les gestes"
            bg={GOLD}
            fg={DARK}
            ledge="rgba(61,43,22,.22)"
          />
          <PeekButton label={peekLabel} send={send} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 10, height: 190 }}>
            <Button
              onClick={() => send({ type: 'valide' })}
              bg="#2f9c86"
              fg="#f7f0da"
              ledge="#1b6555"
              ledgeH={7}
              style={{ flex: 1.35, borderRadius: 22, font: F('800 34px') }}
            >
              Valide
            </Button>
            <Button
              onClick={() => send({ type: 'interdit' })}
              bg={CREAM}
              fg="#8f3410"
              ledge="rgba(143,52,16,.25)"
              ledgeH={7}
              style={{
                flex: 1,
                borderRadius: 22,
                border: '3px solid #d8511f',
                font: F('800 27px'),
              }}
            >
              Interdit
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Beat
            kicker="temps 2 — la réponse"
            title={`La réponse de ${av(c.devineur).n} ?`}
            hint="à voix haute, une seule proposition"
            bg={MINT}
            fg="#1b3f38"
            ledge="rgba(27,63,56,.22)"
          />
          <PeekButton label={peekLabel} send={send} />
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 10, height: 190 }}>
            <Button
              onClick={() => send({ type: 'trouve' })}
              bg={DARK}
              fg="#ffeec2"
              ledge="rgba(28,18,6,.45)"
              ledgeH={7}
              style={{ flex: 1.35, borderRadius: 22, font: F('800 36px') }}
            >
              Trouvé
            </Button>
            <Button
              onClick={() => send({ type: 'rate' })}
              bg={CREAM}
              fg={DARK}
              ledge="rgba(61,43,22,.2)"
              ledgeH={7}
              style={{
                flex: 1,
                borderRadius: 22,
                border: '3px solid rgba(61,43,22,.35)',
                font: F('800 30px'),
              }}
            >
              Raté
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
