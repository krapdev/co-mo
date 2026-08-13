import { useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { F } from '../components/font';
import { formatLog } from '../game/engine';
import { DARK } from '../game/theme';
import type { LogEntry } from '../game/types';
import type { ScreenProps } from './types';

const line = (l: LogEntry): string =>
  [
    l.n,
    l.ouvre,
    l.donneurOuv,
    l.mot,
    l.val,
    `pari ${l.pariOuv}`,
    `contré ${l.contre}`,
    `retenu ${l.pariRetenu}`,
    l.preneur,
    l.donneurRetenu,
    l.issue,
    `coup ${l.coup}`,
    `+${l.val} ${l.points}`,
    `vol ${l.main}`,
  ].join(' | ');

/** Round-by-round log, for settling arguments after the fact. */
export function DebugScreen({ s, send }: ScreenProps) {
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const text = formatLog(s.log);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard blocked (insecure origin, denied permission) — the log stays
      // on screen and selectable, so the round history is never lost.
      return;
    }
    send({ type: 'copied', on: true });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => send({ type: 'copied', on: false }), 1600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ font: F('800 24px') }}>Log · {s.log.length} tours</div>
        <Button
          onClick={() => send({ type: 'closeDebug' })}
          flat
          bg="rgba(61,43,22,.14)"
          fg={DARK}
          style={{ minHeight: 44, padding: '0 16px', borderRadius: 14, font: F('800 17px') }}
        >
          Fermer
        </Button>
      </div>

      <div className="log-scroll">
        {s.log.map((l) => (
          <div key={l.n} className="log-row">
            {line(l)}
          </div>
        ))}
        {s.log.length === 0 && (
          <div style={{ font: F('700 17px'), opacity: 0.6, padding: '8px 2px' }}>
            Aucun tour joué.
          </div>
        )}
      </div>

      <Button
        onClick={copy}
        flat
        bg={DARK}
        fg="#f7edd4"
        style={{ minHeight: 60, font: F('800 21px') }}
      >
        {s.copied ? 'Copié ✓' : 'Copier le log'}
      </Button>
    </div>
  );
}
